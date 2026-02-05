import { createHash } from 'crypto';

const PAYU_MERCHANT_ID = process.env.PAYU_MERCHANT_ID || '';
const PAYU_API_KEY = process.env.PAYU_API_KEY || '';
const PAYU_API_LOGIN = process.env.PAYU_API_LOGIN || '';
const PAYU_ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID || '';
const PAYU_TEST_MODE = process.env.PAYU_TEST_MODE === 'true';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const PAYU_API_URL = PAYU_TEST_MODE 
  ? 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi'
  : 'https://api.payulatam.com/payments-api/4.0/service.cgi';

export interface PayUOrder {
  orderId: string;
  amount: number;
  tax: number;
  description: string;
  buyerEmail: string;
  buyerFullName: string;
}

export function generateSignature(referenceCode: string, amount: number): string {
  const amountStr = amount.toFixed(1);
  const signatureString = `${PAYU_API_KEY}~${PAYU_MERCHANT_ID}~${referenceCode}~${amountStr}~COP`;
  return createHash('md5').update(signatureString).digest('hex');
}

export function validateSignature(signature: string, referenceCode: string, amount: number, transactionState: string): boolean {
  const amountStr = amount.toFixed(1);
  const signatureString = `${PAYU_API_KEY}~${PAYU_MERCHANT_ID}~${referenceCode}~${amountStr}~COP~${transactionState}`;
  const expectedSignature = createHash('md5').update(signatureString).digest('hex');
  return signature === expectedSignature;
}

export function createPaymentForm(order: PayUOrder): string {
  const signature = generateSignature(order.orderId, order.amount);
  const responseUrl = `${BASE_URL}/checkout/response`;
  const confirmationUrl = `${BASE_URL}/api/webhooks/payu`;

  return `
    <form method="post" action="https://checkout.payulatam.com/ppp-web-gateway-payu/" id="payuForm">
      <input name="merchantId" type="hidden" value="${PAYU_MERCHANT_ID}">
      <input name="accountId" type="hidden" value="${PAYU_ACCOUNT_ID}">
      <input name="description" type="hidden" value="${order.description}">
      <input name="referenceCode" type="hidden" value="${order.orderId}">
      <input name="amount" type="hidden" value="${order.amount}">
      <input name="tax" type="hidden" value="${order.tax}">
      <input name="taxReturnBase" type="hidden" value="${(order.amount - order.tax).toFixed(2)}">
      <input name="currency" type="hidden" value="COP">
      <input name="signature" type="hidden" value="${signature}">
      <input name="test" type="hidden" value="${PAYU_TEST_MODE ? '1' : '0'}">
      <input name="buyerEmail" type="hidden" value="${order.buyerEmail}">
      <input name="buyerFullName" type="hidden" value="${order.buyerFullName}">
      <input name="responseUrl" type="hidden" value="${responseUrl}">
      <input name="confirmationUrl" type="hidden" value="${confirmationUrl}">
      <input name="Submit" type="submit" value="Pagar con PayU">
    </form>
    <script>document.getElementById('payuForm').submit();</script>
  `;
}

export async function createPaymentRequest(order: PayUOrder) {
  const signature = generateSignature(order.orderId, order.amount);
  
  const payload = {
    language: 'es',
    command: 'SUBMIT_TRANSACTION',
    merchant: {
      apiKey: PAYU_API_KEY,
      apiLogin: PAYU_API_LOGIN,
    },
    transaction: {
      order: {
        accountId: PAYU_ACCOUNT_ID,
        referenceCode: order.orderId,
        description: order.description,
        language: 'es',
        signature,
        notifyUrl: `${BASE_URL}/api/webhooks/payu`,
        additionalValues: {
          TX_VALUE: {
            value: order.amount,
            currency: 'COP',
          },
          TX_TAX: {
            value: order.tax,
            currency: 'COP',
          },
          TX_TAX_RETURN_BASE: {
            value: order.amount - order.tax,
            currency: 'COP',
          },
        },
        buyer: {
          emailAddress: order.buyerEmail,
          fullName: order.buyerFullName,
        },
      },
      type: 'AUTHORIZATION_AND_CAPTURE',
      paymentMethod: 'PSE',
      paymentCountry: 'CO',
      ipAddress: '127.0.0.1',
    },
    test: PAYU_TEST_MODE,
  };

  const response = await fetch(PAYU_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

export function getPaymentUrl(orderId: string, amount: number, tax: number, description: string, buyerEmail: string, buyerFullName: string): string {
  const signature = generateSignature(orderId, amount);
  const responseUrl = `${BASE_URL}/checkout/response`;
  const confirmationUrl = `${BASE_URL}/api/webhooks/payu`;
  
  const params = new URLSearchParams({
    merchantId: PAYU_MERCHANT_ID,
    accountId: PAYU_ACCOUNT_ID,
    description,
    referenceCode: orderId,
    amount: amount.toString(),
    tax: tax.toString(),
    taxReturnBase: (amount - tax).toFixed(2),
    currency: 'COP',
    signature,
    test: PAYU_TEST_MODE ? '1' : '0',
    buyerEmail,
    buyerFullName,
    responseUrl,
    confirmationUrl,
  });

  return `https://checkout.payulatam.com/ppp-web-gateway-payu/?${params.toString()}`;
}

export function parsePayUResponse(body: any) {
  return {
    merchantId: body.merchant_id,
    referenceCode: body.reference_sale,
    transactionId: body.transaction_id,
    state: body.state_pol,
    responseCode: body.response_code_pol,
    amount: parseFloat(body.value),
    currency: body.currency,
    signature: body.sign,
    buyerEmail: body.email_buyer,
  };
}

export function getTransactionStatus(stateCode: string): 'approved' | 'pending' | 'declined' | 'error' | 'expired' {
  switch (stateCode) {
    case '4': return 'approved';
    case '6': return 'declined';
    case '5': return 'expired';
    case '7': return 'pending';
    default: return 'error';
  }
}
