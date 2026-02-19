import {
  sendOrderConfirmation,
  sendPartnerNotification,
  sendTrackingEmail,
  subscribeToNewsletter,
  type OrderEmailData,
  type TrackingEmailData,
} from '../email';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-123' }),
    },
    contacts: {
      create: jest.fn().mockResolvedValue({ id: 'contact-123' }),
    },
  })),
}));

describe('email', () => {
  const mockOrderData: OrderEmailData = {
    orderId: 'ORD-123',
    customerEmail: 'customer@test.com',
    customerName: 'John Doe',
    items: [
      { name: 'Test Cap', color: 'Black', quantity: 2, price: 80000 },
    ],
    subtotal: 160000,
    shipping: 8000,
    discount: 0,
    total: 168000,
    shippingAddress: {
      name: 'John Doe',
      phone: '3001234567',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      department: 'Cundinamarca',
    },
  };

  const mockTrackingData: TrackingEmailData = {
    orderId: 'ORD-123',
    customerEmail: 'customer@test.com',
    trackingNumber: '123456789',
    carrier: 'Coordinadora',
  };

  beforeAll(() => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'test@limitohats.com';
    process.env.CONTACT_EMAIL = 'limitohats@gmail.com';
    process.env.PARTNER_EMAIL = 'partner@limitohats.com';
    process.env.RESEND_AUDIENCE_ID = 'audience-123';
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const result = await sendOrderConfirmation(mockOrderData);
      expect(result).toHaveProperty('id');
    });

    it('should include discount in email when present', async () => {
      const dataWithDiscount = { ...mockOrderData, discount: 10000 };
      const result = await sendOrderConfirmation(dataWithDiscount);
      expect(result).toHaveProperty('id');
    });

    it('should show free shipping when shipping is 0', async () => {
      const dataWithFreeShipping = { ...mockOrderData, shipping: 0 };
      const result = await sendOrderConfirmation(dataWithFreeShipping);
      expect(result).toHaveProperty('id');
    });
  });

  describe('sendPartnerNotification', () => {
    it('should send partner notification email', async () => {
      const result = await sendPartnerNotification(mockOrderData);
      expect(result).toHaveProperty('id');
    });

    it('should include all order details', async () => {
      const result = await sendPartnerNotification(mockOrderData);
      expect(result).toHaveProperty('id');
    });
  });

  describe('sendTrackingEmail', () => {
    it('should send tracking email with default URL', async () => {
      const result = await sendTrackingEmail(mockTrackingData);
      expect(result).toHaveProperty('id');
    });

    it('should use custom tracking URL when provided', async () => {
      const dataWithUrl = {
        ...mockTrackingData,
        trackingUrl: 'https://custom-tracking.com/123',
      };
      const result = await sendTrackingEmail(dataWithUrl);
      expect(result).toHaveProperty('id');
    });
  });

  describe('subscribeToNewsletter', () => {
    it('should subscribe email to newsletter', async () => {
      const result = await subscribeToNewsletter('test@example.com');
      expect(result).toHaveProperty('id');
    });

    it('should include name when provided', async () => {
      const result = await subscribeToNewsletter('test@example.com', 'John Doe');
      expect(result).toHaveProperty('id');
    });
  });
});
