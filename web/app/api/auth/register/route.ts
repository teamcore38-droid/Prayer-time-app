import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password, role, mosqueId } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required fields' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Determine the role. The first registered user can be a super admin,
    // or let it default to community_user unless specified (or if it's the very first user, promote to super_admin).
    const userCount = await User.countDocuments();
    let assignedRole = role || 'community_user';
    if (userCount === 0) {
      assignedRole = 'super_admin';
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      mosqueId: mosqueId || null,
    });

    // Sign a token
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      mosqueId: newUser.mosqueId ? newUser.mosqueId.toString() : null,
    });

    const userObj = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      mosqueId: newUser.mosqueId,
    };

    return NextResponse.json({ token, user: userObj }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
