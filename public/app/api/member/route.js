import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/member?q=budi (q opsional, cari nama atau no telp)
export async function GET(req) {
  const q = req.nextUrl.searchParams.get('q');

  const [rows] = q
    ? await pool.query(
        'SELECT * FROM member WHERE nm LIKE ? OR tlpn LIKE ? ORDER BY nm',
        [`%${q}%`, `%${q}%`]
      )
    : await pool.query('SELECT * FROM member ORDER BY nm');

  return NextResponse.json(rows);
}

// POST /api/member (registrasi member baru)
export async function POST(req) {
  const { nm, tlpn = null, email = null, alamat = null } = await req.json();

  if (!nm || !nm.trim()) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }
  if (tlpn && !/^[0-9+]{8,15}$/.test(tlpn)) {
    return NextResponse.json({ error: 'No telepon tidak valid' }, { status: 400 });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 });
  }

  const [result] = await pool.query(
    'INSERT INTO member (nm, tlpn, email, alamat) VALUES (?, ?, ?, ?)',
    [nm.trim(), tlpn, email, alamat]
  );

  return NextResponse.json(
    { id_member: result.insertId, message: 'Member terdaftar' },
    { status: 201 }
  );
}