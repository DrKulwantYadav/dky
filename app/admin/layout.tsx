import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  if (!admin) return children;
  return <AdminShell name={admin.profile.full_name} role={admin.profile.role}>{children}</AdminShell>;
}
