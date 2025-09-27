import { PdfPurchase, PdfProductInfo, Product, EmailDelivery } from '@/types/product';

class PdfService {
  private purchases: Map<string, PdfPurchase> = new Map();
  private emailQueue: Map<string, EmailDelivery> = new Map();

  // Create a new PDF purchase
  createPurchase(
    userId: string,
    productId: string,
    orderId: string,
    product: Product
  ): PdfPurchase {
    const purchaseId = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const downloadLink = `/api/pdf/download/${purchaseId}`;

    const purchase: PdfPurchase = {
      id: purchaseId,
      userId,
      productId,
      orderId,
      downloadLink,
      downloadCount: 0,
      maxDownloads: product.pdfInfo?.downloadLimit || 5,
      purchaseDate: new Date().toISOString(),
      expiryDate: product.pdfInfo?.expiryDays
        ? new Date(Date.now() + product.pdfInfo.expiryDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      status: 'active',
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchases.set(purchaseId, purchase);
    return purchase;
  }

  // Get purchase by ID
  getPurchase(purchaseId: string): PdfPurchase | undefined {
    return this.purchases.get(purchaseId);
  }

  // Get user's purchases
  getUserPurchases(userId: string): PdfPurchase[] {
    return Array.from(this.purchases.values())
      .filter(purchase => purchase.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Validate download request
  validateDownload(purchaseId: string): { valid: boolean; reason?: string } {
    const purchase = this.purchases.get(purchaseId);

    if (!purchase) {
      return { valid: false, reason: 'Purchase not found' };
    }

    if (purchase.status !== 'active') {
      return { valid: false, reason: 'Purchase is not active' };
    }

    if (purchase.downloadCount >= purchase.maxDownloads) {
      return { valid: false, reason: 'Download limit exceeded' };
    }

    if (purchase.expiryDate && new Date() > new Date(purchase.expiryDate)) {
      purchase.status = 'expired';
      purchase.updatedAt = new Date().toISOString();
      this.purchases.set(purchaseId, purchase);
      return { valid: false, reason: 'Download link has expired' };
    }

    return { valid: true };
  }

  // Record a download
  recordDownload(purchaseId: string): boolean {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) return false;

    purchase.downloadCount += 1;
    purchase.updatedAt = new Date().toISOString();
    this.purchases.set(purchaseId, purchase);
    return true;
  }

  // Create email delivery record
  createEmailDelivery(
    purchaseId: string,
    recipientEmail: string,
    subject: string,
    content: string,
    attachments: any[] = []
  ): EmailDelivery {
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const emailDelivery: EmailDelivery = {
      id: emailId,
      purchaseId,
      recipientEmail,
      subject,
      content,
      attachments,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.emailQueue.set(emailId, emailDelivery);
    return emailDelivery;
  }

  // Update email delivery status
  updateEmailStatus(
    emailId: string,
    status: EmailDelivery['status'],
    failureReason?: string
  ): boolean {
    const email = this.emailQueue.get(emailId);
    if (!email) return false;

    email.status = status;
    email.updatedAt = new Date().toISOString();

    if (status === 'sent') {
      email.sentAt = new Date().toISOString();
    }

    if (status === 'failed' && failureReason) {
      email.failureReason = failureReason;
      email.retryCount += 1;
    }

    this.emailQueue.set(emailId, email);
    return true;
  }

  // Get pending emails
  getPendingEmails(): EmailDelivery[] {
    return Array.from(this.emailQueue.values())
      .filter(email => email.status === 'pending' || email.status === 'retrying')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Mark purchase email as sent
  markEmailSent(purchaseId: string): boolean {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) return false;

    purchase.emailSent = true;
    purchase.updatedAt = new Date().toISOString();
    this.purchases.set(purchaseId, purchase);
    return true;
  }

  // Get all purchases (admin)
  getAllPurchases(): PdfPurchase[] {
    return Array.from(this.purchases.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Revoke purchase access
  revokePurchase(purchaseId: string): boolean {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) return false;

    purchase.status = 'revoked';
    purchase.updatedAt = new Date().toISOString();
    this.purchases.set(purchaseId, purchase);
    return true;
  }

  // Extend purchase expiry
  extendPurchase(purchaseId: string, additionalDays: number): boolean {
    const purchase = this.purchases.get(purchaseId);
    if (!purchase) return false;

    const currentExpiry = purchase.expiryDate ? new Date(purchase.expiryDate) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    purchase.expiryDate = newExpiry.toISOString();
    purchase.updatedAt = new Date().toISOString();
    this.purchases.set(purchaseId, purchase);
    return true;
  }
}

export default new PdfService();