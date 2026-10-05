'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import Modal from '@/components/modal';
import { rp } from '@/lib/format';

const tgl = (d) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD (waktu lokal)
const waktu = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export default function LaporanPage() {
  const hariIni = tgl(new Date());
  const [dari, setDari] = useState(hariIni);
  const [sampai, setSampai] = useState(hariIni);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/laporan?dari=${dari}&sampai=${sampai}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); });
  }, [dari, sampai]);

  function rentang(hari) {
    const d = new Date();
    d.setDate(d.getDate() - (hari - 1));
    setDari(tgl(d)); setSampai(tgl(new Date()));
  }
  function bulanIni() {
    const n = new Date();
    setDari(tgl(new Date(n.getFullYear(), n.getMonth(), 1))); setSampai(tgl(n));
  }

  async function bukaDetail(id) {
    const res = await fetch(`/api/laporan/${id}`);
    if (res.ok) setDetail(await res.json());
  }

  const total = data?.total_pendapatan || 0;
  const jumlah = data?.jumlah_transaksi || 0;
  const maxTerjual = Math.max(1, ...(data?.barang_terlaris || []).map((b) => b.terjual));

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="gold-text text-2xl font-black">Laporan Penjualan</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-dark !px-3 !py-2 text-xs" onClick={() => rentang(1)}>Hari ini</button>
          <button className="btn btn-dark !px-3 !py-2 text-xs" onClick={() => rentang(7)}>7 hari</button>
          <button className="btn btn-dark !px-3 !py-2 text-xs" onClick={bulanIni}>Bulan ini</button>
          <input type="date" className="field !w-auto !py-2" value={dari} max={sampai} onChange={(e) => e.target.value && setDari(e.target.value)} />
          <span className="text-gray-500">–</span>
          <input type="date" className="field !w-auto !py-2" value={sampai} min={dari} onChange={(e) => e.target.value && setSampai(e.target.value)} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['TOTAL PENDAPATAN', rp(total)],
          ['JUMLAH TRANSAKSI', jumlah],
          ['RATA-RATA / TRANSAKSI', rp(jumlah ? Math.round(total / jumlah) : 0)],
        ].map(([l, v]) => (
          <div key={l} className="led font-led px-4 py-4 text-right">
            <div className="text-[10px] opacity-70">{l}</div>
            <div className="text-2xl font-bold">{loading ? '...' : v}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="glass overflow-x-auto p-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="p-3">#</th><th className="p-3">Waktu</th><th className="p-3">Petugas</th>
                <th className="p-3">Member</th><th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {!loading && (data?.transaksi || []).length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-gray-500">Belum ada transaksi di periode ini.</td></tr>
              )}
              {(data?.transaksi || []).map((t) => (
                <tr key={t.id_transaksi} onClick={() => bukaDetail(t.id_transaksi)} className="cursor-pointer border-t border-white/5 hover:bg-white/5">
                  <td className="font-led p-3 text-[var(--gold)]">{t.id_transaksi}</td>
                  <td className="p-3">{waktu(t.tgl)}</td>
                  <td className="p-3 text-gray-300">{t.petugas}</td>
                  <td className="p-3 text-gray-400">{t.member || '-'}</td>
                  <td className="font-led p-3 text-right">{rp(t.total_bayar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="glass h-fit p-5">
          <div className="led font-led mb-4 px-4 py-2 text-sm">BARANG TERLARIS</div>
          <div className="space-y-4">
            {(data?.barang_terlaris || []).length === 0 && <div className="py-4 text-center text-sm text-gray-500">Belum ada data.</div>}
            {(data?.barang_terlaris || []).map((b, i) => (
              <div key={b.nm_barang}>
                <div className="mb-1 flex justify-between text-sm">
                  <span><span className="font-led mr-2 text-[var(--gold)]">{i + 1}</span>{b.nm_barang}</span>
                  <span className="font-led text-gray-300">{b.terjual}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#0b1f3a]" style={{ width: `${(b.terjual / maxTerjual) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Struk #${detail.id_transaksi}` : ''}>
        {detail && (
          <div className="text-sm">
            <div className="mb-3 space-y-0.5 text-xs text-gray-400">
              <div>{waktu(detail.tgl)}</div>
              <div>Petugas: {detail.petugas}{detail.member ? ` · Member: ${detail.member}` : ''}</div>
            </div>
            <div className="space-y-1">
              {detail.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.nm_barang} × {i.jumlah}</span>
                  <span className="font-led">{rp(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
              <div className="flex justify-between"><span>Total</span><b className="font-led">{rp(detail.total_bayar)}</b></div>
              <div className="flex justify-between"><span>Bayar</span><span className="font-led">{rp(detail.bayar)}</span></div>
              <div className="flex justify-between text-[var(--gold)]"><span>Kembalian</span><b className="font-led">{rp(detail.kembalian)}</b></div>
            </div>
          </div>
        )}
      </Modal>
    </Shell>
  );
}