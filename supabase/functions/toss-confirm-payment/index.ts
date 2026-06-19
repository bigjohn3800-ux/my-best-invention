import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ConfirmPaymentBody = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const tossSecretKey = Deno.env.get("TOSS_SECRET_KEY") ?? "";
const appOrigin = Deno.env.get("APP_ORIGIN") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function tossAuthHeader(secretKey: string) {
  return `Basic ${btoa(`${secretKey}:`)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !tossSecretKey || !appOrigin) {
    return jsonResponse({ error: "Payment environment is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: userResult, error: userError } = await userClient.auth.getUser();

  if (userError || !userResult.user) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  let body: ConfirmPaymentBody;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.paymentKey || !body.orderId || typeof body.amount !== "number") {
    return jsonResponse({ error: "paymentKey, orderId, and amount are required" }, 400);
  }

  const { data: payment, error: paymentError } = await adminClient
    .from("payments")
    .select("id, user_id, plan_id, order_id, order_name, amount_krw, status")
    .eq("order_id", body.orderId)
    .eq("user_id", userResult.user.id)
    .single();

  if (paymentError || !payment) {
    return jsonResponse({ error: "Payment order not found" }, 404);
  }

  if (payment.status !== "pending") {
    return jsonResponse({ error: "Payment is not pending" }, 409);
  }

  if (payment.amount_krw !== body.amount) {
    await adminClient
      .from("payments")
      .update({
        status: "failed",
        failure_code: "AMOUNT_MISMATCH",
        failure_message: "Requested amount does not match stored order amount",
      })
      .eq("id", payment.id);

    return jsonResponse({ error: "Payment amount mismatch" }, 400);
  }

  const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: tossAuthHeader(tossSecretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.amount,
    }),
  });

  const tossPayload = await tossResponse.json();

  if (!tossResponse.ok) {
    await adminClient
      .from("payments")
      .update({
        status: "failed",
        payment_key: body.paymentKey,
        toss_response: tossPayload,
        failure_code: tossPayload?.code ?? "TOSS_CONFIRM_FAILED",
        failure_message: tossPayload?.message ?? "Toss payment confirmation failed",
      })
      .eq("id", payment.id);

    await adminClient.from("payment_events").insert({
      payment_id: payment.id,
      provider: "toss",
      event_type: "confirm_failed",
      payload: tossPayload,
    });

    return jsonResponse({ error: "Toss confirmation failed", details: tossPayload }, 400);
  }

  const { error: updatePaymentError } = await adminClient
    .from("payments")
    .update({
      status: "confirmed",
      payment_key: body.paymentKey,
      toss_response: tossPayload,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (updatePaymentError) {
    return jsonResponse({ error: "Payment confirmed but local update failed" }, 500);
  }

  await adminClient.from("subscriptions").upsert({
    user_id: payment.user_id,
    plan_id: payment.plan_id,
    status: "active",
    provider: "toss",
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "user_id",
  });

  await adminClient.from("payment_events").insert({
    payment_id: payment.id,
    provider: "toss",
    event_type: "confirmed",
    payload: tossPayload,
  });

  return jsonResponse({
    ok: true,
    paymentId: payment.id,
    orderId: payment.order_id,
    status: "confirmed",
    toss: tossPayload,
  });
});
