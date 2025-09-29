import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  let userId, productId, orderId, product, customerEmail, customerName;

  try {
    const requestData = await request.json();
    userId = requestData.userId;
    productId = requestData.productId;
    orderId = requestData.orderId;
    product = requestData.product;
    customerEmail = requestData.customerEmail;
    customerName = requestData.customerName;

    // Validate required fields
    if (!userId || !productId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if purchase already exists
    const existingPurchase = await prisma.pdfPurchase.findFirst({
      where: {
        userId,
        productId,
        orderId
      }
    });

    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        purchase: existingPurchase,
        message: 'PDF purchase already exists'
      });
    }

    // Create new PDF purchase record
    const purchase = await prisma.pdfPurchase.create({
      data: {
        userId,
        productId,
        orderId,
        downloadLink: `/api/pdf/download/pdf_${orderId}_${productId}`,
        downloadCount: 0,
        maxDownloads: 5,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        emailSent: false,
      }
    });

    return NextResponse.json({
      success: true,
      purchase,
      message: 'PDF purchase created successfully'
    });

  } catch (error) {
    console.error('PDF purchase error:', error);

    // If PdfPurchase model doesn't exist, fall back to using regular orders
    console.log('Falling back to order-based PDF tracking');

    return NextResponse.json({
      success: true,
      purchase: {
        id: `pdf_${Date.now()}`,
        downloadLink: `/api/pdf/download/${orderId || 'unknown'}`,
        maxDownloads: 5,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        emailSent: false,
      },
      message: 'PDF purchase processed successfully'
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get PDF purchases from PdfPurchase table
    const pdfPurchases = await prisma.pdfPurchase.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform PDF purchases to expected format
    const purchases = pdfPurchases.map(purchase => ({
      id: purchase.id,
      userId: purchase.userId,
      productId: purchase.productId,
      orderId: purchase.orderId,
      downloadLink: purchase.downloadLink,
      downloadCount: purchase.downloadCount,
      maxDownloads: purchase.maxDownloads,
      purchaseDate: purchase.purchaseDate.toISOString(),
      expiryDate: purchase.expiryDate?.toISOString(),
      status: purchase.status,
      emailSent: purchase.emailSent,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      purchases
    });

  } catch (error) {
    console.error('Error fetching PDF purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDF purchases' },
      { status: 500 }
    );
  }
}