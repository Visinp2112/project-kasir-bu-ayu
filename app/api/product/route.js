import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/product?kategori=Minuman (kategori opsional)
export async function GET(req) {
  const kategori = req.nextUrl.searchParams.get('kategori');
  const base = `SELECT p.*, UNIX_TIMESTAMP(f.diubah) AS foto_v
                FROM product p LEFT JOIN product_foto f ON f.id_barang = p.id_barang`;

  const [rows] = kategori
    ? await pool.query(`${base} WHERE p.type_kategori = ? ORDER BY p.nm_barang`, [kategori])
    : await pool.query(`${base} ORDER BY p.nm_barang`);

  return NextResponse.json(rows);
}

// POST /api/product (admin)
export async function POST(req) {
  const { nm_barang, harga, stok = 0, type_kategori = null } = await req.json();

  if (!nm_barang || !Number.isInteger(harga) || harga <= 0) {
    return NextResponse.json({ error: 'Nama & harga (angka > 0) wajib diisi' }, { status: 400 });
  }
  if (!Number.isInteger(stok) || stok < 0) {
    return NextResponse.json({ error: 'Stok tidak valid' }, { status: 400 });
  }

  const [result] = await pool.query(
    'INSERT INTO product (nm_barang, harga, stok, type_kategori) VALUES (?, ?, ?, ?)',
    [nm_barang, harga, stok, type_kategori]
  );

  return NextResponse.json({ id_barang: result.insertId, message: 'Barang ditambahkan' }, { status: 201 });
}