import { AppShell } from "@/components/AppShell";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { company } = await requireCompany();
  const unread = await db.notification.count({ where: { companyId: company.id, read: false } });
  return (
    <AppShell companyName={company.name} logo={company.logo} unread={unread} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
