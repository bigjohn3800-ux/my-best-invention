// 토스페이먼츠 결제 연동 (서버)
// 테스트키 사용 중. 심사 완료 후 .env 의 TOSS_SECRET_KEY 만 실키로 교체하면 됨.
// 참고: https://docs.tosspayments.com/reference

const TOSS_API = "https://api.tosspayments.com/v1";

// 결제위젯 시크릿키(test_gsk_...) 또는 일반 시크릿키(test_sk_...) 모두 사용 가능.
export function getSecretKey(): string {
  return process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
}

function authHeader(): string {
  // Basic base64("<secretKey>:")  — 비밀번호는 비움
  const token = Buffer.from(`${getSecretKey()}:`).toString("base64");
  return `Basic ${token}`;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method?: string;
  approvedAt?: string;
  [key: string]: any;
}

// 결제 승인: 위젯/리다이렉트에서 받은 paymentKey, orderId, amount 로 최종 승인
export async function confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.message || `토스 결제 승인 실패 (${res.status})`;
    const err = new Error(msg) as Error & { code?: string; status?: number };
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data as TossPayment;
}

// 결제 조회(웹훅 검증/대사용)
export async function fetchPaymentByKey(paymentKey: string): Promise<TossPayment> {
  const res = await fetch(`${TOSS_API}/payments/${encodeURIComponent(paymentKey)}`, {
    headers: { Authorization: authHeader() },
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(data?.message || "결제 조회 실패");
  return data as TossPayment;
}
