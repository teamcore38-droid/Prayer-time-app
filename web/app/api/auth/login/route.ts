import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Sign the JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      mosqueId: user.mosqueId ? user.mosqueId.toString() : null,
    });

    const userObj = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mosqueId: user.mosqueId,
    };

    return NextResponse.json({ token, user: userObj }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
