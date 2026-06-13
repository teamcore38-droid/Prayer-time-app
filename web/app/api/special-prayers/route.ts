import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SpecialPrayer from '@/models/SpecialPrayer';
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

    const specialPrayers = await SpecialPrayer.find({ mosqueId }).sort({ date: 1, iqamahTime: 1 });
    return NextResponse.json(specialPrayers, { status: 200 });
  } catch (error: any) {
    console.error('Fetch special prayers error:', error);
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
    const { mosqueId, title, date, adhanTime, iqamahTime, description } = body;

    if (!mosqueId || !title || !date || !iqamahTime) {
      return NextResponse.json(
        { error: 'Required fields missing: mosqueId, title, date, iqamahTime' },
        { status: 400 }
      );
    }

    // Auth verification
    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== mosqueId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to post special prayers for this mosque' },
          { status: 403 }
        );
      }
    }

    const newSpecial = await SpecialPrayer.create({
      mosqueId,
      title,
      date,
      adhanTime,
      iqamahTime,
      description,
    });

    return NextResponse.json(newSpecial, { status: 201 });
  } catch (error: any) {
    console.error('Create special prayer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
