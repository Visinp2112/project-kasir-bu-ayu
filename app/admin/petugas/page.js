'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import Modal from '@/components/modal';

export default function AdminPetugasPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reset, setReset] = useState(null); // { u, password }
  const [del, setDel] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/user');
    if (res.ok) setList(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function buat(e) {
    e.preventDefault();
    setMsg(null); setSaving(true);
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || 'Gagal membuat akun' });
    setMsg({ ok: true, text: `Akun "${form.username.trim()}" berhasil dibuat` });
    setForm({ username: '', password: '' });
    load();
  }

  async function simpanReset(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    const res = await fetch(`/api/user/${reset.u.id_user}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: reset.password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || 'Gagal reset password');
    setReset(null);
    setMsg({ ok: true, text: 'Password berhasil diubah' });
  }

  async function hapus() {
    setErr(''); setBusy(true);
    const res = await fetch(`/api/user/${del.id_user}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error || 'Gagal menghapus');
    setDel(null); setMsg({ ok: true, text: 'Akun dihapus' }); load();
  }

  return (
    <Shell>
      <h1 className="gold-text mb-5 text-2xl font-black">Akun Petugas</h1>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={buat} className="glass h-fit space-y-3 p-5">
          <div className="led font-led px-4 py-2 text-sm">BUAT AKUN BARU</div>
          <input className="field" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
          <div className="relative">
            <input className="field pr-16" type={show ? 'text' : 'password'} placeholder="Password (min. 6 karakter)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white" onClick={() => setShow(!show)}>{show ? 'Sembunyi' : 'Lihat'}</button>
          </div>
          {msg && <div className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{msg.text}</div>}
          <button className="btn btn-gold w-full" disabled={saving || !form.username.trim() || form.password.length < 6}>{saving ? 'MEMBUAT...' : 'BUAT AKUN'}</button>
          <p className="text-[11px] text-gray-500">Akun yang dibuat otomatis berperan sebagai Petugas.</p>
        </form>

        <section className="glass p-5">
          <div className="led font-led mb-4 px-4 py-2 text-sm">DAFTAR PETUGAS · {list.length}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.length === 0 && <div className="col-span-full py-10 text-center text-gray-500">Belum ada petugas.</div>}
            {list.map((u) => (
              <div key={u.id_user} className="fade-up rounded-2xl border border-[var(--line)] bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="gold-text grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-lg font-black">{u.username.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{u.username}</div>
                    <div className="font-led text-[11px] uppercase text-[var(--gold)]">{u.role}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-dark flex-1 !px-3 !py-1.5 text-xs" onClick={() => { setErr(''); setReset({ u, password: '' }); }}>Reset Password</button>
                  <button className="btn btn-red !px-3 !py-1.5 text-xs" onClick={() => { setErr(''); setDel(u); }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal open={!!reset} onClose={() => setReset(null)} title="Reset Password">
        {reset && (
          <form onSubmit={simpanReset} className="space-y-3">
            <div className="text-sm text-gray-300">Akun: <b className="text-[var(--gold)]">{reset.u.username}</b></div>
            <input className="field" type="text" placeholder="Password baru (min. 6 karakter)" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} autoFocus autoComplete="off" />
            {err && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
            <button className="btn btn-gold w-full" disabled={busy || reset.password.length < 6}>{busy ? 'MENYIMPAN...' : 'SIMPAN'}</button>
          </form>
        )}
      </Modal>

      <Modal open={!!del} onClose={() => setDel(null)} title="Hapus Akun?">
        {del && (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">Yakin mau hapus akun <b className="text-[var(--gold)]">{del.username}</b>?</p>
            {err && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
            <div className="flex gap-3">
              <button className="btn btn-dark flex-1" onClick={() => setDel(null)}>Batal</button>
              <button className="btn btn-red flex-1" onClick={hapus} disabled={busy}>{busy ? '...' : 'Hapus'}</button>
            </div>
          </div>
        )}
      </Modal>
    </Shell>
  );
}