import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PrayerTime from '@/models/PrayerTime';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const mosqueId = searchParams.get('mosqueId');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const month = searchParams.get('month'); // YYYY-MM

    if (!mosqueId) {
      return NextResponse.json(
        { error: 'mosqueId query parameter is required' },
        { status: 400 }
      );
    }

    const filter: any = { mosqueId };

    if (date) {
      filter.date = date;
      const prayer = await PrayerTime.findOne(filter);
      return NextResponse.json(prayer ? [prayer] : [], { status: 200 });
    }

    if (month) {
      // Find dates starting with the month prefix e.g., "2026-06"
      filter.date = { $regex: new RegExp(`^${month}`) };
    }

    const prayers = await PrayerTime.find(filter).sort({ date: 1 });
    return NextResponse.json(prayers, { status: 200 });
  } catch (error: any) {
    console.error('Fetch prayers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const isArray = Array.isArray(body);
    const items = isArray ? body : [body];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Empty payload' },
        { status: 400 }
      );
    }

    // Check permissions on the first element (assuming all elements are for the same mosque)
    const targetMosqueId = items[0].mosqueId;
    if (!targetMosqueId) {
      return NextResponse.json(
        { error: 'mosqueId is required' },
        { status: 400 }
      );
    }

    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== targetMosqueId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to manage prayers for this mosque' },
          { status: 403 }
        );
      }
    }

    const operations = items.map((item) => {
      const { date, sunrise, fajr, dhuhr, asr, maghrib, isha } = item;
      return PrayerTime.findOneAndUpdate(
        { mosqueId: targetMosqueId, date },
        { date, sunrise, fajr, dhuhr, asr, maghrib, isha },
        { upsert: true, new: true, runValidators: true }
      );
    });

    const results = await Promise.all(operations);
    return NextResponse.json(
      { message: `Successfully updated ${results.length} dates`, data: isArray ? results : results[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update prayers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
