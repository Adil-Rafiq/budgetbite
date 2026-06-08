import { AdminGuard } from './_components/admin-guard';
import { AdminShell } from './_components/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
