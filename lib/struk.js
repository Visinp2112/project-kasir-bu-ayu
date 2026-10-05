// Ganti sesuai kebutuhan
const NAMA_TOKO = 'KASIR';
const ALAMAT = 'Jl. Contoh No. 1, Kota';

const W = 384;      // lebar struk (px)
const PAD = 18;
const LH = 20;      // tinggi baris
const SCALE = 2;    // biar tajam
const FONT = (b) => `${b ? 'bold ' : ''}14px "Courier New", Courier, monospace`;

const pad2 = (n) => String(n).padStart(2, '0');
const angka = (n) => Number(n || 0).toLocaleString('id-ID');

function bungkus(ctx, text, max) {
  const out = [];
  let cur = '';
  for (const w of String(text).split(' ')) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= max) cur = t;
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}

export async function ambilStruk(id) {
  const res = await fetch(`/api/laporan/${id}`);
  if (!res.ok) throw new Error('Gagal mengambil data struk');
  return res.json();
}

export function gambarStruk(d) {
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = FONT(false);
  const inner = W - PAD * 2;

  const rows = [];
  const c = (s, b = false) => rows.push({ t: 'c', s, b });
  const l = (s) => rows.push({ t: 'l', s });
  const lr = (a, b, bold = false) => rows.push({ t: 'lr', a, b, bold });
  const sep = () => rows.push({ t: 'sep' });
  const gap = () => rows.push({ t: 'gap' });

  const t = new Date(d.tgl);
  const tglStr = `${pad2(t.getDate())}/${pad2(t.getMonth() + 1)}/${t.getFullYear()} ${pad2(t.getHours())}:${pad2(t.getMinutes())}`;

  c(NAMA_TOKO, true);
  c(ALAMAT);
  sep();
  lr('No. Struk', `#${String(d.id_transaksi).padStart(6, '0')}`);
  lr('Tanggal', tglStr);
  lr('Kasir', d.petugas);
  if (d.member) lr('Member', d.member);
  sep();

  d.items.forEach((i) => {
    bungkus(meas, i.nm_barang, inner).forEach((ln) => l(ln));
    lr(`  ${i.jumlah} x ${angka(i.harga_satuan)}`, angka(i.jumlah * i.harga_satuan));
  });

  sep();
  lr('TOTAL', angka(d.total_bayar), true);
  lr('TUNAI', angka(d.bayar));
  lr('KEMBALI', angka(d.kembalian));
  sep();
  c('TERIMA KASIH');
  c('SELAMAT BERBELANJA KEMBALI');
  gap();

  const tinggi = (r) => (r.t === 'gap' ? LH / 2 : LH);
  const H = PAD * 2 + rows.reduce((s, r) => s + tinggi(r), 0);

  const cv = document.createElement('canvas');
  cv.width = W * SCALE;
  cv.height = H * SCALE;
  const ctx = cv.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';

  let y = PAD;
  for (const r of rows) {
    if (r.t === 'sep') {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD, y + LH / 2);
      ctx.lineTo(W - PAD, y + LH / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (r.t === 'c') {
      ctx.font = FONT(r.b);
      ctx.textAlign = 'center';
      ctx.fillText(r.s, W / 2, y + 3);
    } else if (r.t === 'l') {
      ctx.font = FONT(false);
      ctx.textAlign = 'left';
      ctx.fillText(r.s, PAD, y + 3);
    } else if (r.t === 'lr') {
      ctx.font = FONT(r.bold);
      ctx.textAlign = 'left';
      ctx.fillText(r.a, PAD, y + 3);
      ctx.textAlign = 'right';
      ctx.fillText(r.b, W - PAD, y + 3);
    }
    y += tinggi(r);
  }
  return cv;
}

function simpanBlob(blob, nama) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function unduhStruk(d, format) {
  const cv = gambarStruk(d);
  const nama = `struk-${String(d.id_transaksi).padStart(6, '0')}`;

  if (format === 'jpg') {
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.95));
    return simpanBlob(blob, `${nama}.jpg`);
  }

  const { jsPDF } = await import('jspdf');
  const wmm = 80; // lebar kertas thermal 80mm
  const hmm = (cv.height / cv.width) * wmm;
  const pdf = new jsPDF({ unit: 'mm', format: [wmm, hmm], orientation: wmm > hmm ? 'l' : 'p' });
  pdf.addImage(cv.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, wmm, hmm);
  pdf.save(`${nama}.pdf`);
}