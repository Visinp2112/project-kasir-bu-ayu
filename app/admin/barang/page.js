'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import Modal from '@/components/modal';
import { rp } from '@/lib/format';

const KOSONG = { nm_barang: '', harga: '', stok: '', type_kategori: '' };
const NOFOTO = { blob: null, preview: null, hapus: false };
const fotoUrl = (id, v) => `/api/product/${id}/foto?v=${v}`;

// kecilkan foto jadi JPEG maks 480px sebelum di-upload
function resizeToJpeg(file, max = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('File bukan gambar')); };
    img.src = url;
  });
}

function Thumb({ p }) {
  return p.foto_v ? (
    <img src={fotoUrl(p.id_barang, p.foto_v)} alt="" className="h-10 w-10 rounded-lg border border-white/10 object-cover" />
  ) : (
    <div className="gold-text grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 font-black">
      {p.nm_barang.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminBarangPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [foto, setFoto] = useState(NOFOTO);
  const [stokForm, setStokForm] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/product');
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function toast(t) { setNotice(t); setTimeout(() => setNotice(''), 3000); }

  const kategori = [...new Set(products.map((p) => p.type_kategori).filter(Boolean))];
  const menipis = products.filter((p) => p.stok > 0 && p.stok <= 3).length;
  const habis = products.filter((p) => p.stok <= 0).length;

  function bukaTambah() { setErr(''); setFoto(NOFOTO); setForm({ mode: 'add', ...KOSONG }); }
  function bukaEdit(p) {
    setErr(''); setFoto(NOFOTO);
    setForm({ mode: 'edit', id_barang: p.id_barang, nm_barang: p.nm_barang, harga: String(p.harga), type_kategori: p.type_kategori || '', foto_v: p.foto_v });
  }

  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    try {
      const blob = await resizeToJpeg(file);
      setFoto({ blob, preview: URL.createObjectURL(blob), hapus: false });
    } catch (x) { setErr(x.message); }
  }

  async function simpan(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const kat = form.type_kategori.trim() || null;
    const isAdd = form.mode === 'add';
    const res = await fetch(isAdd ? '/api/product' : `/api/product/${form.id_barang}`, {
      method: isAdd ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isAdd
          ? { nm_barang: form.nm_barang.trim(), harga: Number(form.harga), stok: Number(form.stok || 0), type_kategori: kat }
          : { nm_barang: form.nm_barang.trim(), harga: Number(form.harga), type_kategori: kat }
      ),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); return setErr(data.error || 'Gagal menyimpan'); }

    const id = isAdd ? data.id_barang : form.id_barang;
    let pesan = data.message || 'Tersimpan';
    try {
      if (foto.blob) {
        const r = await fetch(`/api/product/${id}/foto`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: foto.blob });
        if (!r.ok) throw new Error(((await r.json().catch(() => ({}))).error) || 'foto gagal diupload');
      } else if (foto.hapus && !isAdd) {
        await fetch(`/api/product/${id}/foto`, { method: 'DELETE' });
      }
    } catch (x) { pesan = `Barang tersimpan, tapi ${x.message}`; }

    setBusy(false); setForm(null); toast(pesan); load();
  }

  async function simpanStok(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const res = await fetch(`/api/product/${stokForm.p.id_barang}/stok`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stok: Number(stokForm.value) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || 'Gagal update stok');
    setStokForm(null); toast('Stok diupdate'); load();
  }

  async function hapus() {
    setErr(''); setBusy(true);
    const res = await fetch(`/api/product/${delItem.id_barang}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || 'Gagal menghapus');
    setDelItem(null); toast('Barang dihapus'); load();
  }

  const previewSrc = foto.preview || (form && !foto.hapus && form.foto_v ? fotoUrl(form.id_barang, form.foto_v) : null);

  const Stat = ({ label, value, red }) => (
    <div className={`led font-led px-4 py-3 ${red ? 'led-red' : ''}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="gold-text text-2xl font-black">Kelola Barang</h1>
        <button className="btn btn-gold" onClick={bukaTambah}>+ Tambah Barang</button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="JENIS BARANG" value={products.length} />
        <Stat label="STOK MENIPIS (≤3)" value={menipis} red={menipis > 0} />
        <Stat label="HABIS" value={habis} red={habis > 0} />
      </div>

      {notice && <div className="fade-up mb-4 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">{notice}</div>}

      <section className="glass overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="p-3">Barang</th><th className="p-3">Kategori</th>
              <th className="p-3 text-right">Harga</th><th className="p-3 text-right">Stok</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="font-led p-10 text-center text-gray-500">MEMUAT...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">Belum ada barang.</td></tr>}
            {products.map((p) => (
              <tr key={p.id_barang} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Thumb p={p} />
                    <span className="font-semibold">{p.nm_barang}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-400">{p.type_kategori || '-'}</td>
                <td className="font-led p-3 text-right text-[var(--gold)]">{rp(p.harga)}</td>
                <td className={`font-led p-3 text-right ${p.stok <= 0 ? 'text-red-400' : p.stok <= 3 ? 'text-amber-300' : ''}`}>{p.stok}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn btn-dark !px-3 !py-1 text-xs" onClick={() => { setErr(''); setStokForm({ p, value: String(p.stok) }); }}>Stok</button>
                    <button className="btn btn-dark !px-3 !py-1 text-xs" onClick={() => bukaEdit(p)}>Edit</button>
                    <button className="btn btn-red !px-3 !py-1 text-xs" onClick={() => { setErr(''); setDelItem(p); }}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* tambah / edit */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.mode === 'add' ? 'Tambah Barang' : 'Edit Barang'}>
        {form && (
          <form onSubmit={simpan} className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-white/5">
                {previewSrc ? <img src={previewSrc} alt="" className="h-full w-full object-cover" /> : <span className="px-2 text-center text-xs text-gray-500">Belum ada foto</span>}
              </div>
              <div className="space-y-2">
                <label className="btn btn-dark !px-3 !py-2 cursor-pointer text-xs">
                  Pilih Foto
                  <input type="file" accept="image/*" className="hidden" onChange={pilihFoto} />
                </label>
                {previewSrc && (
                  <button type="button" className="block text-xs text-red-300 hover:underline" onClick={() => setFoto({ blob: null, preview: null, hapus: true })}>
                    Hapus foto
                  </button>
                )}
                <div className="text-[11px] text-gray-500">Otomatis dikecilkan (maks 480px)</div>
              </div>
            </div>

            <input className="field" placeholder="Nama barang" value={form.nm_barang} onChange={(e) => setForm({ ...form, nm_barang: e.target.value })} />
            <input className="field" placeholder="Harga (angka)" inputMode="numeric" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value.replace(/\D/g, '') })} />
            {form.mode === 'add' && (
              <input className="field" placeholder="Stok awal" inputMode="numeric" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value.replace(/\D/g, '') })} />
            )}
            <input className="field" list="kategori-list" placeholder="Kategori (mis. Minuman)" value={form.type_kategori} onChange={(e) => setForm({ ...form, type_kategori: e.target.value })} />
            <datalist id="kategori-list">{kategori.map((k) => <option key={k} value={k} />)}</datalist>
            {err && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
            <button className="btn btn-gold w-full" disabled={busy || !form.nm_barang.trim() || !form.harga}>{busy ? 'MENYIMPAN...' : 'SIMPAN'}</button>
          </form>
        )}
      </Modal>

      {/* stok */}
      <Modal open={!!stokForm} onClose={() => setStokForm(null)} title="Atur Stok">
        {stokForm && (
          <form onSubmit={simpanStok} className="space-y-3">
            <div className="text-sm text-gray-300">{stokForm.p.nm_barang}</div>
            <input className="field font-led text-center text-2xl" inputMode="numeric" value={stokForm.value} onChange={(e) => setStokForm({ ...stokForm, value: e.target.value.replace(/\D/g, '') })} autoFocus />
            {err && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
            <button className="btn btn-gold w-full" disabled={busy || stokForm.value === ''}>{busy ? 'MENYIMPAN...' : 'UPDATE STOK'}</button>
          </form>
        )}
      </Modal>

      {/* hapus */}
      <Modal open={!!delItem} onClose={() => setDelItem(null)} title="Hapus Barang?">
        {delItem && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">Yakin mau hapus <b className="text-[var(--gold)]">{delItem.nm_barang}</b>?</p>
            {err && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
            <div className="flex gap-3">
              <button className="btn btn-dark flex-1" onClick={() => setDelItem(null)}>Batal</button>
              <button className="btn btn-red flex-1" onClick={hapus} disabled={busy}>{busy ? '...' : 'Hapus'}</button>
            </div>
          </div>
        )}
      </Modal>
    </Shell>
  );
}