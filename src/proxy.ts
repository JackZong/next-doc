import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const middleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return middleware(request);
}

export default proxy;

export const config = {
  // 匹配所有路径，除了 api, _next 和静态文件
  matcher: ['/', '/(zh-CN|zh-TW|en|ja|ru)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
