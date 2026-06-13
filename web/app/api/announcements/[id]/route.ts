import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import { verifyAuthRequest } from '@/lib/auth';

export async function DELETE(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await segmentData.params;
    const announcementId = params.id;

    const tokenPayload = verifyAuthRequest(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Auth verification: Super Admin, or Mosque Admin for this mosque
    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== announcement.mosqueId.toString()) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to delete this announcement' },
          { status: 403 }
        );
      }
    }

    await Announcement.findByIdAndDelete(announcementId);
    return NextResponse.json({ message: 'Announcement deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
