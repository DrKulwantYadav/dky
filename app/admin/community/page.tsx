import { requireAdmin } from "@/lib/admin/auth";
import { listInitiatives } from "@/lib/community";
import CommunityList from "@/components/admin/CommunityList";
import "./community-admin.css";

export default async function Page() {
  const admin = await requireAdmin();
  if (admin.profile.role === "staff") return <div className="admin-alert error">Administrator access is required for Community Activity.</div>;
  let items;
  try { items = await listInitiatives(false); }
  catch { return <div className="admin-alert error">Could not load initiatives. Apply the community initiatives migration in Supabase, then refresh this page.</div>; }
  return <CommunityList initial={items}/>;
}
