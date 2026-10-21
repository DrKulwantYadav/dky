import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import CampRegistrationExplorer from "@/components/admin/CampRegistrationExplorer";
import { ImportRegistrations } from "@/components/admin/ImportRegistrations";
import "./registrations.css";

type Search = { camp?: string; session?: string; slot?: string; registration?: string; attendance?: string; page?: string };
export default async function CampRegistrationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const admin = await requireAdmin();
  return <CampRegistrationExplorer initial={await searchParams} canManage={admin.profile.role !== "staff"} />;
}

// Shared by the established regular-registration and appointment admin pages.
export function PageHead({ title, subtitle, exportType }: { title: string; subtitle: string; exportType?: "camp" | "regular" }) {
  return <div className="admin-page-heading"><div><p>Patient CRM</p><h1>{title}</h1><span>{subtitle}</span></div>{exportType && <div className="admin-page-actions"><ImportRegistrations type={exportType} /><a className="admin-secondary-button" href={`/api/admin/export?type=${exportType}`}>Export CSV</a></div>}</div>;
}
export function Empty({ text }: { text: string }) { return <div className="admin-empty"><strong>Nothing to show</strong><p>{text}</p></div>; }
export function Pagination({ page, pages }: { page: number; pages: number }) { return <nav className="admin-pagination"><Link aria-disabled={page <= 1} href={`?page=${Math.max(1, page - 1)}`}>Previous</Link><span>Page {page} of {pages}</span><Link aria-disabled={page >= pages} href={`?page=${Math.min(pages, page + 1)}`}>Next</Link></nav>; }
