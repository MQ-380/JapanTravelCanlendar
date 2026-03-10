import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'zh', 'ja'];

function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language');
  console.log('[Middleware] Received Accept-Language:', acceptLanguage);
  if (!acceptLanguage) return 'en';

  // Parse accept-language header to respect priority
  // Example: 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7'
  const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim().toLowerCase());
  console.log('[Middleware] Parsed Languages:', languages);
  
  for (const lang of languages) {
    if (lang.startsWith('ja')) { console.log('[Middleware] Selected:', 'ja'); return 'ja'; }
    if (lang.startsWith('zh')) { console.log('[Middleware] Selected:', 'zh'); return 'zh'; }
    if (lang.startsWith('en')) { console.log('[Middleware] Selected:', 'en'); return 'en'; }
  }

  console.log('[Middleware] Fallback Selected:', 'en');
  return 'en';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the pathname is an internal file or API
  if (
    pathname.includes('.') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  
  // Construct the new URL with the locale
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) and static files
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\..*).*)',
  ],
};
