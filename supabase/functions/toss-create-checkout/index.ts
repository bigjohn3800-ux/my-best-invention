import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateCheckoutBody = {
  planId: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const tossClientKey = Deno.env.get("TOSS_CLIENT_KEY") ?? "";
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

function createOrderId() {
  const random = crypto.randomUUID().replaceAll("-", "");
  return `ivh_${random.slice(0, 24)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !tossClientKey || !appOrigin) {
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

  let body: CreateCheckoutBody;

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.planId) {
    return jsonResponse({ error: "planId is required" }, 400);
  }

  const { data: plan, error: planError } = await adminClient
    .from("plans")
    .select("id, name, price_krw, active")
    .eq("id", body.planId)
    .single();

  if (planError || !plan) {
    return jsonResponse({ error: "Plan not found" }, 404);
  }

  if (!plan.active || plan.price_krw <= 0) {
    return jsonResponse({ error: "Plan is not available for paid checkout" }, 400);
  }

  const orderId = createOrderId();
  const orderName = `Invention Ventures Hub - ${plan.name}`;

  const { data: payment, error: paymentError } = await adminClient
    .from("payments")
    .insert({
      user_id: userResult.user.id,
      plan_id: plan.id,
      order_id: orderId,
      order_name: orderName,
      amount_krw: plan.price_krw,
      status: "pending",
      provider: "toss",
    })
    .select("id, order_id, order_name, amount_krw")
    .single();

  if (paymentError || !payment) {
    return jsonResponse({ error: "Failed to create payment" }, 500);
  }

  return jsonResponse({
    paymentId: payment.id,
    clientKey: tossClientKey,
    orderId: payment.order_id,
    orderName: payment.order_name,
    amount: payment.amount_krw,
    customerEmail: userResult.user.email,
    customerName: userResult.user.user_metadata?.name ?? userResult.user.user_metadata?.full_name ?? "",
  });
});
