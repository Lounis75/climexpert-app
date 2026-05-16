import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suivisPlanifies, clients } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom  = process.env.TWILIO_PHONE_FROM;

  if (!twilioSid || !twilioToken || !twilioFrom) {
    return NextResponse.json({ ok: false, message: "Twilio non configuré" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";

  const dueSuivis = await db
    .select({
      suivi: suivisPlanifies,
      clientPhone: clients.phone,
      clientName:  clients.name,
      clientToken: clients.clientToken,
    })
    .from(suivisPlanifies)
    .leftJoin(clients, eq(suivisPlanifies.clientId, clients.id))
    .where(
      and(
        eq(suivisPlanifies.typeSuivi, "j365"),
        eq(suivisPlanifies.canal, "sms"),
        eq(suivisPlanifies.statut, "planifie"),
        lte(suivisPlanifies.datePrevue, today),
      ),
    );

  let sent = 0;
  const errors: string[] = [];

  for (const row of dueSuivis) {
    const { suivi, clientPhone, clientName, clientToken } = row;
    if (!clientPhone) continue;

    const phone = clientPhone.replace(/\s/g, "").replace(/^0/, "+33");
    const portalLink = clientToken ? ` Votre espace : ${baseUrl}/suivi/${clientToken}` : "";
    const body = `Bonjour ${clientName ?? ""}, votre climatisation a 1 an ! Pensez à l'entretien annuel pour maintenir ses performances.${portalLink} — Clim Expert`;

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: phone, From: twilioFrom, Body: body }).toString(),
        },
      );
      if (!res.ok) {
        errors.push(`${suivi.id}: HTTP ${res.status}`);
        continue;
      }
      await db.update(suivisPlanifies).set({ statut: "envoye", dateEnvoi: new Date() }).where(eq(suivisPlanifies.id, suivi.id));
      sent++;
    } catch (err) {
      errors.push(`${suivi.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}
