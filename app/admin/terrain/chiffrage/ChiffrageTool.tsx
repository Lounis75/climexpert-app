"use client";

import { useMemo, useRef, useState } from "react";
import type { Catalogue, ChiffragePrefill, ChiffrageClient, ChiffrageDraft, Prestation } from "@/lib/catalogue";
import AddressAutocomplete from "@/components/AddressAutocomplete";

// ─── Constantes de dimensionnement (repères pros) ───
const RATIO: Record<string, number> = { ancien: 125, standard: 100, bbc: 65 };
const EXPO: Record<string, number> = { nord: 0.9, est: 1.0, ouest: 1.0, sud: 1.15 };
const CLASSES: [number, number][] = [[2600, 9000], [3500, 12000], [5300, 18000], [7000, 24000]];

type Room = {
  id: number; nom: string; surface: number; hauteur: number; orientation: string;
  isolation: string; baie: boolean; occupants: number; combles: boolean; chaleur: boolean;
  distance: number; evac: boolean;
};
type Install = {
  empl: string; tableau: number; nbMurs: number; murMat: string;
  immeuble: boolean; faibleDb: boolean; nacelle: boolean; compteur: boolean; depose: boolean;
};
type Line = { d: string; q: number; pu: number; tva: number; isMO?: boolean };

// ─── Calcul (porté à l'identique de l'outil terrain) ───
function roomPower(r: Room): number {
  let base = r.hauteur > 2.8 ? r.surface * r.hauteur * 35 : r.surface * (RATIO[r.isolation] ?? 100);
  base *= EXPO[r.orientation] ?? 1;
  if (r.baie) base += 290;
  if (r.occupants > 2) base += (r.occupants - 2) * 125;
  if (r.chaleur) base += 400;
  if (r.combles) base *= 1.15;
  base *= 1.1;
  return Math.round(base);
}
function classify(w: number): number {
  for (const [kw, btu] of CLASSES) if (w <= kw * 1.05) return btu;
  return 24000;
}
function buildConfig(rooms: Room[]) {
  const classes = rooms.map((r) => classify(roomPower(r)));
  const n = classes.length;
  let key: string;
  if (n === 1) key = "mono_" + classes[0];
  else if (n === 2) { const s = [...classes].sort((a, b) => a - b).join("_"); key = s === "9000_9000" ? "bi_9_9" : s === "9000_12000" ? "bi_9_12" : "bi_custom"; }
  else if (n === 3) { const s = [...classes].sort((a, b) => a - b).join("_"); key = s === "9000_9000_12000" ? "tri_9_9_12" : "tri_custom"; }
  else key = "multi_custom";
  return { classes, n, key };
}
function priceFor(cfg: ReturnType<typeof buildConfig>, brand: string, cat: Catalogue) {
  if (cat.equip[cfg.key]) return { label: cat.equip[cfg.key].label, price: cat.equip[cfg.key].p[brand] ?? 0, exact: true };
  const sum = cfg.classes.reduce((a, b) => { const k = "mono_" + b; return a + (cat.equip[k] ? cat.equip[k].p[brand] : 1000); }, 0);
  return { label: "Multi-split " + cfg.classes.map((b) => b + " BTU").join(" + "), price: Math.round(sum * 0.82), exact: false };
}
function estimateHours(cfg: ReturnType<typeof buildConfig>, install: Install, rooms: Room[]): number {
  if (cfg.key === "monobloc_eau") return 12;
  let h = 8 + 5 * cfg.n;
  const totalDist = rooms.reduce((a, r) => a + (r.distance || 0), 0);
  if (totalDist > 15) h += 3;
  if (install.nacelle) h += 3;
  const pumps = rooms.filter((r) => !r.evac).length;
  if (pumps > 1) h += pumps - 1;
  if (["beton", "pierre"].includes(install.murMat)) h += install.nbMurs;
  return Math.round(h);
}

const newRoom = (id: number): Room => ({ id, nom: "Salon", surface: 25, hauteur: 2.5, orientation: "ouest", isolation: "standard", baie: false, occupants: 2, combles: false, chaleur: false, distance: 5, evac: true });
const eur = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const EMPTY_CLIENT: ChiffrageClient = { nom: "", tel: "", email: "", adr: "", cp: "", ville: "", entreprise: "", siren: "" };

