import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const HOME = { admin: '/admin/barang', petugas: '/kasir' };

function allowedRoles(pathname, method) {
  if (pathname.startsWith('/api/user')) return ['admin'];
  if (pathname.startsWith('/api/product')) return method === 'GET' ? ['admin', 'petugas'] : ['admin'];
  if (
    pathname.startsWith('/api/member') ||
    pathname.startsWith('/api/transaksi') ||
    pathname.startsWith('/api/laporan')
  ) return ['petugas'];
  if (pathname.startsWith('/admin')) return ['admin'];
  if (pathname.startsWith('/kasir') || pathname.startsWith('/member') || pathname.startsWith('/laporan')) return ['petugas'];
  return ['admin', 'petugas'];
}

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api');

  if (pathname === '/api/login' || pathname === '/api/logout') return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  const payload = token ? await verifyToken(token) : null;

  // ===== halaman =====
  if (!isApi) {
    if (pathname === '/login') {
      return payload
        ? NextResponse.redirect(new URL(HOME[payload.role], req.url))
        : NextResponse.next();
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL(payload ? HOME[payload.role] : '/login', req.url));
    }
    if (!payload) return NextResponse.redirect(new URL('/login', req.url));
    if (!allowedRoles(pathname, req.method).includes(payload.role)) {
      return NextResponse.redirect(new URL(HOME[payload.role], req.url));
    }
    return NextResponse.next();
  }

  // ===== API =====
  if (!payload) return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  if (!allowedRoles(pathname, req.method).includes(payload.role)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const headers = new Headers(req.headers);
  headers.set('x-user-id', String(payload.id_user));
  headers.set('x-role', payload.role);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/', '/login', '/kasir/:path*', '/member/:path*', '/laporan/:path*', '/admin/:path*', '/api/:path*'],
};