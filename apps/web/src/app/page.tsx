import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server';
import { homeFor } from '@/lib/routes';

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : '/login');
}
