import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const users = [
  ['admin', 'admin123', 'admin'],
  ['petugas', 'petugas123', 'petugas'],
];

for (const [username, pass, role] of users) {
  const hash = await bcrypt.hash(pass, 10);
  await db.query('INSERT INTO user (username, password, role) VALUES (?, ?, ?)', [username, hash, role]);
}

console.log('Seed selesai');
await db.end();