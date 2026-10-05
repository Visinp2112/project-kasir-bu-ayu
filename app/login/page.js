'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Login gagal');
    router.replace(data.user.role === 'admin' ? '/admin/barang' : '/kasir');
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#0b1f3a]/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#0b1f3a]/[0.03] blur-3xl" />

      <form onSubmit={submit} className="glass fade-up relative w-full max-w-sm p-7">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#0b1f3a] text-white shadow-[0_18px_35px_-18px_rgba(11,31,58,.8)]">
            <span className="text-xl font-black tracking-tight">K</span>
          </div>
          <div className="gold-text text-3xl font-black tracking-[.08em]">KASIR</div>
          <div className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">Point of Sale</div>
        </div>

        <div className={`led font-led mb-6 px-4 py-3 text-center text-sm ${error ? 'led-red' : ''}`}>
          {error ? error.toUpperCase() : <span className="blink">SILAKAN LOGIN</span>}
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Username</label>
        <input className="field mb-4" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="petugas" autoFocus />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Password</label>
        <input className="field mb-6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        <button className="btn btn-gold w-full" disabled={loading || !username || !password}>
          {loading ? 'MEMPROSES...' : 'MASUK'}
        </button>

        <div className="mx-auto mt-8 h-px w-28 bg-gradient-to-r from-transparent via-[#0b1f3a]/35 to-transparent" />
      </form>
    </div>
  );
}