import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function coba(nama, ssl) {
  const t = Date.now();
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      connectTimeout: 5000,
      ssl,
    });
    const [rows] = await conn.query('SELECT COUNT(*) AS n FROM user');
    await conn.end();
    return { nama, ok: true, ms: Date.now() - t, jumlah_user: rows[0].n };
  } catch (err) {
    return { nama, ok: false, ms: Date.now() - t, code: err.code, message: err.message };
  }
}

export async function GET() {
  const info = {
    host: process.env.DB_HOST || null,
    port: process.env.DB_PORT || null,
    user: process.env.DB_USER || null,
    db: process.env.DB_NAME || null,
    panjang_password: (process.env.DB_PASS || '').length,
    DB_SSL: process.env.DB_SSL || null,
    region_vercel: process.env.VERCEL_REGION || null,
  };
  const hasil = [
    await coba('tanpa SSL', undefined),
    await coba('SSL tanpa verifikasi', { rejectUnauthorized: false }),
  ];
  return NextResponse.json({ info, hasil });
}