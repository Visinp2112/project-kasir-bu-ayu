'use client';
import { useEffect, useMemo, useState } from 'react';
import { ambilStruk, gambarStruk, unduhStruk } from '@/lib/struk';

export default function StrukView({ id }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let batal = false;
    ambilStruk(id)
      .then((d) => { if (!batal) setData(d); })
      .catch((e) => { if (!batal) setErr(e.message); });
    return () => { batal = true; };
  }, [id]);

  const src = useMemo(() => (data ? gambarStruk(data).toDataURL('image/png') : null), [data]);

  async function unduh(format) {
    setErr(''); setBusy(format);
    try { await unduhStruk(data, format); }
    catch (e) { setErr(e.message || 'Gagal mengunduh'); }
    finally { setBusy(''); }
  }

  return (
    <div>
      <div className="max-h-[45vh] overflow-y-auto rounded-lg bg-neutral-300 p-3">
        {src ? (
          <img src={src} alt="Struk belanja" className="mx-auto w-full max-w-[384px] bg-white shadow-lg" />
        ) : (
          <div className="font-led py-10 text-center text-sm text-neutral-600">{err || 'MEMUAT STRUK...'}</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="btn btn-dark" onClick={() => unduh('pdf')} disabled={!data || !!busy}>
          {busy === 'pdf' ? '...' : 'Unduh PDF'}
        </button>
        <button className="btn btn-dark" onClick={() => unduh('jpg')} disabled={!data || !!busy}>
          {busy === 'jpg' ? '...' : 'Unduh JPG'}
        </button>
      </div>
      {data && err && <div className="mt-2 text-xs text-red-300">{err}</div>}
    </div>
  );
}