import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const mosqueId = searchParams.get('mosqueId');

    if (!mosqueId) {
      return NextResponse.json(
        { error: 'mosqueId query parameter is required' },
        { status: 400 }
      );
    }

    const announcements = await Announcement.find({ mosqueId }).sort({ createdAt: -1 });
    return NextResponse.json(announcements, { status: 200 });
  } catch (error: any) {
    console.error('Fetch announcements error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const tokenPayload = verifyAuthRequest(request);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mosqueId, title, description, image, category } = body;

    if (!mosqueId || !title || !description) {
      return NextResponse.json(
        { error: 'Required fields missing: mosqueId, title, description' },
        { status: 400 }
      );
    }

    // Auth verification
    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== mosqueId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to post announcements for this mosque' },
          { status: 403 }
        );
      }
    }

    const newAnnouncement = await Announcement.create({
      mosqueId,
      title,
      description,
      image: image || '',
      category: category || 'General',
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error: any) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
