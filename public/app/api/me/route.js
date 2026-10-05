import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const token = (await cookies()).get('token')?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }

  const [rows] = await pool.query(
    'SELECT id_user, username, role FROM user WHERE id_user = ?',
    [payload.id_user]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}