import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const MAX = 500 * 1024; // 500KB

export async function GET(req, { params }) {
  const { id } = await params;
  const [rows] = await pool.query('SELECT tipe, data FROM product_foto WHERE id_barang = ?', [id]);
  if (!rows[0]) return new NextResponse(null, { status: 404 });
  return new NextResponse(rows[0].data, {
    headers: { 'Content-Type': rows[0].tipe, 'Cache-Control': 'private, max-age=86400' },
  });
}

// PUT: body = file JPEG mentah (admin only, diatur proxy)
export async function PUT(req, { params }) {
  const { id } = await params;
  const buf = Buffer.from(await req.arrayBuffer());

  if (buf.length === 0 || buf.length > MAX) {
    return NextResponse.json({ error: 'Ukuran foto maksimal 500KB' }, { status: 400 });
  }
  // cek magic bytes JPEG (FF D8)
  if (buf[0] !== 0xff || buf[1] !== 0xd8) {
    return NextResponse.json({ error: 'Foto harus berformat JPEG' }, { status: 400 });
  }

  try {
    await pool.query('REPLACE INTO product_foto (id_barang, tipe, data) VALUES (?, ?, ?)', [id, 'image/jpeg', buf]);
    return NextResponse.json({ message: 'Foto tersimpan' });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  await pool.query('DELETE FROM product_foto WHERE id_barang = ?', [id]);
  return NextResponse.json({ message: 'Foto dihapus' });
}