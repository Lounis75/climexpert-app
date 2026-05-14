import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/leads";

interface ContactFormData {
  type: string;
  bien: string;
  ville: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
}

const typeLabels: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien / Maintenance",
  depannage: "Dépannage",
  "contrat-pro": "Contrat professionnel",
  autre: "Autre demande",
};

const bienLabels: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  "local-professionnel": "Local professionnel",
  "hotel-restaurant": "Hôtel / Restaurant",
  copropriete: "Copropriété / Immeuble",
};

export async function POST(req: NextRequest) {
  try {
    const body: ContactFormData = await req.json();

    if (!body.nom || !body.telephone || !body.type || !body.bien) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    await resend.emails.send({
      from: "Contact ClimExpert <onboarding@resend.dev>",
      to: ["contact@climexpert.fr"],
      subject: `📩 Nouveau contact — ${body.nom} — ${typeLabels[body.type] ?? body.type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
          <div style="background: #0B1120; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 20px;">📩 Nouveau contact via le site</h1>
            <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">${date}</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
            <h2 style="color: #0F172A; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #0EA5E9; padding-bottom: 8px;">Détails de la demande</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748B; width: 40%; font-size: 14px;">Nom</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${body.nom}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; font-weight: bold; color: #0EA5E9; font-size: 16px;"><a href="tel:${body.telephone}" style="color: #0EA5E9; text-decoration: none;">${body.telephone}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de demande</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${typeLabels[body.type] ?? body.type}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Type de bien</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${bienLabels[body.bien] ?? body.bien}</td></tr>
              ${body.email ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Email</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;"><a href="mailto:${body.email}" style="color: #0EA5E9; text-decoration: none;">${body.email}</a></td></tr>` : ""}
              ${body.ville ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px;">Localisation</td><td style="padding: 8px 0; font-weight: bold; color: #0F172A; font-size: 14px;">${body.ville}</td></tr>` : ""}
              ${body.message ? `<tr><td style="padding: 8px 0; color: #64748B; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 8px 0; color: #0F172A; font-size: 14px;">${body.message}</td></tr>` : ""}
            </table>
          </div>

          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #C2410C; font-weight: bold; font-size: 14px;">⏱️ À rappeler rapidement</p>
            <a href="tel:${body.telephone}" style="display: inline-block; margin-top: 8px; background: #EA580C; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Appeler ${body.nom}</a>
          </div>

          <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 16px;">Formulaire de contact · climexpert.fr</p>
        </div>
      `,
    });

    await createLead({
      source: "formulaire",
      name: body.nom,
      phone: body.telephone,
      email: body.email || undefined,
      project: body.type as "installation" | "entretien" | "depannage" | "contrat-pro" | "autre",
      location: body.ville || undefined,
      message: body.message || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
