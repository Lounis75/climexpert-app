import { notFound } from "next/navigation";
import { getCerfaSignatureContext } from "@/lib/cerfa";
import SignAttestationClient from "@/components/SignAttestationClient";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await getCerfaSignatureContext(token);
  if (!ctx) notFound();

  return (
    <SignAttestationClient
      token={token}
      alreadySigned={!!ctx.rapport.cerfaClientSigneLe}
      clientName={ctx.client?.name ?? "cher client"}
    />
  );
}
