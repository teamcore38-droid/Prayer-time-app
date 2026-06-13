import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mosque from '@/models/Mosque';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const filter: any = {};

    if (city) {
      filter.city = { $regex: new RegExp(city, 'i') };
    }

    if (search) {
      filter.mosqueName = { $regex: new RegExp(search, 'i') };
    }

    const mosques = await Mosque.find(filter).sort({ mosqueName: 1 });
    return NextResponse.json(mosques, { status: 200 });
  } catch (error: any) {
    console.error('Fetch mosques error:', error);
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

    // Verify token and ensure user is Super Admin
    if (!tokenPayload || tokenPayload.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only Super Admin can register new mosques' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      mosqueName,
      address,
      city,
      district,
      country,
      phone,
      email,
      logo,
      latitude,
      longitude,
      jumuahSessions,
    } = body;

    if (!mosqueName || !address || !city || !district || !country || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Required fields missing: mosqueName, address, city, district, country, latitude, longitude' },
        { status: 400 }
      );
    }

    const newMosque = await Mosque.create({
      mosqueName,
      address,
      city,
      district,
      country,
      phone,
      email,
      logo: logo || '',
      latitude,
      longitude,
      jumuahSessions: jumuahSessions || [],
    });

    return NextResponse.json(newMosque, { status: 201 });
  } catch (error: any) {
    console.error('Create mosque error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
