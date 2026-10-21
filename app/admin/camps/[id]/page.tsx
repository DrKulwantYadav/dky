import { requireAdmin } from "@/lib/admin/auth";
import CampEditor from "@/components/admin/CampEditor";
import "../camps-admin.css";

export default async function EditCampPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  return <CampEditor id={id} canManage={admin.profile.role !== "staff"} />;
}
