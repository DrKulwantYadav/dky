import { requireAdmin } from "@/lib/admin/auth";
import CampOverview from "@/components/admin/CampOverview";
import "./camps-admin.css";

export default async function CampsPage() {
  const admin = await requireAdmin();
  return <CampOverview canManage={admin.profile.role !== "staff"} />;
}
