'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/shell';

const KOSONG = { nm: '', tlpn: '', email: '', alamat: '' };

export default function MemberPage() {
  const [form, setForm] = useState(KOSONG);
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(null); // { ok, text }
  const [saving, setSaving] = useState(false);

  async function load(cari = '') {
    const res = await fetch('/api/member' + (cari ? '?q=' + encodeURIComponent(cari) : ''));
    if (res.ok) setList(await res.json());
  }
  useEffect(() => {
    const t = setTimeout(() => load(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function submit(e) {
    e.preventDefault();
    setMsg(null); setSaving(true);
    const res = await fetch('/api/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nm: form.nm,
        tlpn: form.tlpn || undefined,
        email: form.email || undefined,
        alamat: form.alamat || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || 'Gagal mendaftar' });
    setMsg({ ok: true, text: 'Member berhasil didaftarkan' });
    setForm(KOSONG);
    load(q.trim());
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Shell>
      <h1 className="gold-text mb-5 text-2xl font-black">Member</h1>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="glass h-fit space-y-3 p-5">
          <div className="led font-led px-4 py-2 text-sm">REGISTRASI MEMBER</div>
          <input className="field" placeholder="Nama lengkap *" value={form.nm} onChange={set('nm')} />
          <input className="field" placeholder="No. telepon" inputMode="tel" value={form.tlpn} onChange={set('tlpn')} />
          <input className="field" placeholder="Email" value={form.email} onChange={set('email')} />
          <textarea className="field" rows={3} placeholder="Alamat" value={form.alamat} onChange={set('alamat')} />
          {msg && (
            <div className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{msg.text}</div>
          )}
          <button className="btn btn-gold w-full" disabled={saving || !form.nm.trim()}>{saving ? 'MENYIMPAN...' : 'DAFTARKAN'}</button>
        </form>

        <section className="glass p-5">
          <input className="field mb-4" placeholder="Cari nama / no. telepon..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            {list.length === 0 && <div className="col-span-full py-10 text-center text-gray-500">Belum ada member.</div>}
            {list.map((m) => (
              <div key={m.id_member} className="fade-up rounded-2xl border border-[var(--line)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="gold-text grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-lg font-black">
                    {m.nm.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.nm}</div>
                    <div className="font-led text-[11px] text-[var(--gold)]">ID #{m.id_member}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-0.5 text-xs text-gray-400">
                  {m.tlpn && <div>📞 {m.tlpn}</div>}
                  {m.email && <div className="truncate">✉ {m.email}</div>}
                  {m.alamat && <div className="line-clamp-2">📍 {m.alamat}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}