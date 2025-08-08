import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // pages that require auth:
    const protectedPrefixes = ['/profile', '/cv'];

    if (protectedPrefixes.some(p => req.nextUrl.pathname.startsWith(p))) {
        const token = req.cookies.get('authToken')?.value;
        if (!token) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/profile/:path*', '/cv/:path*'], // <— add CV here
};
