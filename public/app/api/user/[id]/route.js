import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

async function cariPetugas(id) {
  const [rows] = await pool.query('SELECT id_user, role FROM user WHERE id_user = ?', [id]);
  return rows[0] && rows[0].role === 'petugas' ? rows[0] : null;
}

// PUT: reset password petugas
export async function PUT(req, { params }) {
  const { id } = await params;
  const { password } = await req.json();

  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }
  if (!(await cariPetugas(id))) {
    return NextResponse.json({ error: 'Petugas tidak ditemukan' }, { status: 404 });
  }

  await pool.query('UPDATE user SET password = ? WHERE id_user = ?', [await bcrypt.hash(password, 10), id]);
  return NextResponse.json({ message: 'Password diubah' });
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  if (!(await cariPetugas(id))) {
    return NextResponse.json({ error: 'Petugas tidak ditemukan' }, { status: 404 });
  }

  try {
    await pool.query('DELETE FROM user WHERE id_user = ?', [id]);
    return NextResponse.json({ message: 'Akun dihapus' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json({ error: 'Petugas sudah punya riwayat transaksi, tidak bisa dihapus' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}