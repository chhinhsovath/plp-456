import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ valid: false });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ valid: false });
    }
    
    return NextResponse.json({ 
      valid: true,
      payload 
    });
  } catch (error) {
    return NextResponse.json({ valid: false });
  }
}