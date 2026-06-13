import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const tokenPayload = verifyAuthRequest(request);

    if (!tokenPayload || tokenPayload.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Access restricted to Super Admins' },
        { status: 403 }
      );
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Fetch users error:', error);
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

    if (!tokenPayload || tokenPayload.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Access restricted to Super Admins' },
        { status: 403 }
      );
    }

    const { userId, role, mosqueId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (role !== undefined) {
      userToUpdate.role = role;
    }

    if (mosqueId !== undefined) {
      userToUpdate.mosqueId = mosqueId || null;
    }

    await userToUpdate.save();

    const updatedUser = {
      id: userToUpdate._id,
      name: userToUpdate.name,
      email: userToUpdate.email,
      role: userToUpdate.role,
      mosqueId: userToUpdate.mosqueId,
    };

    return NextResponse.json(
      { message: 'User updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
