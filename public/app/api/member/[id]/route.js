import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = await params;
  const [rows] = await pool.query('SELECT * FROM member WHERE id_member = ?', [id]);

  if (!rows[0]) {
    return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}