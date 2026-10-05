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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="3" y="2" width="28" height="30" rx="6" fill="#f5f8fc" stroke="#0b1f3a" strokeWidth="1.5" />
              <rect x="8" y="7" width="13" height="14" rx="2" fill="#0b1f3a" stroke="#0b1f3a" strokeOpacity=".15" />
              <circle cx="26" cy="10" r="2" fill="#9aa8b9" />
              <circle cx="26" cy="16" r="2" fill="#0b1f3a" />
              <rect x="9" y="25" width="16" height="3" rx="1.5" fill="#0b1f3a" />
            </svg>
            <span className="gold-text text-lg font-bold tracking-tight">KASIR</span>
          </div>

          <nav className="hidden gap-1 md:flex">
            {(MENU[user?.role] || []).map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
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
            <button className="btn btn-dark !px-4 !py-2 text-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{user ? children : null}</main>
    </div>
  );
}