import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req, { params }) {
  const { id } = await params;

  const [rows] = await pool.query(
    `SELECT t.id_transaksi, t.tgl, t.total_bayar, t.bayar, t.kembalian,
            u.username AS petugas, m.nm AS member
     FROM transaksi t
     JOIN user u ON u.id_user = t.id_user
     LEFT JOIN member m ON m.id_member = t.id_member
     WHERE t.id_transaksi = ?`,
    [id]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  const [items] = await pool.query(
    `SELECT p.nm_barang, d.jumlah, d.harga_satuan,
            d.jumlah * d.harga_satuan AS subtotal
     FROM detail_transaksi d
     JOIN product p ON p.id_barang = d.id_barang
     WHERE d.id_transaksi = ?`,
    [id]
  );

  return NextResponse.json({ ...rows[0], items });
}