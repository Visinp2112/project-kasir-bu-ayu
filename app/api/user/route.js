import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function GET() {
  const [rows] = await pool.query(
    "SELECT id_user, username, role FROM user WHERE role = 'petugas' ORDER BY username"
  );
  return NextResponse.json(rows);
}

export async function POST(req) {
  const { username, password } = await req.json();
  const u = String(username || '').trim();

  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(u)) {
    return NextResponse.json({ error: 'Username 3-30 karakter (huruf, angka, _ atau .)' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      "INSERT INTO user (username, password, role) VALUES (?, ?, 'petugas')",
      [u, hash]
    );
    return NextResponse.json({ id_user: r.insertId, message: 'Akun petugas dibuat' }, { status: 201 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}