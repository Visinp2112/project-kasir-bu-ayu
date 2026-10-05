import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import StrukView from '@/components/StrukView';

// GET /api/laporan?dari=2026-09-01&sampai=2026-09-30
// Kalau ga diisi, default laporan hari ini.
export async function GET(req) {
  const sp = req.nextUrl.searchParams;
  const hariIni = new Date().toISOString().slice(0, 10);
  const dari = sp.get('dari') || hariIni;
  const sampai = sp.get('sampai') || dari;

  const tanggalValid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (!tanggalValid(dari) || !tanggalValid(sampai)) {
    return NextResponse.json({ error: 'Format tanggal harus YYYY-MM-DD' }, { status: 400 });
  }

  // tgl < sampai + 1 hari, biar transaksi sepanjang hari "sampai" ikut kehitung
  const batas = 'tgl >= ? AND tgl < DATE_ADD(?, INTERVAL 1 DAY)';

  const [[ringkasan]] = await pool.query(
    `SELECT COUNT(*) AS jumlah_transaksi,
            COALESCE(SUM(total_bayar), 0) AS total_pendapatan
     FROM transaksi WHERE ${batas}`,
    [dari, sampai]
  );

  const [transaksi] = await pool.query(
    `SELECT t.id_transaksi, t.tgl, t.total_bayar, t.bayar, t.kembalian,
            u.username AS petugas, m.nm AS member
     FROM transaksi t
     JOIN user u ON u.id_user = t.id_user
     LEFT JOIN member m ON m.id_member = t.id_member
     WHERE t.tgl >= ? AND t.tgl < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY t.tgl DESC`,
    [dari, sampai]
  );

  const [terlaris] = await pool.query(
    `SELECT p.nm_barang, SUM(d.jumlah) AS terjual
     FROM detail_transaksi d
     JOIN transaksi t ON t.id_transaksi = d.id_transaksi
     JOIN product p ON p.id_barang = d.id_barang
     WHERE t.tgl >= ? AND t.tgl < DATE_ADD(?, INTERVAL 1 DAY)
     GROUP BY p.id_barang, p.nm_barang
     ORDER BY terjual DESC
     LIMIT 5`,
    [dari, sampai]
  );

  return NextResponse.json({
    periode: { dari, sampai },
    jumlah_transaksi: Number(ringkasan.jumlah_transaksi),
    total_pendapatan: Number(ringkasan.total_pendapatan),
    barang_terlaris: terlaris.map((r) => ({ nm_barang: r.nm_barang, terjual: Number(r.terjual) })),
    transaksi,
  });
}