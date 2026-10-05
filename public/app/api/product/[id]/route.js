import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = await params;
  const [rows] = await pool.query('SELECT * FROM product WHERE id_barang = ?', [id]);

  if (!rows[0]) {
    return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

// PUT: edit nama, harga, kategori (stok lewat endpoint khusus)
export async function PUT(req, { params }) {
  const { id } = await params;
  const { nm_barang, harga, type_kategori = null } = await req.json();

  if (!nm_barang || !Number.isInteger(harga) || harga <= 0) {
    return NextResponse.json({ error: 'Nama & harga (angka > 0) wajib diisi' }, { status: 400 });
  }

  const [result] = await pool.query(
    'UPDATE product SET nm_barang = ?, harga = ?, type_kategori = ? WHERE id_barang = ?',
    [nm_barang, harga, type_kategori, id]
  );

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Barang diupdate' });
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  try {
    const [result] = await pool.query('DELETE FROM product WHERE id_barang = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Barang dihapus' });
  } catch (err) {
    // barang yang udah pernah terjual ga boleh dihapus (kepake di detail_transaksi)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json(
        { error: 'Barang sudah pernah terjual, tidak bisa dihapus' },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}