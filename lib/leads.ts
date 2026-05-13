import { put, list, del } from "@vercel/blob";

export type LeadStatus = "nouveau" | "contacté" | "devis_envoyé" | "gagné" | "perdu";
export type LeadSource = "alex" | "contact";

export interface Lead {
  id: string;
  source: LeadSource;
  createdAt: string;
  status: LeadStatus;
  name: string;
  phone: string;
  project: string;
  property: string;
  location: string;
  estimate?: string;
  notes?: string;
}

const PREFIX = "leads/";

export async function createLead(
  data: Omit<Lead, "id" | "createdAt" | "status">
): Promise<Lead> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN non configuré");

  const lead: Lead = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: "nouveau",
  };

  await put(`${PREFIX}${lead.id}.json`, JSON.stringify(lead), {
    access: "private",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });

  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return [];

    const { blobs } = await list({ prefix: PREFIX, token });
    if (blobs.length === 0) return [];

    const results = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as Lead;
        } catch {
          return null;
        }
      })
    );

    return (results.filter(Boolean) as Lead[]).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, token });
  if (blobs.length === 0) return null;

  const res = await fetch(blobs[0].url, { cache: "no-store" });
  if (!res.ok) return null;
  const lead: Lead = await res.json();

  const updated: Lead = { ...lead, status };
  await put(`${PREFIX}${id}.json`, JSON.stringify(updated), {
    access: "private",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });

  return updated;
}

export async function deleteLead(id: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, token });
  if (blobs.length > 0) {
    await del(blobs[0].url, { token });
  }
}
