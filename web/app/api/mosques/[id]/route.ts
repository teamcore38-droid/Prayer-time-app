import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Mosque from '@/models/Mosque';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await segmentData.params;
    const mosque = await Mosque.findById(params.id);

    if (!mosque) {
      return NextResponse.json(
        { error: 'Mosque not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mosque, { status: 200 });
  } catch (error: any) {
    console.error('Fetch mosque by id error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const params = await segmentData.params;
    const mosqueId = params.id;

    const tokenPayload = verifyAuthRequest(request);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    // Role-based protection: Must be super_admin, or mosque_admin assigned to this mosque
    if (tokenPayload.role !== 'super_admin') {
      if (tokenPayload.role !== 'mosque_admin' || tokenPayload.mosqueId !== mosqueId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to modify this mosque' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const mosque = await Mosque.findById(mosqueId);

    if (!mosque) {
      return NextResponse.json(
        { error: 'Mosque not found' },
        { status: 404 }
      );
    }

    // Update allowable fields
    const fieldsToUpdate = [
      'mosqueName',
      'address',
      'city',
      'district',
      'country',
      'phone',
      'email',
      'logo',
      'latitude',
      'longitude',
      'jumuahSessions'
    ];

    fieldsToUpdate.forEach((field) => {
      if (body[field] !== undefined) {
        mosque[field] = body[field];
      }
    });

    await mosque.save();
    return NextResponse.json(mosque, { status: 200 });
  } catch (error: any) {
    console.error('Update mosque error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
