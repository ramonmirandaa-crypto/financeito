import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === '/healthz') {
    url.pathname = '/api/health';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/healthz'],
};
