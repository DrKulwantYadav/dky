import Link from "next/link";
import { z } from "zod";
import UnsubscribeButton from "./UnsubscribeButton";

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = z.uuid().safeParse(token);
  return <main style={{ maxWidth: 620, margin: "100px auto", padding: 24 }}>
    <h1>Clinic email preferences</h1>
    {valid.success ? <><p>Stop receiving clinic news and offers by email. Appointment messages are separate.</p><UnsubscribeButton token={valid.data} /></>
      : <p>This unsubscribe link is invalid. Please use the link in your clinic email.</p>}
    <p><Link href="/">Return to website</Link></p>
  </main>;
}
