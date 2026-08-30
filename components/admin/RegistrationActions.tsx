"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegistrationActions({ id, type }: { id: string; type: "camp" | "regular" }) {
  const [busy,setBusy]=useState(false); const router=useRouter();
  async function update(field:string,value:string){setBusy(true);await fetch(`/api/admin/${type}-registrations`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,[field]:value})});setBusy(false);router.refresh();}
  return <div className="table-actions"><select disabled={busy} defaultValue="" aria-label="Update registration" onChange={e=>{const [field,value]=e.target.value.split(":");if(field)update(field,value)}}><option value="">Update…</option><option value="confirmation_status:Confirmed">Confirm</option><option value="confirmation_status:Pending">Mark pending</option>{type==="camp"&&<><option value="attendance_status:Attended">Mark attended</option><option value="attendance_status:No-show">Mark no-show</option></>}</select></div>;
}
