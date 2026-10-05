'use client';
import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/shell';
import Modal from '@/components/modal';
import { rp } from '@/lib/format';
import StrukView from '@/components/StrukView';

const QUICK = [10000, 20000, 50000, 100000];

export default function KasirPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState('Semua');
  const [cart, setCart] = useState({});
  const [q, setQ] = useState('');
  const [hasil, setHasil] = useState([]);
  const [member, setMember] = useState(null);
  const [bayar, setBayar] = useState('');
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  async function loadProducts() {
    const res = await fetch('/api/product');
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }
  useEffect(() => { loadProducts(); }, []);

  // cari member (debounce)
  useEffect(() => {
    if (q.trim().length < 2) { setHasil([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch('/api/member?q=' + encodeURIComponent(q.trim()));
      if (res.ok) setHasil((await res.json()).slice(0, 5));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const codes = useMemo(() => {
    const m = {};
    products.forEach((p, i) => {
      m[p.id_barang] = String.fromCharCode(65 + (Math.floor(i / 4) % 26)) + ((i % 4) + 1);
    });
    return m;
  }, [products]);

  const kategoriList = ['Semua', ...new Set(products.map((p) => p.type_kategori).filter(Boolean))];
  const visible = kategori === 'Semua' ? products : products.filter((p) => p.type_kategori === kategori);
  const cartItems = products.filter((p) => cart[p.id_barang]).map((p) => ({ ...p, qty: cart[p.id_barang] }));
  const total = cartItems.reduce((s, i) => s + i.harga * i.qty, 0);
  const bayarNum = Number(String(bayar).replace(/\D/g, '')) || 0;
  const kembalian = bayarNum - total;
  const bisaBayar = cartItems.length > 0 && bayarNum >= total && !paying;

  const tambah = (p) =>
    setCart((c) => {
      const qty = c[p.id_barang] || 0;
      return qty >= p.stok ? c : { ...c, [p.id_barang]: qty + 1 };
    });
  const kurang = (p) =>
    setCart((c) => {
      const n = { ...c };
      const qty = (c[p.id_barang] || 0) - 1;
      if (qty <= 0) delete n[p.id_barang]; else n[p.id_barang] = qty;
      return n;
    });

  async function bayarSekarang() {
    setError('');
    setPaying(true);
    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems.map((i) => ({ id_barang: i.id_barang, jumlah: i.qty })),
        bayar: bayarNum,
        ...(member ? { id_member: member.id_member } : {}),
      }),
    });
    const data = await res.json();
    setPaying(false);
    if (!res.ok) { setError(data.error || 'Gagal memproses'); loadProducts(); return; }
    setReceipt({ ...data, items: cartItems, member });
    setCart({}); setBayar(''); setMember(null); setQ('');
    loadProducts();
  }

  return (
    <Shell>
      <div className="pos-workspace grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* ===== ETALASE ===== */}
        <section className="glass pos-showcase min-h-[calc(100vh-118px)] p-5 lg:p-6">
          <div className="led font-led mb-4 flex items-center justify-between px-4 py-3 text-sm">
            <span>PILIH BARANG ANDA</span>
            <span>{products.length} SLOT</span>
          </div>

          <div className="category-strip mb-5 flex flex-wrap gap-2">
            {kategoriList.map((k) => (
              <button
                key={k}
                onClick={() => setKategori(k)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  kategori === k
                    ? 'bg-[var(--gold)] text-[#241a03]'
                    : 'border border-[var(--line)] text-gray-300 hover:text-white'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="font-led py-16 text-center text-gray-500">MEMUAT...</div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center text-gray-500">Belum ada barang.</div>
          ) : (
            <div className="product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {visible.map((p) => (
                <button key={p.id_barang} className="slot" disabled={p.stok <= 0} onClick={() => tambah(p)}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="led font-led px-2 py-1 text-xs">{codes[p.id_barang]}</span>
                    <span className={`text-[11px] font-semibold ${p.stok <= 3 ? 'text-red-400' : 'text-gray-400'}`}>
                      {p.stok <= 0 ? 'HABIS' : `Sisa ${p.stok}`}
                    </span>
                  </div>
                  <div
                    className="mb-3 grid h-24 place-items-center overflow-hidden rounded-xl border border-white/5"
                    style={{ background: 'linear-gradient(145deg, #f8fafc, #eef3f8)' }}
                  >
                    {p.foto_v ? (
                    <img src={`/api/product/${p.id_barang}/foto?v=${p.foto_v}`} alt={p.nm_barang} className="h-full w-full object-cover" />
                    ) : (
                    <span className="gold-text text-4xl font-black">{p.nm_barang.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-h-10 font-semibold leading-tight">{p.nm_barang}</div>
                  <div className="gold-text font-led mt-1 text-lg font-bold">{rp(p.harga)}</div>
                  {cart[p.id_barang] > 0 && (
                    <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-red-500 text-xs font-bold shadow-lg">
                      {cart[p.id_barang]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ===== KERANJANG ===== */}
        <aside className="glass pos-checkout h-fit p-5 lg:p-6 xl:sticky xl:top-24">
          <div className="led font-led mb-4 px-4 py-4 text-right">
            <div className="text-[10px] opacity-70">TOTAL</div>
            <div className="text-3xl font-bold">{rp(total)}</div>
          </div>

          <div className="mb-4 max-h-56 space-y-2 overflow-y-auto pr-1">
            {cartItems.length === 0 && <div className="py-6 text-center text-sm text-gray-500">Keranjang kosong. Klik barang di etalase.</div>}
            {cartItems.map((i) => (
              <div key={i.id_barang} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{i.nm_barang}</div>
                  <div className="font-led text-xs text-[var(--gold)]">{rp(i.harga * i.qty)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-dark !rounded-lg !px-2.5 !py-0.5" onClick={() => kurang(i)}>−</button>
                  <span className="font-led w-5 text-center">{i.qty}</span>
                  <button className="btn btn-dark !rounded-lg !px-2.5 !py-0.5" onClick={() => tambah(i)} disabled={i.qty >= i.stok}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* member */}
          <div className="relative mb-4">
            {member ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                <span>Member: <b className="text-[var(--gold)]">{member.nm}</b></span>
                <button className="text-gray-400 hover:text-white" onClick={() => setMember(null)}>✕</button>
              </div>
            ) : (
              <>
                <input className="field" placeholder="Cari member (nama / telp) — opsional" value={q} onChange={(e) => setQ(e.target.value)} />
                {hasil.length > 0 && (
                  <div className="glass absolute z-10 mt-1 w-full overflow-hidden !rounded-xl">
                    {hasil.map((m) => (
                      <button key={m.id_member} className="block w-full px-4 py-2 text-left text-sm hover:bg-white/10" onClick={() => { setMember(m); setHasil([]); setQ(''); }}>
                        {m.nm} <span className="text-gray-500">{m.tlpn}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* bayar */}
          <input
            className="field font-led mb-3 text-right text-lg"
            placeholder="Uang bayar"
            inputMode="numeric"
            value={bayarNum ? bayarNum.toLocaleString('id-ID') : ''}
            onChange={(e) => setBayar(e.target.value)}
          />
          <div className="mb-4 grid grid-cols-3 gap-2">
            {QUICK.map((n) => (
              <button key={n} className="btn btn-dark !px-2 !py-2 text-xs" onClick={() => setBayar(String(n))}>{n / 1000}rb</button>
            ))}
            <button className="btn btn-dark !col-span-2 !px-2 !py-2 text-xs" onClick={() => setBayar(String(total))} disabled={total === 0}>Uang Pas</button>
          </div>

          <div className={`led font-led mb-4 flex justify-between px-4 py-2 text-sm ${bayarNum > 0 && kembalian < 0 ? 'led-red' : ''}`}>
            <span>{kembalian < 0 && bayarNum > 0 ? 'KURANG' : 'KEMBALI'}</span>
            <span>{bayarNum > 0 ? rp(Math.abs(kembalian)) : '-'}</span>
          </div>

          {error && <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

          <button className="btn btn-gold w-full !py-4 text-lg" disabled={!bisaBayar} onClick={bayarSekarang}>
            {paying ? 'MEMPROSES...' : 'BAYAR'}
          </button>
        </aside>
      </div>

      {/* ===== STRUK ===== */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Pembayaran Berhasil">
  {receipt && (
    <div>
      <div className="drop-in led font-led mb-4 px-4 py-4 text-center">
        <div className="blink text-sm">SILAKAN AMBIL BARANG ANDA</div>
      </div>
      <StrukView id={receipt.id_transaksi} />
      <button className="btn btn-gold mt-4 w-full" onClick={() => setReceipt(null)}>TRANSAKSI BARU</button>
    </div>
  )}
</Modal>
    </Shell>
  );
}