import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Mosque from '@/models/Mosque';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const tokenPayload = verifyAuthRequest(request);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const user = await User.findById(tokenPayload.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Populate mosque details if user is associated with a mosque
    let mosque = null;
    if (user.mosqueId) {
      mosque = await Mosque.findById(user.mosqueId);
    }

    return NextResponse.json({ user, mosque }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