export default function ChiffrageTool({ catalogue: initialCatalogue, prefill, draft }: { catalogue: Catalogue; prefill?: ChiffragePrefill | null; draft?: ChiffrageDraft | null }) {
  const [cat, setCat] = useState<Catalogue>(initialCatalogue);
  const [leadId, setLeadId] = useState<string | null>(prefill?.leadId ?? draft?.leadId ?? null);
  const [clientType, setClientType] = useState<"particulier" | "pro">(draft?.clientType ?? prefill?.clientType ?? "particulier");
  const [plus2ans, setPlus2ans] = useState(draft?.plus2ans ?? true);
  const [client, setClient] = useState<ChiffrageClient>({ ...EMPTY_CLIENT, ...(prefill?.client ?? {}), ...(draft?.client ?? {}) });
  const [rooms, setRooms] = useState<Room[]>(() => (draft?.rooms?.length ? (draft.rooms as Room[]) : Array.from({ length: prefill?.nbRooms ?? 1 }, (_, i) => newRoom(i + 1))));
  const roomSeq = useRef(draft?.rooms?.length ? (draft.rooms as Room[]).reduce((m, r) => Math.max(m, r.id), 0) : (prefill?.nbRooms ?? 1));
  const [install, setInstall] = useState<Install>(draft?.install ? (draft.install as Install) : { empl: "sol", tableau: 6, nbMurs: 1, murMat: "brique", immeuble: prefill?.immeuble ?? false, faibleDb: false, nacelle: false, compteur: false, depose: prefill?.depose ?? false });
  const [brand, setBrand] = useState(draft?.brand ?? "mitsubishi");
  // Type de prestation : installation (dimensionnement) ou entretien/dépannage/dépose/autre (forfaits).
  const [prestation, setPrestation] = useState<Prestation>(draft?.prestation ?? prefill?.prestation ?? "installation");
  const [prestaUnits, setPrestaUnits] = useState(draft?.prestaUnits ?? prefill?.nbRooms ?? 1);
  const [prestaHours, setPrestaHours] = useState(draft?.prestaHours ?? 2);
  const [prestaContrat, setPrestaContrat] = useState(draft?.prestaContrat ?? false);
  const [prestaNote, setPrestaNote] = useState(draft?.prestaNote ?? "");
  const [generated, setGenerated] = useState(draft?.generated ?? false);
  const [lines, setLines] = useState<Line[]>(draft?.lines ? (draft.lines as Line[]) : []);
  const [hours, setHours] = useState(() => { const l = (draft?.lines as Line[] | undefined)?.find((x) => x.isMO); return l?.q ?? 0; });
  const [catOpen, setCatOpen] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [catSaved, setCatSaved] = useState(false);
  // Brouillon + envoi
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMsg, setDraftMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  const tvaMat = () => 20;
  const tvaMO = () => (clientType === "pro" || !plus2ans ? 20 : 10);

  const cfg = useMemo(() => buildConfig(rooms), [rooms]);

  function patchRoom(idx: number, k: keyof Room, v: Room[keyof Room]) {
    setRooms((rs) => rs.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));
  }
  function addRoom() { roomSeq.current += 1; setRooms((rs) => [...rs, newRoom(roomSeq.current)]); }
  function delRoom(id: number) { setRooms((rs) => rs.filter((r) => r.id !== id)); }

  function buildLines(): Line[] {
    const eq = priceFor(cfg, brand, cat);
    const bname = cat.brands.find((x) => x.id === brand)?.name ?? brand;
    const out: Line[] = [];
    out.push({ d: bname + " - " + eq.label, q: 1, pu: eq.price, tva: tvaMat() });
    const totalDist = rooms.reduce((a, r) => a + (r.distance || 0), 0);
    out.push({ d: `Liaisons frigorifiques (${totalDist} m)`, q: 1, pu: Math.round(cat.annex.liaison_base.v + cat.annex.liaison_m.v * totalDist), tva: tvaMat() });
    out.push({ d: `Goulotte (${totalDist} m)`, q: 1, pu: Math.max(cat.annex.goulotte_min.v, Math.round(cat.annex.goulotte_m.v * totalDist)), tva: tvaMat() });
    const sup = cat.annex["support_" + install.empl];
    if (sup) out.push({ d: `Support unité extérieure (${install.empl})`, q: 1, pu: sup.v, tva: tvaMat() });
    const pumps = rooms.filter((r) => !r.evac).length;
    if (pumps > 0) out.push({ d: "Pompe de relevage", q: pumps, pu: cat.annex.pompe.v, tva: tvaMat() });
    const perc = cat.annex["percage_" + install.murMat];
    if (install.nbMurs > 0 && perc) out.push({ d: `Perçage mur (${install.murMat})`, q: install.nbMurs, pu: perc.v, tva: tvaMat() });
    out.push({ d: `Électricité (disjoncteur + câble alim ${install.tableau} m + communication)`, q: 1, pu: cat.annex.electricite.v, tva: tvaMat() });
    if (install.compteur) out.push({ d: "Évolution compteur / tableau électrique", q: 1, pu: cat.annex.compteur.v, tva: tvaMat() });
    if (install.depose) out.push({ d: "Dépose et gestion fluides de l'ancien matériel", q: 1, pu: cat.annex.depose.v, tva: tvaMO() });
    const h = estimateHours(cfg, install, rooms);
    out.push({ d: "Main d'œuvre (pose, raccordements, tirage au vide, mise en service)", q: h, pu: cat.moRate, tva: tvaMO(), isMO: true });
    return out;
  }

  // Lignes par défaut pour les prestations hors installation (forfaits du catalogue, ajustables).
  function buildPrestaLines(): Line[] {
    const f = cat.forfaits;
    const out: Line[] = [];
    const u = Math.max(1, Math.round(prestaUnits) || 1);
    if (prestation === "entretien") {
      if (prestaContrat) out.push({ d: `Contrat d'entretien annuel (${u} unité${u > 1 ? "s" : ""})`, q: u, pu: f.entretien_contrat_unite?.v ?? 0, tva: tvaMO() });
      else out.push({ d: `Entretien climatisation (${u} unité${u > 1 ? "s" : ""})`, q: u, pu: f.entretien_unite?.v ?? 0, tva: tvaMO() });
      if ((f.entretien_deplacement?.v ?? 0) > 0) out.push({ d: "Déplacement", q: 1, pu: f.entretien_deplacement.v, tva: tvaMO() });
    } else if (prestation === "depannage") {
      out.push({ d: "Diagnostic / déplacement", q: 1, pu: f.depannage_diagnostic?.v ?? 0, tva: tvaMO() });
      out.push({ d: "Main d'œuvre", q: Math.max(0, prestaHours), pu: cat.moRate, tva: tvaMO(), isMO: true });
    } else if (prestation === "depose") {
      out.push({ d: `Dépose climatisation (${u} unité${u > 1 ? "s" : ""})`, q: u, pu: f.depose_unite?.v ?? 0, tva: tvaMO() });
      if ((f.depose_fluides?.v ?? 0) > 0) out.push({ d: "Évacuation / recyclage des fluides", q: 1, pu: f.depose_fluides.v, tva: tvaMO() });
      out.push({ d: "Main d'œuvre", q: Math.max(0, prestaHours), pu: cat.moRate, tva: tvaMO(), isMO: true });
    } else {
      out.push({ d: prestaNote.trim() || "Prestation", q: 1, pu: 0, tva: tvaMO() });
      out.push({ d: "Main d'œuvre", q: Math.max(0, prestaHours), pu: cat.moRate, tva: tvaMO(), isMO: true });
    }
    return out;
  }

  function generate() {
    if (prestation === "installation") {
      if (rooms.length === 0) { alert("Ajoutez au moins une pièce."); return; }
      setLines(buildLines());
      setHours(estimateHours(cfg, install, rooms));
    } else {
      const l = buildPrestaLines();
      setLines(l);
      setHours(l.find((x) => x.isMO)?.q ?? 0);
    }
    setGenerated(true);
    window.scrollTo(0, 0);
  }

  function patchLine(i: number, f: keyof Line, v: string) {
    setLines((ls) => ls.map((ln, idx) => (idx === i ? { ...ln, [f]: f === "d" ? v : parseFloat(v) || 0 } : ln)));
  }
  function addFreeLine() { setLines((ls) => [...ls, { d: "Ligne libre", q: 1, pu: 0, tva: tvaMat() }]); }
  function setHoursLine(v: number) {
    setHours(v);
    setLines((ls) => ls.map((ln) => (ln.isMO ? { ...ln, q: v } : ln)));
  }

  const totals = useMemo(() => {
    let ht = 0, tva = 0;
    for (const ln of lines) { const t = ln.q * ln.pu; ht += t; tva += (t * ln.tva) / 100; }
    return { ht, tva, ttc: ht + tva };
  }, [lines]);

  // Estimation rapide (sticky) avant génération
  const quickTtc = useMemo(() => {
    if (prestation !== "installation") {
      let ht = 0, tva = 0;
      for (const ln of buildPrestaLines()) { const t = ln.q * ln.pu; ht += t; tva += (t * ln.tva) / 100; }
      return ht + tva;
    }
    const eq = priceFor(cfg, brand, cat);
    let a = eq.price;
    const td = rooms.reduce((x, r) => x + (r.distance || 0), 0);
    a += cat.annex.liaison_base.v + cat.annex.liaison_m.v * td + cat.annex.goulotte_m.v * td + cat.annex.electricite.v + 75;
    a += rooms.filter((r) => !r.evac).length * cat.annex.pompe.v + estimateHours(cfg, install, rooms) * cat.moRate;
    // Mélange TVA approx : tout à 20 % pour un pro (ou logement < 2 ans), sinon pose à 10 %.
    return a * (clientType === "pro" || !plus2ans ? 1.20 : 1.18);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestation, cfg, brand, cat, rooms, install, prestaUnits, prestaHours, prestaContrat, prestaNote, clientType, plus2ans]);

  const dbHint = useMemo(() => {
    const b = cat.brands.find((x) => x.id === brand);
    const m: string[] = [];
    if (install.immeuble) m.push("Immeuble : prévoir l'autorisation en assemblée générale pour l'unité extérieure (aspect, emplacement) et activer le mode nuit.");
    if (install.faibleDb && b && !b.lowNoise) m.push("Faible bruit demandé : " + b.name + " est en entrée de gamme côté acoustique. Orienter vers Mitsubishi ou Daikin (unité extérieure plus silencieuse, mode nuit).");
    if ((install.immeuble || install.faibleDb) && b && b.lowNoise) m.push(b.name + " convient pour une contrainte de bruit (mode nuit disponible).");
    return m;
  }, [cat.brands, brand, install.immeuble, install.faibleDb]);

  const notes = useMemo(() => {
    if (prestation !== "installation") return [];
    const eq = priceFor(cfg, brand, cat);
    const b = cat.brands.find((x) => x.id === brand);
    const out: string[] = [];
    if (!eq.exact) out.push("Combinaison multi-split à valider dans la table du constructeur (foisonnement).");
    if (rooms.some((r) => r.distance > 5)) out.push("Liaison de plus de 5 m : rendement réduit, complément de fluide possible au-delà du maximum constructeur.");
    if (install.immeuble) out.push("Immeuble : autorisation en AG à prévoir pour l'unité extérieure.");
    if (install.faibleDb && b && !b.lowNoise) out.push("Faible bruit demandé mais marque d'entrée de gamme : envisager Mitsubishi ou Daikin.");
    if (install.compteur && cat.annex.compteur.v === 0) out.push("Évolution du compteur cochée : renseigner le montant (dépend d'Enedis et de la puissance souscrite).");
    return out;
  }, [prestation, cfg, brand, cat, rooms, install]);

  async function saveCatalogue() {
    setSavingCat(true); setCatSaved(false);
    try {
      const res = await fetch("/api/admin/terrain/catalogue", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cat) });
      if (res.ok) { const d = await res.json(); if (d.catalogue) setCat(d.catalogue); setCatSaved(true); setTimeout(() => setCatSaved(false), 2500); }
      else alert("Échec de l'enregistrement du catalogue.");
    } finally { setSavingCat(false); }
  }

  function currentDraft(): ChiffrageDraft {
    return { leadId: leadId ?? undefined, clientType, plus2ans, client, prestation, prestaUnits, prestaHours, prestaContrat, prestaNote, rooms, install, brand, lines, generated };
  }
  async function saveDraft() {
    if (!client.nom.trim() && !client.entreprise.trim()) { setDraftMsg("Renseigne au moins le nom du client (ou l'entreprise)."); return; }
    setSavingDraft(true); setDraftMsg("");
    try {
      const res = await fetch("/api/admin/terrain/chiffrage/save-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, draft: currentDraft() }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setLeadId(d.leadId); setDraftMsg(d.created ? "✓ Brouillon enregistré, prospect créé" : "✓ Brouillon enregistré"); }
      else setDraftMsg(d.error ?? "Échec de l'enregistrement.");
    } catch { setDraftMsg("Erreur réseau."); }
    finally { setSavingDraft(false); }
  }
  // Objet du devis (titre du PDF), dérivé de la prestation.
  function devisTitle(): string {
    if (prestation === "installation") {
      const b = cat.brands.find((x) => x.id === brand)?.name ?? "";
      return `Installation de climatisation${b ? " " + b : ""} (${cfg.n} pièce${cfg.n > 1 ? "s" : ""})`;
    }
    if (prestation === "entretien") return prestaContrat ? "Contrat d'entretien climatisation" : "Entretien de climatisation";
    if (prestation === "depannage") return "Dépannage climatisation";
    if (prestation === "depose") return "Dépose de climatisation";
    return "Prestation";
  }
  async function sendDevis() {
    if (!client.email.trim()) { setSendErr("Renseigne l'e-mail du client (section A « Client ») pour lui envoyer le devis."); return; }
    setSending(true); setSendErr("");
    try {
      const res = await fetch("/api/admin/terrain/chiffrage/envoyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, clientType, client, lignes: lines, description: devisTitle() }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setLeadId(d.leadId); setSent(true); }
      else setSendErr(d.error ?? "Échec de l'envoi.");
    } catch { setSendErr("Erreur réseau."); }
    finally { setSending(false); }
  }
  // Téléchargement / impression du PDF (vrai document serveur, identique à celui envoyé au client).
  async function downloadPdf() {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const res = await fetch("/api/admin/terrain/chiffrage/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, clientType, client, lignes: lines, description: devisTitle() }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "Échec de la génération du PDF."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { alert("Erreur réseau, réessaie."); }
    finally { setPdfBusy(false); }
  }

  return (
    <div className="ct">
      <style>{CT_CSS}</style>

      {!generated && (
        <div>
          {prefill && (
            <div className="prefill">📋 Pré-rempli depuis le prospect <b>{prefill.client.nom || "—"}</b>{prestation === "installation" ? ` (${prefill.nbRooms} pièce${prefill.nbRooms > 1 ? "s" : ""} estimée${prefill.nbRooms > 1 ? "s" : ""})` : ""}. Vérifie et complète sur place.</div>
          )}
          {/* A. Client */}
          <section className="card">
            <h2><span className="n">A</span> Client et cadre</h2>
            <label>Type de prestation</label>
            <div className="seg" style={{ marginBottom: 12 }}>
              {([["installation", "Installation"], ["entretien", "Entretien"], ["depannage", "Dépannage"], ["depose", "Dépose"], ["autre", "Autre"]] as const).map(([v, l]) => (
                <button key={v} className={prestation === v ? "on" : ""} onClick={() => setPrestation(v)}>{l}</button>
              ))}
            </div>
            <label>Type de client</label>
            <div className="seg">
              <button className={clientType === "particulier" ? "on" : ""} onClick={() => setClientType("particulier")}>Particulier</button>
              <button className={clientType === "pro" ? "on" : ""} onClick={() => { setClientType("pro"); setLines((ls) => ls.map((ln) => (ln.tva === 10 ? { ...ln, tva: 20 } : ln))); }}>Professionnel (commerce, bureau)</button>
            </div>
            {/* TVA réduite 10 % réservée aux particuliers (logement > 2 ans). Un pro est toujours à 20 %. */}
            {clientType === "particulier"
              ? <label className="chk"><input type="checkbox" checked={plus2ans} onChange={(e) => setPlus2ans(e.target.checked)} /> Logement achevé depuis plus de 2 ans (TVA 10 % sur la pose)</label>
              : <p className="legend" style={{ marginTop: 8 }}>Professionnel : <b>TVA 20 %</b> (pas de taux réduit).</p>}
            {clientType === "pro" && (
              <div className="grid">
                <div><label>Entreprise</label><input value={client.entreprise} onChange={(e) => setClient({ ...client, entreprise: e.target.value })} placeholder="Raison sociale" /></div>
                <div><label>N° SIREN / SIRET</label><input value={client.siren} onChange={(e) => setClient({ ...client, siren: e.target.value })} placeholder="123 456 789 00012" /></div>
              </div>
            )}
            <div className="grid">
              <div><label>{clientType === "pro" ? "Contact" : "Nom du client"}</label><input value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} placeholder="Nom Prénom" /></div>
              <div><label>Téléphone</label><input value={client.tel} onChange={(e) => setClient({ ...client, tel: e.target.value })} placeholder="06 ..." /></div>
            </div>
            <label>E-mail (nécessaire pour envoyer le devis)</label>
            <input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="client@email.fr" />
            <label style={{ marginTop: 12 }}>Adresse du chantier</label>
            <AddressAutocomplete value={client.adr} onChange={(v) => setClient((c) => ({ ...c, adr: v }))}
              onSelect={(s) => setClient((c) => ({ ...c, adr: s.label, cp: s.postcode, ville: s.city }))}
              placeholder="Commencez à taper l'adresse…" className="ct-addr-input" />
            <div className="grid" style={{ marginTop: 12 }}>
              <div><label>Code postal</label><input value={client.cp} onChange={(e) => setClient({ ...client, cp: e.target.value })} placeholder="75015" /></div>
              <div><label>Ville</label><input value={client.ville} onChange={(e) => setClient({ ...client, ville: e.target.value })} placeholder="Paris" /></div>
            </div>
          </section>

          {prestation === "installation" && (<>
          {/* B. Pièces */}
          <section className="card">
            <h2><span className="n">B</span> Pièces à climatiser</h2>
            {rooms.map((r, idx) => {
              const w = roomPower(r), btu = classify(w);
              return (
                <div className="room" key={r.id}>
                  <div className="rhead"><span className="rtag">Pièce {idx + 1}</span><span className="rcalc">{(w / 1000).toFixed(1)} kW · {btu} BTU</span></div>
                  <div className="grid">
                    <div><label>Type</label>
                      <select value={r.nom} onChange={(e) => patchRoom(idx, "nom", e.target.value)}>{["Salon", "Chambre", "Bureau", "Cuisine", "Autre"].map((o) => <option key={o}>{o}</option>)}</select></div>
                    <div><label>Surface (m²)</label><input type="number" min={1} value={r.surface} onChange={(e) => patchRoom(idx, "surface", parseFloat(e.target.value) || 0)} /></div>
                  </div>
                  <div className="grid-3">
                    <div><label>Plafond (m)</label><input type="number" step={0.1} value={r.hauteur} onChange={(e) => patchRoom(idx, "hauteur", parseFloat(e.target.value) || 0)} /></div>
                    <div><label>Orientation</label><select value={r.orientation} onChange={(e) => patchRoom(idx, "orientation", e.target.value)}><option value="nord">Nord</option><option value="est">Est</option><option value="ouest">Ouest</option><option value="sud">Sud</option></select></div>
                    <div><label>Isolation</label><select value={r.isolation} onChange={(e) => patchRoom(idx, "isolation", e.target.value)}><option value="ancien">Ancien</option><option value="standard">Standard</option><option value="bbc">BBC/récent</option></select></div>
                  </div>
                  <div className="grid">
                    <div><label>Occupants</label><input type="number" min={0} value={r.occupants} onChange={(e) => patchRoom(idx, "occupants", parseFloat(e.target.value) || 0)} /></div>
                    <div><label>Distance int. → ext. (m)</label><input type="number" min={0} value={r.distance} onChange={(e) => patchRoom(idx, "distance", parseFloat(e.target.value) || 0)} /></div>
                  </div>
                  <label className="chk"><input type="checkbox" checked={r.baie} onChange={(e) => patchRoom(idx, "baie", e.target.checked)} /> Grande baie vitrée</label>
                  <label className="chk"><input type="checkbox" checked={r.combles} onChange={(e) => patchRoom(idx, "combles", e.target.checked)} /> Dernier étage / sous combles</label>
                  <label className="chk"><input type="checkbox" checked={r.chaleur} onChange={(e) => patchRoom(idx, "chaleur", e.target.checked)} /> Source de chaleur (cuisine ouverte, informatique…)</label>
                  <label className="chk"><input type="checkbox" checked={r.evac} onChange={(e) => patchRoom(idx, "evac", e.target.checked)} /> Évacuation des condensats par gravité possible</label>
                  {rooms.length > 1 && <button className="rx" onClick={() => delRoom(r.id)} title="Supprimer">✕</button>}
                </div>
              );
            })}
            <button className="btn ghost sm" onClick={addRoom}>+ Ajouter une pièce</button>
          </section>

          {/* C. Installation */}
          <section className="card">
            <h2><span className="n">C</span> Installation et accès</h2>
            <div className="grid">
              <div><label>Emplacement unité extérieure</label><select value={install.empl} onChange={(e) => setInstall({ ...install, empl: e.target.value })}><option value="sol">Au sol (plots)</option><option value="facade">Façade (équerres)</option><option value="balcon">Balcon</option><option value="toiture">Toiture / en hauteur</option></select></div>
              <div><label>Distance au tableau électrique (m)</label><input type="number" min={0} value={install.tableau} onChange={(e) => setInstall({ ...install, tableau: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid">
              <div><label>Nombre de murs à percer</label><input type="number" min={0} value={install.nbMurs} onChange={(e) => setInstall({ ...install, nbMurs: parseInt(e.target.value) || 0 })} /></div>
              <div><label>Matériau des murs</label><select value={install.murMat} onChange={(e) => setInstall({ ...install, murMat: e.target.value })}><option value="placo">Placo / cloison</option><option value="brique">Brique / parpaing</option><option value="beton">Béton</option><option value="pierre">Pierre</option></select></div>
            </div>
            <label className="chk"><input type="checkbox" checked={install.immeuble} onChange={(e) => setInstall({ ...install, immeuble: e.target.checked })} /> Logement en immeuble / copropriété</label>
            <label className="chk"><input type="checkbox" checked={install.faibleDb} onChange={(e) => setInstall({ ...install, faibleDb: e.target.checked })} /> Unité extérieure à faible niveau sonore souhaitée</label>
            <label className="chk"><input type="checkbox" checked={install.nacelle} onChange={(e) => setInstall({ ...install, nacelle: e.target.checked })} /> Accès difficile / nacelle nécessaire</label>
            <label className="chk"><input type="checkbox" checked={install.compteur} onChange={(e) => setInstall({ ...install, compteur: e.target.checked })} /> Évolution du compteur / tableau électrique nécessaire</label>
            <label className="chk"><input type="checkbox" checked={install.depose} onChange={(e) => setInstall({ ...install, depose: e.target.checked })} /> Ancien matériel à déposer</label>
            {dbHint.length > 0 && <div className="note">{dbHint.map((m, i) => <div key={i}>{m}</div>)}</div>}
          </section>

          {/* D. Marque */}
          <section className="card">
            <h2><span className="n">D</span> Marque proposée</h2>
            <div className="brands">
              {cat.brands.map((b) => {
                const pr = priceFor(cfg, b.id, cat);
                return (
                  <button key={b.id} className={"brand" + (b.id === brand ? " on" : "")} onClick={() => setBrand(b.id)}>
                    <div className="bn">{b.name}</div><div className="bpos">{b.pos}</div><div className="bp">{eur(pr.price, 0)} €</div><div className="bdb">ext. {b.db}</div>
                  </button>
                );
              })}
            </div>
            <p className="legend">Prix du matériel principal seul, pour la configuration calculée. La pose et les postes annexes sont chiffrés dans le devis.</p>
          </section>
          </>)}

          {/* Prestations hors installation : entretien / dépannage / dépose / autre (forfaits) */}
          {prestation !== "installation" && (
            <section className="card">
              <h2><span className="n">B</span> {prestation === "entretien" ? "Entretien" : prestation === "depannage" ? "Dépannage" : prestation === "depose" ? "Dépose" : "Prestation"}</h2>
              {(prestation === "entretien" || prestation === "depose") && (
                <div className="field"><label>Nombre d&apos;unités{prestation === "depose" ? " à déposer" : " à entretenir"}</label>
                  <input type="number" min={1} value={prestaUnits} onChange={(e) => setPrestaUnits(parseInt(e.target.value) || 1)} /></div>
              )}
              {prestation === "entretien" && (
                <label className="chk"><input type="checkbox" checked={prestaContrat} onChange={(e) => setPrestaContrat(e.target.checked)} /> Contrat d&apos;entretien annuel (au lieu d&apos;un entretien ponctuel)</label>
              )}
              {prestation === "autre" && (
                <div className="field"><label>Description de la prestation</label>
                  <input value={prestaNote} onChange={(e) => setPrestaNote(e.target.value)} placeholder="ex : déplacement d'une unité, modification d'installation…" /></div>
              )}
              {(prestation === "depannage" || prestation === "depose" || prestation === "autre") && (
                <div className="field"><label>Main d&apos;œuvre estimée (heures)</label>
                  <input type="number" min={0} step={0.5} value={prestaHours} onChange={(e) => setPrestaHours(parseFloat(e.target.value) || 0)} /></div>
              )}
              <p className="legend">Le devis pré-rempli ci-après (forfaits du catalogue) reste entièrement modifiable, et tu peux ajouter des lignes libres (pièces, etc.).</p>
            </section>
          )}

          <button className="btn primary" onClick={generate}>Calculer le devis</button>
          <div className="draftrow">
            <button className="btn ghost sm" onClick={saveDraft} disabled={savingDraft}>{savingDraft ? "Enregistrement…" : "💾 Enregistrer le brouillon"}</button>
            {draftMsg && <span className="draftmsg">{draftMsg}</span>}
          </div>

          {/* Catalogue éditable (central, persistant) */}
          <details className="cat" open={catOpen} onToggle={(e) => setCatOpen((e.target as HTMLDetailsElement).open)}>
            <summary>Catalogue de prix (modifiable — enregistré pour toute l'équipe)</summary>
            <div className="catbody">
              <p className="legend">Modifie ici tes prix de vente HT. « Enregistrer » sauvegarde le catalogue côté serveur : tous les commerciaux auront les bons prix.</p>
              <div className="catrow head"><div className="cl"><b>Configuration</b></div>{cat.brands.map((b) => <div className="ch" key={b.id}>{b.name}</div>)}</div>
              {Object.entries(cat.equip).map(([k, v]) => (
                <div className="catrow" key={k}>
                  <div className="cl">{v.label}</div>
                  {cat.brands.map((b) => (
                    <input key={b.id} type="number" value={v.p[b.id] ?? 0}
                      onChange={(e) => setCat((c) => ({ ...c, equip: { ...c.equip, [k]: { ...c.equip[k], p: { ...c.equip[k].p, [b.id]: parseFloat(e.target.value) || 0 } } } }))} />
                  ))}
                </div>
              ))}
              <h3>Postes annexes (HT)</h3>
              {Object.entries(cat.annex).map(([k, v]) => (
                <div className="catrow2" key={k}>
                  <div className="cl">{v.label}</div>
                  <input type="number" step={0.1} value={v.v} onChange={(e) => setCat((c) => ({ ...c, annex: { ...c.annex, [k]: { ...c.annex[k], v: parseFloat(e.target.value) || 0 } } }))} />
                </div>
              ))}
              <h3>Forfaits prestations (HT) — entretien / dépannage / dépose</h3>
              {Object.entries(cat.forfaits ?? {}).map(([k, v]) => (
                <div className="catrow2" key={k}>
                  <div className="cl">{v.label}</div>
                  <input type="number" step={0.1} value={v.v} onChange={(e) => setCat((c) => ({ ...c, forfaits: { ...c.forfaits, [k]: { ...c.forfaits[k], v: parseFloat(e.target.value) || 0 } } }))} />
                </div>
              ))}
              <div className="catrow2"><div className="cl">Main d'œuvre (€/heure)</div><input type="number" value={cat.moRate} onChange={(e) => setCat((c) => ({ ...c, moRate: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="catrow2"><div className="cl">Coefficient de marge (coût × ce nombre = vente)</div><input type="number" step={0.001} value={cat.marginCoeff} onChange={(e) => setCat((c) => ({ ...c, marginCoeff: parseFloat(e.target.value) || 0 }))} /></div>
              <button className="btn primary sm" style={{ marginTop: 12 }} onClick={saveCatalogue} disabled={savingCat}>
                {savingCat ? "Enregistrement…" : catSaved ? "✓ Enregistré pour l'équipe" : "Enregistrer le catalogue"}
              </button>
            </div>
          </details>
        </div>
      )}

      {/* ─── Devis estimatif ─── */}
      {generated && (
        <div className="devis card">
          <h2 className="okh"><span className="n ok">✓</span> Devis estimatif</h2>
          <div className="dmeta">
            <div className="box"><b>Client</b><div>{[client.nom, client.tel].filter(Boolean).join(" · ") || "—"}</div></div>
            <div className="box"><b>Chantier</b><div>{[client.adr, `${client.cp} ${client.ville}`.trim()].filter(Boolean).join(", ") || "—"}</div></div>
          </div>
          <div className="dconf">
            {prestation === "installation" ? (<>
              <span className="pill">{cat.brands.find((x) => x.id === brand)?.name}</span>
              <span className="pill">{cfg.n} pièce(s)</span>{" "}
              {rooms.map((r, idx) => `P${idx + 1}: ${classify(roomPower(r))} BTU`).join(" · ")}
            </>) : (
              <span className="pill">{prestation === "entretien" ? "Entretien" : prestation === "depannage" ? "Dépannage" : prestation === "depose" ? "Dépose" : "Prestation"}</span>
            )}
          </div>
          <table className="ltbl">
            <thead><tr><th>Désignation</th><th className="num">Qté</th><th className="num">P.U. HT</th><th className="num">TVA</th><th className="num">Total HT</th></tr></thead>
            <tbody>
              {lines.map((ln, i) => (
                <tr key={i}>
                  <td><input value={ln.d} onChange={(e) => patchLine(i, "d", e.target.value)} style={{ width: "100%" }} /></td>
                  <td className="num"><input className="q" type="number" value={ln.q} onChange={(e) => (ln.isMO ? setHoursLine(parseFloat(e.target.value) || 0) : patchLine(i, "q", e.target.value))} /></td>
                  <td className="num"><input className="pu" type="number" value={ln.pu} onChange={(e) => patchLine(i, "pu", e.target.value)} /></td>
                  <td className="num"><select className="tva" value={ln.tva} onChange={(e) => patchLine(i, "tva", e.target.value)}><option value={20}>20</option>{clientType === "particulier" && <option value={10}>10</option>}</select></td>
                  <td className="num">{eur(ln.q * ln.pu)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn ghost sm noprint" onClick={addFreeLine} style={{ marginTop: 10 }}>+ Ligne libre</button>
          <div className="hours noprint"><span>Main d'œuvre estimée :</span><input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHoursLine(parseFloat(e.target.value) || 0)} /><span>heures à {cat.moRate} €/h</span></div>
          <div className="tots">
            <div className="tbar"><span>Total HT</span><span>{eur(totals.ht)} €</span></div>
            <div className="tbar"><span>TVA</span><span>{eur(totals.tva)} €</span></div>
            <div className="tbar grand"><span>Total TTC</span><span>{eur(totals.ttc)} €</span></div>
          </div>
          {notes.length > 0 && <div className="note noprint">À vérifier : {notes.join(" ")}</div>}
          <div className="mentions">
            CLIM EXPERT · SAS au capital de 1 000 € · 200 rue de la Croix Nivert, 75015 Paris · SIRET 992 975 862 00010 · TVA FR77 992 975 862<br />
            Assurance décennale : ERGO France, contrat SV75018041T42457, France métropolitaine et DROM · Devis estimatif, à valider après visite technique. Validité 30 jours.
          </div>
          {sent ? (
            <div className="sentbox noprint">✓ Devis envoyé au client par e-mail. Le prospect est passé en <b>« Devis envoyé »</b>.{leadId && <> · <a href={`/admin/leads?lead=${leadId}`} target="_blank" rel="noopener noreferrer">Ouvrir la fiche</a></>}</div>
          ) : (
            <>
              <button className="btn primary noprint" onClick={sendDevis} disabled={sending} style={{ marginTop: 16 }}>{sending ? "Envoi en cours…" : "Envoyer le devis au client"}</button>
              {sendErr && <div className="senderr noprint">{sendErr}</div>}
            </>
          )}
          <div className="actrow noprint">
            <button className="btn ghost sm" onClick={downloadPdf} disabled={pdfBusy}>{pdfBusy ? "Génération…" : "Imprimer / PDF"}</button>
            <button className="btn ghost sm" onClick={() => { setGenerated(false); setSent(false); setSendErr(""); }}>Modifier les réponses</button>
            <button className="btn ghost sm" onClick={saveDraft} disabled={savingDraft}>{savingDraft ? "…" : "💾 Brouillon"}</button>
          </div>
          {draftMsg && <div className="draftmsg noprint">{draftMsg}</div>}
        </div>
      )}

      {/* Barre fixe d'estimation rapide */}
      {!generated && (
        <div className="stickybar noprint">
          <div className="sttot">Estimation TTC<b>≈ {eur(quickTtc, 0)} €</b></div>
          <button className="btn primary" onClick={generate}>Voir le devis</button>
        </div>
      )}
    </div>
  );
}

const CT_CSS = `
.ct{--blue:#1C9FDA;--blue-d:#1582B7;--navy:#0F1B2D;--ink:#1A2433;--muted:#6A7686;--line:#E2E8F0;--bg:#F5F7FA;--ok:#15924A;--warn:#FBF1E3;--r:12px;color:var(--ink);font-size:15px;line-height:1.45;max-width:880px;margin:0 auto;padding-bottom:96px}
.ct *{box-sizing:border-box}
.ct .card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px;margin-bottom:16px}
.ct h2{font-size:13px;text-transform:uppercase;letter-spacing:.8px;color:var(--blue-d);margin:0 0 14px;display:flex;align-items:center;gap:8px}
.ct h2 .n{background:var(--blue);color:#fff;width:22px;height:22px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.ct h2 .n.ok{background:var(--ok)}
.ct h3{font-size:12px;color:var(--navy);margin:18px 0 8px}
.ct label{display:block;font-size:12px;color:var(--muted);margin:0 0 4px;font-weight:600}
.ct input,.ct select{width:100%;padding:9px 10px;border:1px solid var(--line);border-radius:8px;font-size:15px;background:#fff;color:var(--ink);font-family:inherit}
.ct input:focus,.ct select:focus{outline:2px solid var(--blue);outline-offset:-1px;border-color:var(--blue)}
.ct .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
.ct .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:12px}
.ct .grid > div,.ct .grid-3 > div{min-width:0}
.ct .chk{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink);font-weight:500;padding:6px 0;cursor:pointer;margin:0}
.ct .chk input{width:auto;transform:scale(1.25)}
.ct .seg{display:flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;margin-bottom:12px}
.ct .seg button{flex:1;background:#fff;border:none;padding:9px 6px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted);font-family:inherit}
.ct .seg button.on{background:var(--blue);color:#fff}
.ct .room{border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px;background:#FBFCFE;position:relative}
.ct .rhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.ct .rtag{font-weight:700;font-size:13px;color:var(--navy)}
.ct .rcalc{font-size:12px;color:var(--blue-d);font-weight:700;background:#E8F5FC;border-radius:20px;padding:3px 10px}
.ct .rx{position:absolute;top:8px;right:8px;background:transparent;border:none;color:var(--muted);font-size:18px;cursor:pointer}
.ct .btn{appearance:none;border:none;border-radius:9px;padding:11px 16px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
.ct .btn.primary{background:var(--blue);color:#fff;width:100%}
.ct .btn.primary:hover{background:var(--blue-d)}
.ct .btn.ghost{background:#fff;color:var(--blue-d);border:1px solid var(--blue)}
.ct .btn.sm{padding:7px 12px;font-size:13px;width:auto}
.ct .brands{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.ct .brand{border:1px solid var(--line);border-radius:10px;padding:10px 6px;cursor:pointer;text-align:center;background:#fff}
.ct .brand.on{border-color:var(--blue);box-shadow:0 0 0 2px var(--blue) inset}
.ct .brand .bn{font-size:13px;font-weight:800;color:var(--navy)}
.ct .brand .bpos{font-size:10px;text-transform:uppercase;color:var(--muted);margin-top:1px}
.ct .brand .bp{font-size:15px;font-weight:800;color:var(--blue-d);margin-top:5px}
.ct .brand .bdb{font-size:10px;color:var(--muted);margin-top:2px}
.ct .legend{font-size:12px;color:var(--muted);margin-top:8px}
.ct .prefill{background:#E8F5FC;border:1px solid #B9E2F5;border-radius:9px;padding:10px 12px;font-size:13px;color:var(--blue-d);margin-bottom:16px}
.ct .draftrow{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap}
.ct .draftmsg{font-size:12px;color:var(--ok);font-weight:600;margin-top:6px}
.ct .actrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.ct .sentbox{background:#E6F6EC;border:1px solid #B7E3C6;border-radius:9px;padding:12px 14px;font-size:14px;color:#15613a;margin-top:16px}
.ct .sentbox a{color:var(--blue-d);font-weight:700}
.ct .senderr{background:#FDEAEA;border:1px solid #F3C4C4;border-radius:9px;padding:10px 12px;font-size:13px;color:#9B2C2C;margin-top:8px}
.ct .note{background:var(--warn);border:1px solid #EAD4AE;border-radius:9px;padding:10px 12px;font-size:12.5px;color:#7A4D12;margin-top:10px}
.ct .note > div{margin:2px 0}
.ct details.cat{background:#fff;border:1px solid var(--line);border-radius:var(--r);margin-top:16px}
.ct details.cat summary{padding:14px 16px;font-size:13px;text-transform:uppercase;letter-spacing:.8px;color:var(--blue-d);font-weight:700;cursor:pointer}
.ct .catbody{padding:0 16px 16px}
.ct .catrow,.ct .catrow.head{display:grid;grid-template-columns:1.3fr repeat(5,1fr);gap:6px;align-items:center;margin-bottom:5px}
.ct .catrow2{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:center;margin-bottom:5px}
.ct .catrow .cl,.ct .catrow2 .cl{font-size:12px;color:var(--ink)}
.ct .catrow.head .ch{font-size:10px;text-transform:uppercase;color:var(--muted);text-align:center;font-weight:700}
.ct .catrow input,.ct .catrow2 input{padding:5px 6px;font-size:12px;text-align:right}
.ct .devis .okh{border:none}
.ct .dmeta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;font-size:13px}
.ct .dmeta .box{border:1px solid var(--line);border-radius:8px;padding:10px}
.ct .dmeta .box b{display:block;font-size:11px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.ct .dconf{margin-bottom:12px}
.ct .pill{display:inline-block;background:#E8F5FC;color:var(--blue-d);border-radius:20px;padding:3px 11px;font-size:12px;font-weight:700;margin-right:4px}
.ct table.ltbl{width:100%;border-collapse:collapse;font-size:14px}
.ct .ltbl th,.ct .ltbl td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:middle}
.ct .ltbl th{font-size:11px;text-transform:uppercase;color:var(--muted)}
.ct .ltbl td.num,.ct .ltbl th.num{text-align:right;white-space:nowrap}
.ct .ltbl input{padding:6px;font-size:13px}
.ct .ltbl input.q{width:56px;text-align:center}
.ct .ltbl input.pu{width:84px;text-align:right}
.ct .ltbl select.tva{width:64px;padding:6px}
.ct .hours{display:flex;align-items:center;gap:8px;margin:12px 0;font-size:14px}
.ct .hours input{width:70px;text-align:center}
.ct .tots{margin-top:14px;max-width:340px;margin-left:auto}
.ct .tbar{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
.ct .tbar.grand{border-top:2px solid var(--navy);margin-top:6px;padding-top:10px;font-size:18px;font-weight:800;color:var(--navy)}
.ct .mentions{font-size:11px;color:var(--muted);line-height:1.5;margin-top:14px;border-top:1px solid var(--line);padding-top:10px}
.ct .stickybar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;z-index:20;box-shadow:0 -4px 16px rgba(15,27,45,.06)}
.ct .stickybar .sttot{font-size:13px;color:var(--muted)}
.ct .stickybar .sttot b{display:block;font-size:20px;color:var(--navy)}
.ct .stickybar .btn{width:auto}
@media(max-width:560px){.ct .grid,.ct .grid-3{grid-template-columns:1fr}.ct .brands{grid-template-columns:repeat(2,1fr)}.ct .catrow{grid-template-columns:1fr;gap:2px}.ct .catrow.head{display:none}}
@media print{.ct .noprint,.ct .stickybar,.ct details.cat{display:none!important}.ct .card{border:none;padding:0}}
`;
