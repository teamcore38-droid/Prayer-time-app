import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NotificationDevice from '@/models/NotificationDevice';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { fcmToken, platform, subscribedMosques, userId } = await request.json();

    if (!fcmToken || !platform) {
      return NextResponse.json(
        { error: 'Required fields missing: fcmToken, platform' },
        { status: 400 }
      );
    }

    // Upsert device registration
    const updatedDevice = await NotificationDevice.findOneAndUpdate(
      { fcmToken },
      {
        fcmToken,
        platform,
        userId: userId || null,
        $addToSet: subscribedMosques ? { subscribedMosques: { $each: subscribedMosques } } : undefined,
      },
      { upsert: true, new: true }
    );

    // If subscribedMosques was sent as a full array replacement rather than addition,
    // let's update it if requested. We can support it by checking if we need to set the list.
    if (subscribedMosques && Array.isArray(subscribedMosques)) {
      updatedDevice.subscribedMosques = subscribedMosques;
      await updatedDevice.save();
    }

    return NextResponse.json(
      { message: 'Device registered successfully', device: updatedDevice },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Device registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
