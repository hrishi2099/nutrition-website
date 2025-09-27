import { NextRequest, NextResponse } from 'next/server';
import pdfService from '@/lib/pdf/pdfService';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId } = await params;

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    // Validate download request
    const validation = pdfService.validateDownload(purchaseId);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 403 }
      );
    }

    // Get purchase details
    const purchase = pdfService.getPurchase(purchaseId);
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Record the download
    pdfService.recordDownload(purchaseId);

    // For demo purposes, we'll return a sample PDF or redirect to a file
    // In production, you would serve the actual PDF file from storage

    // Check if this is a preview request
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    if (preview) {
      // Return download information without triggering download
      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          downloadCount: purchase.downloadCount,
          maxDownloads: purchase.maxDownloads,
          remainingDownloads: purchase.maxDownloads - purchase.downloadCount,
          expiryDate: purchase.expiryDate,
          status: purchase.status
        },
        message: 'Download information retrieved successfully'
      });
    }

    // Simulate PDF file path (in production, this would be from purchase.product.pdfInfo.filePath)
    const samplePdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
50 750 Td
(Thank you for your purchase from NutriSap!) Tj
0 -20 Td
(This is a sample PDF document.) Tj
0 -20 Td
(Purchase ID: ${purchase.id}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000356 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
506
%%EOF`;

    // Return the PDF file
    return new NextResponse(samplePdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nutrisap-${purchase.productId}-${purchase.id}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json(
      { error: 'Failed to download PDF' },
      { status: 500 }
    );
  }
}

// Get download status/info
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  try {
    const { purchaseId } = await params;
    const { action } = await request.json();

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    const purchase = pdfService.getPurchase(purchaseId);
    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    if (action === 'check_status') {
      const validation = pdfService.validateDownload(purchaseId);

      return NextResponse.json({
        success: true,
        purchase: {
          id: purchase.id,
          downloadCount: purchase.downloadCount,
          maxDownloads: purchase.maxDownloads,
          remainingDownloads: purchase.maxDownloads - purchase.downloadCount,
          expiryDate: purchase.expiryDate,
          status: purchase.status,
          canDownload: validation.valid
        },
        validation
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('PDF status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check PDF status' },
      { status: 500 }
    );
  }
}