import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/session';

class ValidasiError extends Error {}

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }
  if (session.role !== 'petugas') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }
  const idUser = Number(session.id_user);

  const { items, bayar, id_member = null } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    const detail = [];

    for (const it of items) {
      const jumlah = Number(it.jumlah);
      if (!Number.isInteger(jumlah) || jumlah <= 0) {
        throw new ValidasiError('Jumlah tidak valid');
      }

      // FOR UPDATE: kunci baris biar 2 kasir ga rebutan stok yang sama
      const [rows] = await conn.query(
        'SELECT nm_barang, harga, stok FROM product WHERE id_barang = ? FOR UPDATE',
        [it.id_barang]
      );
      const barang = rows[0];

      if (!barang) throw new ValidasiError('Barang tidak ditemukan');
      if (barang.stok < jumlah) {
        throw new ValidasiError(`Stok ${barang.nm_barang} tidak cukup (sisa ${barang.stok})`);
      }

      total += barang.harga * jumlah;
      detail.push({ id_barang: it.id_barang, jumlah, harga_satuan: barang.harga });
    }

    if (!Number.isInteger(bayar) || bayar < total) {
      throw new ValidasiError('Uang bayar kurang');
    }
    const kembalian = bayar - total;

    const [trx] = await conn.query(
      'INSERT INTO transaksi (total_bayar, bayar, kembalian, id_user, id_member) VALUES (?, ?, ?, ?, ?)',
      [total, bayar, kembalian, idUser, id_member]
    );
    const idTransaksi = trx.insertId;

    for (const d of detail) {
      await conn.query(
        'INSERT INTO detail_transaksi (id_transaksi, id_barang, jumlah, harga_satuan) VALUES (?, ?, ?, ?)',
        [idTransaksi, d.id_barang, d.jumlah, d.harga_satuan]
      );
      await conn.query('UPDATE product SET stok = stok - ? WHERE id_barang = ?', [
        d.jumlah,
        d.id_barang,
      ]);
    }

    await conn.commit();
    return NextResponse.json({ id_transaksi: idTransaksi, total, bayar, kembalian });
  } catch (err) {
    await conn.rollback();
    if (err instanceof ValidasiError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}