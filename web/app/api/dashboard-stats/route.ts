import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Mosque from '@/models/Mosque';
import PrayerTime from '@/models/PrayerTime';
import SpecialPrayer from '@/models/SpecialPrayer';
import Announcement from '@/models/Announcement';
import NotificationDevice from '@/models/NotificationDevice';
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

    if (tokenPayload.role === 'super_admin') {
      // Global Platform Statistics
      const [usersCount, mosquesCount, devicesCount, prayersCount] = await Promise.all([
        User.countDocuments(),
        Mosque.countDocuments(),
        NotificationDevice.countDocuments(),
        PrayerTime.countDocuments(),
      ]);

      return NextResponse.json({
        scope: 'global',
        stats: {
          users: usersCount,
          mosques: mosquesCount,
          devices: devicesCount,
          prayers: prayersCount,
        },
      }, { status: 200 });
    } else if (tokenPayload.role === 'mosque_admin') {
      const mosqueId = tokenPayload.mosqueId;
      if (!mosqueId) {
        return NextResponse.json(
          { error: 'Forbidden: Admin is not assigned to any mosque' },
          { status: 403 }
        );
      }

      // Mosque-specific Statistics
      const [membersCount, specialsCount, noticesCount, subscribersCount] = await Promise.all([
        User.countDocuments({ mosqueId }),
        SpecialPrayer.countDocuments({ mosqueId }),
        Announcement.countDocuments({ mosqueId }),
        NotificationDevice.countDocuments({ subscribedMosques: mosqueId }),
      ]);

      return NextResponse.json({
        scope: 'mosque',
        mosqueId,
        stats: {
          users: membersCount,
          specialPrayers: specialsCount,
          announcements: noticesCount,
          devices: subscribersCount,
        },
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
