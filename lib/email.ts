import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    department: string;
  };
}

export interface TrackingEmailData {
  orderId: string;
  customerEmail: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString('es-CO')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #ffd624; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIMITØ</h1>
          </div>
          <div class="content">
            <h2>¡Gracias por tu compra!</h2>
            <p>Hola ${data.shippingAddress.name},</p>
            <p>Tu pedido <strong>#${data.orderId}</strong> ha sido confirmado.</p>
            
            <h3>Resumen del Pedido:</h3>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 8px; text-align: left;">Producto</th>
                  <th style="padding: 8px; text-align: center;">Cantidad</th>
                  <th style="padding: 8px; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right;">Subtotal:</td>
                  <td style="padding: 8px; text-align: right;">$${data.subtotal.toLocaleString('es-CO')}</td>
                </tr>
                ${data.discount > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right; color: #16a34a;">Descuento:</td>
                  <td style="padding: 8px; text-align: right; color: #16a34a;">-$${data.discount.toLocaleString('es-CO')}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 8px; text-align: right;">Envío:</td>
                  <td style="padding: 8px; text-align: right;">${data.shipping === 0 ? 'GRATIS' : '$' + data.shipping.toLocaleString('es-CO')}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2" style="padding: 12px 8px; text-align: right; border-top: 2px solid #000;">Total:</td>
                  <td style="padding: 12px 8px; text-align: right; border-top: 2px solid #000;">$${data.total.toLocaleString('es-CO')} COP</td>
                </tr>
              </tbody>
            </table>

            <h3>Dirección de Envío:</h3>
            <p>
              ${data.shippingAddress.name}<br>
              ${data.shippingAddress.phone}<br>
              ${data.shippingAddress.address}<br>
              ${data.shippingAddress.city}, ${data.shippingAddress.department}
            </p>

            <p>Recibirás un email con el número de rastreo cuando tu pedido sea enviado.</p>
          </div>
          <div class="footer">
            <p>LIMITØ - Ediciones Limitadas<br>
            ¿Preguntas? Contáctanos en ${process.env.CONTACT_EMAIL}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return resend.emails.send({
    from: `LIMITØ <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: data.customerEmail,
    subject: `Confirmación de Pedido #${data.orderId} - LIMITØ`,
    html
  });
}

export async function sendPartnerNotification(data: OrderEmailData) {
  const itemsText = data.items.map(item => 
    `${item.name} x${item.quantity} = $${item.price.toLocaleString('es-CO')}`
  ).join('\n');

  const text = `
NUEVO PEDIDO - #${data.orderId}

CLIENTE:
${data.shippingAddress.name}
${data.shippingAddress.phone}
${data.customerEmail}

DIRECCIÓN DE ENVÍO:
${data.shippingAddress.address}
${data.shippingAddress.city}, ${data.shippingAddress.department}

PRODUCTOS:
${itemsText}

TOTALES:
Subtotal: $${data.subtotal.toLocaleString('es-CO')}
${data.discount > 0 ? `Descuento: -$${data.discount.toLocaleString('es-CO')}\n` : ''}Envío: ${data.shipping === 0 ? 'GRATIS' : '$' + data.shipping.toLocaleString('es-CO')}
TOTAL: $${data.total.toLocaleString('es-CO')} COP

---
Accede al panel admin para actualizar el estado y número de guía.
  `;

  return resend.emails.send({
    from: `LIMITØ Orders <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: process.env.PARTNER_EMAIL!,
    subject: `🚨 Nuevo Pedido #${data.orderId}`,
    text
  });
}

export async function sendTrackingEmail(data: TrackingEmailData) {
  const trackingLink = data.trackingUrl || `https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastreo-de-envios/?guia=${data.trackingNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: #ffd624; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .tracking-box { background: #fff; border: 2px solid #ffd624; padding: 20px; margin: 20px 0; text-align: center; }
          .tracking-number { font-size: 1.5em; font-weight: bold; color: #000; margin: 10px 0; }
          .btn { display: inline-block; background: #000; color: #ffd624; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIMITØ</h1>
          </div>
          <div class="content">
            <h2>¡Tu pedido está en camino! 📦</h2>
            <p>Tu pedido <strong>#${data.orderId}</strong> ha sido enviado.</p>
            
            <div class="tracking-box">
              <p>Número de Guía:</p>
              <div class="tracking-number">${data.trackingNumber}</div>
              <p>Transportadora: <strong>${data.carrier}</strong></p>
              <a href="${trackingLink}" class="btn">Rastrear Pedido</a>
            </div>

            <p>Puedes rastrear tu pedido en cualquier momento usando el número de guía.</p>
          </div>
          <div class="footer">
            <p>LIMITØ - Ediciones Limitadas<br>
            ¿Preguntas? Contáctanos en ${process.env.CONTACT_EMAIL}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return resend.emails.send({
    from: `LIMITØ <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to: data.customerEmail,
    subject: `Tu pedido #${data.orderId} está en camino 📦`,
    html
  });
}

export async function subscribeToNewsletter(email: string, name?: string) {
  // Create contact in Resend Audiences
  return resend.contacts.create({
    email,
    firstName: name,
    audienceId: process.env.RESEND_AUDIENCE_ID!
  });
}
