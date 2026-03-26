import Sidebar from '@/components/dashboard/Sidebar';
import SidebarProvider from '@/components/dashboard/SidebarProvider';
import UpgradeBanner from '@/components/dashboard/UpgradeBanner';
import { auth } from '@/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isPro = session?.user?.plan === 'pro';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!isPro && <UpgradeBanner />}
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
