import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { interventions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import RapportForm from "./RapportForm";

export default async function RapportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) redirect("/technicien/login");

  const [interv] = await db
    .select({ id: interventions.id, type: interventions.type })
    .from(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.technicienId, session.sub), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) notFound();

  const isVisiteTechnique = interv.type === "autre"; // adapter si type visite technique

  return <RapportForm interventionId={id} isVisiteTechnique={isVisiteTechnique} />;
}
