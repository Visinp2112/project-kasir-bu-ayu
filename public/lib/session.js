import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function getSession() {
  const token = (await cookies()).get('token')?.value;
  return token ? await verifyToken(token) : null;
}