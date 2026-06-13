import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SpecialPrayer from '@/models/SpecialPrayer';
import { verifyAuthRequest } from '@/lib/auth';

export async function DELETE(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await segmentData.params;
    const specialPrayerId = params.id;

    const tokenPayload = verifyAuthRequest(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const specialPrayer = await SpecialPrayer.findById(specialPrayerId);
    if (!specialPrayer) {
      return NextResponse.json(
        { error: 'Special prayer event not found' },
        { status: 404 }
      );
    }

    // Auth verification: Super Admin, or Mosque Admin for this mosque
    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== specialPrayer.mosqueId.toString()) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to delete this event' },
          { status: 403 }
        );
      }
    }

    await SpecialPrayer.findByIdAndDelete(specialPrayerId);
    return NextResponse.json({ message: 'Special prayer deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete special prayer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
