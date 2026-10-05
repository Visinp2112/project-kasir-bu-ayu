import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT /api/product/1/stok  body: {"stok": 50}  -> stok jadi 50
export async function PUT(req, { params }) {
  const { id } = await params;
  const { stok } = await req.json();

  if (!Number.isInteger(stok) || stok < 0) {
    return NextResponse.json({ error: 'Stok harus angka >= 0' }, { status: 400 });
  }

  const [result] = await pool.query('UPDATE product SET stok = ? WHERE id_barang = ?', [stok, id]);

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Stok diupdate', stok });
}