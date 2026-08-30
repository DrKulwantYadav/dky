import Link from "next/link";
import { LayoutDashboard, HeartPulse, Stethoscope, Users, CalendarDays, Bell, ChartNoAxesCombined, Settings, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import type { AdminRole } from "@/lib/admin/auth";

const navigation = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Free Camp Registrations", "/admin/free-camp-registrations", HeartPulse],
  ["Regular Registrations", "/admin/regular-registrations", Stethoscope],
  ["Patients", "/admin/patients", Users],
  ["Camps", "/admin/camps", CalendarDays],
  ["Reminders", "/admin/reminders", Bell],
  ["Reports", "/admin/reports", ChartNoAxesCombined],
  ["Settings", "/admin/settings", Settings],
] as const;

export function AdminShell({ children, name, role }: { children: ReactNode; name: string; role: AdminRole }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/admin"><span>GY</span><div>Gopinath Hospital<small>Patient CRM</small></div></Link>
        <nav>{navigation.map(([label, href, Icon]) => <Link href={href} key={href}><Icon size={18} />{label}</Link>)}</nav>
        <form action={logout}><button type="submit"><LogOut size={18} />Logout</button></form>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div><strong>{name}</strong><span>{role.replace("_", " ")}</span></div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
