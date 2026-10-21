import { requireAdmin } from "@/lib/admin/auth";
import CampEditor from "@/components/admin/CampEditor";
import "../camps-admin.css";

export default async function NewCampPage() {
  const admin = await requireAdmin();
  return <CampEditor canManage={admin.profile.role !== "staff"} />;
}
