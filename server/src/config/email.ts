import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initializeEmailService = () => {
  try {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      throw new Error('Email configuration missing in environment variables (expected EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS or EMAIL_PASSWORD)');
    }

    if (!process.env.EMAIL_PASS && process.env.EMAIL_PASSWORD) {
      console.warn('⚠️  EMAIL_PASS is missing; falling back to EMAIL_PASSWORD for SMTP auth');
    }

    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    console.log('✅ Email service initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    throw error;
  }
};

export const getEmailTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    return initializeEmailService();
  }
  return transporter;
};

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: Date;
  items: Array<{
    name: string;
    size: string;
    color?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData): Promise<void> => {
  try {
    const emailTransporter = getEmailTransporter();

    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          Size: ${item.size}
          ${item.color ? `<br/><span style="color: #666; font-size: 13px;">Color: ${item.color}</span>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">×${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    const mailOptions = {
      from: `"Naikfoods" <${process.env.EMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #02013f; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.customerName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for shopping with Naikfoods! Your order has been confirmed and is being processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #02013f;">
              <h2 style="color: #02013f; margin-top: 0;">Order Details</h2>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${data.orderId}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #02013f; margin-top: 0;">Order Items</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 10px; text-align: right;">₹${data.subtotal.toLocaleString()}</td>
                </tr>
                <tr style="background: #f0f0f0;">
                  <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
                  <td style="padding: 15px; text-align: right; font-size: 18px; color: #02013f;"><strong>₹${data.total.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #02013f; margin-top: 0;">Shipping Address</h2>
              <p style="margin: 5px 0;">${data.shippingAddress.fullName}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.phone}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.address}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}</p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Return & Cancellation Policy:</strong></p>
              <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #856404; font-size: 13px; line-height: 1.5;">
                <li>We do not accept returns or exchanges for issues related to satisfaction, color variation, or size.</li>
                <li>Orders once placed cannot be cancelled.</li>
                <li>Returns or exchanges will be accepted only if a damaged product is received.</li>
                <li>Any damage claim must be reported within 24–48 hours of receiving the product.</li>
                <li>A clear 360° parcel opening video is mandatory to process any damage claim.</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions about your order, please contact us at . naikfoods001@gmail.com.com</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Thank you for choosing Naikfoods!</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br>Naikfoods Team</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Naikfoods. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    // Don't throw error - email failure shouldn't break the order flow
  }
};

export const sendLoginNotificationEmail = async (email: string, displayName?: string): Promise<void> => {
  try {
    const emailTransporter = getEmailTransporter();
    const mailOptions = {
      from: `"Naikfoods" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Security Alert: New Sign-in Detected',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Sign-in Detected</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a1a1a; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Sign-in Detected 🔑</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${displayName || 'Valued Customer'},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">A new sign-in was detected for your Naikfoods account at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.</p>
            <p style="font-size: 16px; margin-bottom: 20px;">If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately or contact support.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Naikfoods Team</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Naikfoods. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Login notification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send login notification email:', error);
  }
};

interface OrderStatusEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderStatus: string;
  estimatedDelivery?: Date;
  trackingNumber?: string;
}

export const sendOrderStatusUpdateEmail = async (data: OrderStatusEmailData): Promise<void> => {
  try {
    const emailTransporter = getEmailTransporter();
    
    let statusText = data.orderStatus.toUpperCase();
    let statusIcon = '📦';
    let statusColor = '#02013f';
    
    switch (data.orderStatus) {
      case 'confirmed':
        statusText = 'CONFIRMED';
        statusIcon = '✅';
        statusColor = '#28a745';
        break;
      case 'processing':
        statusText = 'PROCESSING';
        statusIcon = '⚙️';
        statusColor = '#17a2b8';
        break;
      case 'shipped':
        statusText = 'SHIPPED';
        statusIcon = '🚚';
        statusColor = '#fd7e14';
        break;
      case 'delivered':
        statusText = 'DELIVERED';
        statusIcon = '🎉';
        statusColor = '#28a745';
        break;
      case 'cancelled':
        statusText = 'CANCELLED';
        statusIcon = '❌';
        statusColor = '#dc3545';
        break;
      case 'returned':
        statusText = 'RETURNED';
        statusIcon = 'RETURNED';
        statusColor = '#6f42c1';
        break;
    }

    let extraDetails = '';
    if (data.trackingNumber) {
      extraDetails += `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>`;
    }
    if (data.estimatedDelivery) {
      extraDetails += `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(data.estimatedDelivery).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>`;
    }

    const mailOptions = {
      from: `"Naikfoods" <${process.env.EMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Order Status Update: ${statusText} - ${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${statusColor}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Order Status Update ${statusIcon}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.customerName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">The status of your order <strong>${data.orderId}</strong> has been updated to <strong>${statusText}</strong>.</p>
            
            ${extraDetails ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h2 style="color: ${statusColor}; margin-top: 0; font-size: 18px;">Delivery Details</h2>
              ${extraDetails}
            </div>
            ` : ''}

            <p style="font-size: 14px; color: #666; margin-top: 30px;">You can track the status of your order anytime in the Orders tab of your account.</p>
            <p style="font-size: 16px; margin-top: 30px;">Thank you for shopping with Naikfoods!</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br>Naikfoods Team</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Naikfoods. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Order status update email sent to ${data.customerEmail} (${statusText})`);
  } catch (error) {
    console.error('❌ Failed to send order status update email:', error);
  }
};

export { OrderEmailData, OrderStatusEmailData };
