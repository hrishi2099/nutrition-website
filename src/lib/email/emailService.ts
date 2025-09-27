import { EmailDelivery, EmailAttachment, PdfPurchase, Product } from '@/types/product';

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
}

class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
      from: {
        name: process.env.FROM_NAME || 'NutriSap',
        email: process.env.FROM_EMAIL || 'noreply@nutrisap.com',
      },
    };
  }

  // Generate PDF purchase email content
  generatePdfPurchaseEmail(
    purchase: PdfPurchase,
    product: Product,
    customerName: string
  ): { subject: string; html: string; text: string } {
    const subject = `Your ${product.name} is ready for download - NutriSap`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Purchase Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .download-button { display: inline-block; background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .download-button:hover { background: #059669; }
          .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; border-left: 4px solid #F59E0B; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your PDF is Ready!</h1>
            <p>Thank you for your purchase from NutriSap</p>
          </div>

          <div class="content">
            <h2>Hi ${customerName},</h2>
            <p>Your purchase of <strong>${product.name}</strong> has been processed successfully!</p>

            <div class="info-box">
              <h3>📄 Product Details</h3>
              <p><strong>Title:</strong> ${product.name}</p>
              <p><strong>Description:</strong> ${product.description}</p>
              ${product.pdfInfo?.pageCount ? `<p><strong>Pages:</strong> ${product.pdfInfo.pageCount}</p>` : ''}
              ${product.pdfInfo?.author ? `<p><strong>Author:</strong> ${product.pdfInfo.author}</p>` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}${purchase.downloadLink}" class="download-button">
                📥 Download Your PDF
              </a>
            </div>

            <div class="warning">
              <h4>⚠️ Important Download Information</h4>
              <ul>
                <li><strong>Download Limit:</strong> ${purchase.maxDownloads} downloads allowed</li>
                <li><strong>Downloads Used:</strong> ${purchase.downloadCount}/${purchase.maxDownloads}</li>
                ${purchase.expiryDate ? `<li><strong>Expires:</strong> ${new Date(purchase.expiryDate).toLocaleDateString()}</li>` : '<li><strong>Validity:</strong> Lifetime access</li>'}
                <li><strong>Purchase ID:</strong> ${purchase.id}</li>
              </ul>
            </div>

            <div class="info-box">
              <h3>📋 How to Download</h3>
              <ol>
                <li>Click the download button above</li>
                <li>You'll be redirected to a secure download page</li>
                <li>The PDF will start downloading automatically</li>
                <li>Save the file to your preferred location</li>
              </ol>
            </div>

            <p><strong>Need Help?</strong><br>
            If you have any issues downloading your PDF or need support, please contact us at
            <a href="mailto:support@nutrisap.com">support@nutrisap.com</a> with your purchase ID.</p>

            <div class="footer">
              <p>Thank you for choosing NutriSap for your nutrition needs!</p>
              <p>This email was sent to confirm your PDF purchase. Please keep this email for your records.</p>
              <hr>
              <p>© ${new Date().getFullYear()} NutriSap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${customerName},

Your purchase of "${product.name}" has been processed successfully!

Download your PDF here: ${process.env.NEXT_PUBLIC_BASE_URL}${purchase.downloadLink}

Important Information:
- Download Limit: ${purchase.maxDownloads} downloads allowed
- Downloads Used: ${purchase.downloadCount}/${purchase.maxDownloads}
${purchase.expiryDate ? `- Expires: ${new Date(purchase.expiryDate).toLocaleDateString()}` : '- Validity: Lifetime access'}
- Purchase ID: ${purchase.id}

How to Download:
1. Click the download link above
2. You'll be redirected to a secure download page
3. The PDF will start downloading automatically
4. Save the file to your preferred location

Need help? Contact us at support@nutrisap.com with your purchase ID.

Thank you for choosing NutriSap!
    `;

    return { subject, html, text };
  }

  // Send PDF purchase email (simulated)
  async sendPdfPurchaseEmail(
    purchase: PdfPurchase,
    product: Product,
    recipientEmail: string,
    customerName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { subject, html, text } = this.generatePdfPurchaseEmail(purchase, product, customerName);

      // In a real implementation, you would use a service like Nodemailer, SendGrid, or AWS SES
      // For now, we'll simulate the email sending process
      console.log('📧 Sending PDF purchase email:', {
        to: recipientEmail,
        subject,
        purchaseId: purchase.id,
        productName: product.name,
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate random success/failure for demo purposes
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('✅ Email sent successfully:', messageId);
        return { success: true, messageId };
      } else {
        console.log('❌ Email sending failed');
        return { success: false, error: 'SMTP connection failed' };
      }
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(
    order: any,
    customerEmail: string,
    customerName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subject = `Order Confirmation #${order.id} - NutriSap`;

      console.log('📧 Sending order confirmation email:', {
        to: customerEmail,
        subject,
        orderId: order.id,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 500));
      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return { success: true, messageId };
      } else {
        return { success: false, error: 'Order confirmation email failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  // Process email queue
  async processEmailQueue(emails: EmailDelivery[]): Promise<void> {
    for (const email of emails) {
      if (email.retryCount >= 3) {
        console.log(`❌ Email ${email.id} exceeded retry limit`);
        continue;
      }

      try {
        // Simulate email processing
        console.log(`📤 Processing email ${email.id} to ${email.recipientEmail}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const success = Math.random() > 0.1;
        if (success) {
          console.log(`✅ Email ${email.id} sent successfully`);
        } else {
          console.log(`❌ Email ${email.id} failed to send`);
        }
      } catch (error) {
        console.error(`Email processing error for ${email.id}:`, error);
      }
    }
  }
}

export default new EmailService();