import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import DashboardLayout from './layout';

export default async function ServerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    redirect('/login');
  }
  
  try {
    const payload = verifyToken(token);
    if (!payload) {
      redirect('/login');
    }
  } catch (error) {
    redirect('/login');
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}