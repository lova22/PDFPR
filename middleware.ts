import createMiddleware from 'next-intl/middleware';
import {routing} from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(ar|en|fr|hi|pt|id|es|ru|vi|fil|it|bn)/:path*']
};
