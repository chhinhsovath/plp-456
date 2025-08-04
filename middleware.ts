import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all routes - no authentication restrictions  
  // Completely disabled auth - let everything through
  return NextResponse.next();
}

// Completely disable middleware
// export const config = {
//   matcher: [
//     // Match all paths except static files
//     '/((?!_next/static|_next/image|favicon.ico).*)',
//   ],
// };