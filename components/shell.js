'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MENU = {
  petugas: [
    { href: '/kasir', label: 'Kasir' },
    { href: '/member', label: 'Member' },
    { href: '/laporan', label: 'Laporan' },
  ],
    admin: [
    { href: '/admin/barang', label: 'Kelola Barang' },
    { href: '/admin/petugas', label: 'Akun Petugas' },
  ],
};

export default function Shell({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => (u ? setUser(u) : router.replace('/login')));
  }, [router]);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[#0b1f3a] shadow-[0_10px_25px_-14px_rgba(11,31,58,.8)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.18),transparent_45%)]" />
              <svg className="relative" width="25" height="25" viewBox="0 0 34 34" fill="none">
              <rect x="3" y="2" width="28" height="30" rx="6" fill="#f5f8fc" stroke="#0b1f3a" strokeWidth="1.5" />
              <rect x="8" y="7" width="13" height="14" rx="2" fill="#0b1f3a" stroke="#0b1f3a" strokeOpacity=".15" />
              <circle cx="26" cy="10" r="2" fill="#9aa8b9" />
              <circle cx="26" cy="16" r="2" fill="#0b1f3a" />
              <rect x="9" y="25" width="16" height="3" rx="1.5" fill="#0b1f3a" />
            </svg>
            </div>
            <div>
              <span className="gold-text text-[15px] font-black tracking-[.12em]">KASIR</span>
              <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-gray-400">Point of Sale</div>
            </div>
          </div>

          <nav className="hidden gap-2 md:flex">
            {(MENU[user?.role] || []).map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`nav-chip rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  pathname.startsWith(m.href)
                    ? 'bg-[#0b1f3a] text-white'
                    : 'text-gray-500 hover:text-[var(--gold)]'
                }`}
              >
                {m.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold">{user.username}</div>
                <div className="font-led text-[10px] uppercase text-[var(--gold)]">{user.role}</div>
              </div>
            )}
            <button className="btn btn-dark !px-5 !py-2.5 text-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-4 py-5 lg:px-6">{user ? children : null}</main>
    </div>
  );
}