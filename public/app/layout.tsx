import './globals.css';

export const metadata = { title: 'Kasir', description: 'Sistem kasir' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}