import Sidebar from '@/components/dashboard/Sidebar';
import UpgradeBanner from '@/components/dashboard/UpgradeBanner';
import { auth } from '@/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isPro = session?.user?.plan === 'pro';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isPro && <UpgradeBanner />}
        {children}
      </div>
    </div>
  );
}
