import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/login', 
  '/register', 
  '/api/:path*',
  '/sso-callback',
  '/mfa-verification'
])

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return
  auth().protect()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
