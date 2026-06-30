"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Phone, Bot, FileText, MapPin, Wrench,
  MessageSquare, Clock, LayoutList, Columns3, UserPlus, CheckCircle2, Send,
  AlertTriangle, GitMerge, X, Search, Mail, ChevronRight, ChevronDown, Briefcase, Plus,
  Pencil, Check, ShieldCheck, CalendarPlus, Star, Maximize2, Minimize2, ClipboardPaste, Camera, Pin, Calculator, Copy,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leads";
import { detectDuplicates, leadAction } from "@/lib/leads-utils";
import { extractPhones } from "@/lib/phone";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import LeadQualification from "./LeadQualification";
import LeadParcours from "./LeadParcours";
import LeadAttachments from "./LeadAttachments";
import type { LeadTache } from "@/lib/qualification";
import NouveauDevisModal from "@/components/NouveauDevisModal";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; col: string }> = {
  nouveau:          { label: "Nouveau",          color: "bg-sky-500/10 text-sky-400 border-sky-500/30",       col: "border-t-sky-500" },
  pas_de_reponse:   { label: "Pas de réponse",   color: "bg-rose-500/10 text-rose-400 border-rose-500/30",    col: "border-t-rose-500" },
  contacté:         { label: "Contact établi",   color: "bg-amber-500/10 text-amber-400 border-amber-500/30", col: "border-t-amber-500" },
  devis_envoyé:     { label: "Devis envoyé",     color: "bg-violet-500/10 text-violet-400 border-violet-500/30", col: "border-t-violet-500" },
  gagné:            { label: "Gagné",            color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", col: "border-t-emerald-500" },
  perdu:            { label: "Perdu",            color: "bg-slate-500/10 text-slate-400 border-slate-500/30", col: "border-t-slate-500" },
};

// Les colonnes du Kanban sont définies par BOARD_COLUMNS (ci-dessous). « Pas de réponse » et
// « Perdu » ne sont pas des colonnes : pas-de-réponse reste dans « Nouveau » (file d'appels),
// perdu est accessible via la carte stat « Perdu » → vue Liste. STATUS_CONFIG garde tous les
// statuts pour les libellés/couleurs (badges, select de la liste).

// Colonnes du Kanban. « RDV pris » est une colonne VIRTUELLE : ce sont les prospects « contacté »
// dont la prochaine étape est rdv_pris (pas de statut dédié en base, donc aucune migration).
// « Perdu » n'est plus une colonne (accessible via la carte stat « Perdu » → vue Liste).
type BoardColumn = { key: string; status: LeadStatus; label: string; color: string; col: string; dot: string };
const BOARD_COLUMNS: BoardColumn[] = [
  { key: "nouveau",      status: "nouveau",      label: "Nouveau",        color: STATUS_CONFIG.nouveau.color,      col: "border-t-sky-500",     dot: "bg-sky-400" },
  { key: "contacté",     status: "contacté",     label: "Contact établi", color: STATUS_CONFIG.contacté.color,     col: "border-t-amber-500",   dot: "bg-amber-400" },
  { key: "rdv_pris",     status: "contacté",     label: "RDV pris",       color: "bg-teal-500/10 text-teal-300 border-teal-500/30", col: "border-t-teal-500", dot: "bg-teal-400" },
  { key: "devis_envoyé", status: "devis_envoyé", label: "Devis envoyé",   color: STATUS_CONFIG.devis_envoyé.color, col: "border-t-violet-500",  dot: "bg-violet-400" },
  { key: "gagné",        status: "gagné",        label: "Gagné",          color: STATUS_CONFIG.gagné.color,        col: "border-t-emerald-500", dot: "bg-emerald-400" },
];

// Colonne d'affichage d'un prospect (RDV pris = sous-ensemble de « contacté »).
function colOfLead(l: Lead): string {
  if (l.status === "contacté" && (l as Lead & { prochaineEtape?: string | null }).prochaineEtape === "rdv_pris") return "rdv_pris";
  return l.status;
}

// Journal d'échanges : type → icône.
const SUIVI_ICONS: Record<string, string> = { appel: "📞", email: "✉️", sms: "💬", visite: "📍", note: "📝", statut: "🏷️", devis: "📄", rdv: "📅" };

// Sous-statut « Prochaine étape » quand le contact est établi (avant l'envoi du devis).
// "aucune_opportunite" est une action terminale : le prospect passe en "perdu".
const PROCHAINE_ETAPE: Record<string, { label: string; short: string; emoji: string; color: string }> = {
  rdv_a_convenir:     { label: "RDV à convenir (client en attente)", short: "RDV à convenir", emoji: "⏳", color: "text-orange-300" },
  rdv_pris:           { label: "Rendez-vous pris",          short: "RDV pris",      emoji: "📅", color: "text-emerald-300" },
  a_recontacter:      { label: "À recontacter",             short: "À recontacter", emoji: "🔁", color: "text-amber-300" },
  en_reflexion:       { label: "Le client doit réfléchir",  short: "Réflexion",     emoji: "🤔", color: "text-slate-300" },
  devis_a_faire:      { label: "Devis à faire",             short: "Devis à faire", emoji: "📝", color: "text-sky-300" },
  aucune_opportunite: { label: "Aucune opportunité (→ perdu)", short: "Aucune opportunité", emoji: "❌", color: "text-rose-300" },
};

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien",
  depannage: "Dépannage",
  "contrat-pro": "Contrat pro",
  autre: "Autre",
};

const DEPT_LABELS: Record<string, string> = {
  "75": "Paris (75)", "77": "Seine-et-Marne (77)", "78": "Yvelines (78)",
  "91": "Essonne (91)", "92": "Hauts-de-Seine (92)", "93": "Seine-St-Denis (93)",
  "94": "Val-de-Marne (94)", "95": "Val-d'Oise (95)",
};
// Département (2 chiffres) déduit du secteur d'un lead (1er code postal trouvé dans location).
function deptOf(location?: string | null): string | null {
  const m = (location ?? "").match(/\b(\d{2})\d{3}\b/);
  return m ? m[1] : null;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

// Ancienneté compacte ("3j", "5h", "à l'instant") pour la dernière activité.
function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `${days}j`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h`;
  const m = Math.floor(diff / 60000);
  return m >= 1 ? `${m}min` : "à l'instant";
}

// Initiales d'un nom (max 2 lettres) pour la pastille commercial.
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// Convertit une date stockée en valeur d'un <input type="datetime-local">.
function toLocalDT(d: string | Date | null | undefined): string {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
}

// Cale une valeur datetime-local sur la demi-heure la plus proche (8h39 → 8h30, 8h46 → 9h00).
function snap30(localDT: string): string {
  if (!localDT) return localDT;
  const x = new Date(localDT);
  if (isNaN(x.getTime())) return localDT;
  const m = x.getMinutes();
  x.setMinutes(m < 15 ? 0 : m < 45 ? 30 : 60, 0, 0);
  return toLocalDT(x);
}

type Suivi = { id: string; type: string; contenu: string | null; createdAt: string; auteur: string | null };

export default function LeadsManager({ initialLeads, initialSource, lastActivity = {}, counts = {}, cap = 50 }: { initialLeads: Lead[]; initialSource?: string; lastActivity?: Record<string, string>; counts?: Record<string, number>; cap?: number }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [colCounts, setColCounts] = useState<Record<string, number>>(counts);   // total réel par colonne
  const [activityMap, setActivityMap] = useState<Record<string, string>>(lastActivity);
  const [loadingCol, setLoadingCol] = useState<LeadStatus | null>(null);
  const [searching, setSearching] = useState(false);
  const [sourceFilter, setSourceFilter] = useState(initialSource ?? "tous");
  const [favorisOnly, setFavorisOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("tous");       // prestation (installation/entretien/…)
  const [secteurFilter, setSecteurFilter] = useState("tous"); // département (75, 92, …)
  const [actionFilter, setActionFilter] = useState("tous");   // action à faire (à recontacter, devis à faire, RDV…)
  const [commercialFilter, setCommercialFilter] = useState("tous"); // commercial assigné
  const [statusFilter, setStatusFilter] = useState<string>("tous"); // raccourci par étape (surtout mobile)
  const [focusedStatus, setFocusedStatus] = useState<string | null>(null); // focus sur une colonne (desktop)
  // Journal d'échanges du prospect ouvert (chargé à l'ouverture du panneau).
  const [suivis, setSuivis] = useState<Suivi[]>([]);
  const [loadingSuivis, setLoadingSuivis] = useState(false);
  const [msgDraft, setMsgDraft] = useState("");        // message interne en cours de rédaction
  const [sendingMsg, setSendingMsg] = useState(false);
  const [devisHist, setDevisHist] = useState<{ id: string; url: string; montantCt: number | null; envoyeLe: string; decision: string | null; decisionLe: string | null; motifRefus: string | null; accepteIp: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState<string | null>(null); // clé de colonne survolée (statut ou « rdv_pris »)
  const [mergingPanel, setMergingPanel] = useState<{ leadId: string; dupes: Lead[] } | null>(null);
  const [merging, setMerging] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const lastUrlLeadId = useRef<string | null>(null);
  const searchParams = useSearchParams();
  // Ouvre la fiche du prospect ciblé via ?lead=<id> (liens depuis le Planning / Dashboard).
  // On mémorise le dernier id traité : ré-ouvrable sur un AUTRE lead, et ne se ré-ouvre pas
  // tout seul si on ferme le panneau (l'URL garde le paramètre).
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (!leadId || leadId === lastUrlLeadId.current) return;
    const found = leads.find((l) => l.id === leadId);
    if (found) { lastUrlLeadId.current = leadId; setSelectedLead(found); }
  }, [searchParams, leads]);
  const [showAddModal, setShowAddModal] = useState(false);
  // Import en masse de numéros à rappeler
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number; total: number } | null>(null);
  const bulkDetected = useMemo(() => extractPhones(bulkText).length, [bulkText]);

  async function importNumbers() {
    setBulkLoading(true); setBulkResult(null);
    try {
      const res = await fetch("/api/admin/leads/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bulkText }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert("⚠️ " + (d.error ?? "Erreur lors de l'import")); return; }
      setBulkResult(d);
    } finally { setBulkLoading(false); }
  }

  // Envoi d'un devis (PDF externe) au prospect ouvert dans le panneau
  const [devisOpen, setDevisOpen] = useState(false);
  const [devisFile, setDevisFile] = useState<File | null>(null);
  const [devisMontant, setDevisMontant] = useState("");
  const [devisMessage, setDevisMessage] = useState("");
  const [devisSending, setDevisSending] = useState(false);
  const [devisError, setDevisError] = useState("");
  const [devisDrag, setDevisDrag] = useState(false);

  function openDevis(l: Lead) {
    setDevisFile(null); setDevisError(""); setDevisMessage("");
    setDevisMontant(l.montantDevisCt ? String(l.montantDevisCt / 100) : "");
    setDevisOpen(true);
  }

  async function sendDevis() {
    const id = selectedLead?.id;
    if (!id || !devisFile) return;
    setDevisSending(true); setDevisError("");
    try {
      const fd = new FormData();
      fd.append("file", devisFile);
      if (devisMontant.trim()) fd.append("montant", devisMontant.trim());
      if (devisMessage.trim()) fd.append("message", devisMessage.trim());
      const res = await fetch(`/api/admin/leads/${id}/devis`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setDevisError(d.error ?? "Échec de l'envoi."); return; }
      setDevisOpen(false);
      window.location.reload(); // refléter le nouveau statut + l'historique
    } catch { setDevisError("Erreur réseau, réessayez."); }
    finally { setDevisSending(false); }
  }
  const [addForm, setAddForm] = useState({ name: "", phone: "", source: "téléphone", project: "", location: "", address: "", email: "", notes: "", consentementMarketing: false, typeClient: "particulier", entreprise: "", siren: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingLead, setEditingLead] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", project: "", location: "", address: "", typeClient: "particulier", entreprise: "", siren: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  // Retour visuel d'enregistrement des champs auto-sauvegardés (visite, relance, montant, RDV…).
  const [saveFlash, setSaveFlash] = useState<"idle" | "saving" | "saved">("idle");
  const saveFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qualifLink, setQualifLink] = useState<{ link: string; sms: string; phone: string } | null>(null); // lien + SMS de qualification Alex
  const [qualifBusy, setQualifBusy] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [qualifEmailBusy, setQualifEmailBusy] = useState(false);
  const [qualifEmailSent, setQualifEmailSent] = useState(false);
  const [visiteDraft, setVisiteDraft] = useState<string | null>(null); // brouillon d'édition de la visite (null = non modifié)
  const [visiteOpen, setVisiteOpen] = useState(false); // encadré « Visite client » ouvert ?
  const [notesOpen, setNotesOpen] = useState(false);   // note interne / conversation Alex dépliée ?
  const [showAllHistory, setShowAllHistory] = useState(false); // historique des messages internes déplié ?
  const [tab, setTab] = useState<"qualif" | "parcours" | "pieces" | "histo">("qualif"); // onglet actif de la fiche
  const [rdvDraft, setRdvDraft] = useState<string | null>(null); // brouillon de la date de RDV (null = non modifié)
  const [installDraft, setInstallDraft] = useState<string | null>(null); // brouillon du créneau d'intervention provisoire
  const [installOpen, setInstallOpen] = useState(false);
  const [installDuree, setInstallDuree] = useState(120); // durée du créneau provisoire (min), défaut 2h
  const [rdvConfirmBusy, setRdvConfirmBusy] = useState(false);
  const [rdvConfirmSent, setRdvConfirmSent] = useState(false); // e-mail de confirmation de RDV envoyé
  const dragId = useRef<string | null>(null);
  const [commerciaux, setCommerciaux] = useState<{ id: string; name: string; prenom: string | null; color: string | null }[]>([]);

  useEffect(() => {
    // Liste des commerciaux affectables (inclut les administrateurs, qui ont tous les rôles).
    fetch("/api/admin/equipe").then(r => r.json()).then(d => setCommerciaux(d.commerciaux ?? [])).catch(() => {});
  }, []);

  // Charge le journal d'échanges du prospect ouvert.
  const openLeadId = selectedLead?.id;
  useEffect(() => {
    if (!openLeadId) { setSuivis([]); return; }
    setLoadingSuivis(true);
    fetch(`/api/admin/leads/${openLeadId}/suivis`)
      .then(r => r.json())
      .then(d => setSuivis(d.suivis ?? []))
      .catch(() => {})
      .finally(() => setLoadingSuivis(false));
  }, [openLeadId]);

  // Charge l'historique des devis du prospect ouvert (plusieurs liens peuvent coexister).
  useEffect(() => {
    setVisiteDraft(null); setVisiteOpen(false); setRdvDraft(null); setInstallDraft(null); setInstallOpen(false); setRdvConfirmSent(false); setRdvConfirmBusy(false); setQualifLink(null); setQualifBusy(false); setSmsCopied(false); setQualifEmailBusy(false); setQualifEmailSent(false); setNotesOpen(false); setShowAllHistory(false); setTab("qualif"); // reset l'édition quand on change de prospect
    if (!openLeadId) { setDevisHist([]); return; }
    fetch(`/api/admin/leads/${openLeadId}/devis`)
      .then(r => r.json())
      .then(d => setDevisHist(d.devis ?? []))
      .catch(() => {});
  }, [openLeadId]);


  const [listePage, setListePage] = useState(1);

  // « Charger plus » de la vue Liste : page globale suivante (fusionnée, dédoublonnée).
  async function loadMoreListe() {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/leads?page=${listePage + 1}&limit=50`);
      if (res.ok) {
        const d = await res.json();
        const more: Lead[] = d.leads ?? [];
        setLeads((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          return [...prev, ...more.filter((l) => !ids.has(l.id))];
        });
        setActivityMap((prev) => ({ ...prev, ...(d.lastActivity ?? {}) }));
        setListePage((p) => p + 1);
      }
    } finally { setSearching(false); }
  }

  // « Charger plus » d'une colonne : récupère les prospects suivants de ce statut.
  async function loadMore(status: LeadStatus) {
    setLoadingCol(status);
    try {
      const loaded = leads.filter((l) => l.status === status).length;
      const res = await fetch(`/api/admin/leads?status=${status}&offset=${loaded}&limit=${cap}`);
      if (res.ok) {
        const d = await res.json();
        const more: Lead[] = d.leads ?? [];
        setLeads((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          return [...prev, ...more.filter((l) => !ids.has(l.id))];
        });
        setActivityMap((prev) => ({ ...prev, ...(d.lastActivity ?? {}) }));
      }
    } finally { setLoadingCol(null); }
  }

  // Recherche serveur (débouncée) : on fusionne les prospects trouvés dans la liste
  // chargée → ils apparaissent dans le Kanban ET la Liste, même hors des pages cappées.
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) { firstSearch.current = false; return; }
    const q = search.trim();
    if (!q) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/leads?page=1&limit=100&q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const d = await res.json();
          const found: Lead[] = d.leads ?? [];
          setLeads((prev) => {
            const ids = new Set(prev.map((l) => l.id));
            return [...prev, ...found.filter((l) => !ids.has(l.id))];
          });
          setActivityMap((prev) => ({ ...prev, ...(d.lastActivity ?? {}) }));
        }
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, cap]);

  // Secteurs (départements) présents dans les leads chargés, pour le menu déroulant.
  const secteurs = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) { const d = deptOf(l.location); if (d) set.add(d); }
    return [...set].sort();
  }, [leads]);

  const filtered = leads.filter((l) => {
    if (favorisOnly && !l.favori) return false;
    if (statusFilter !== "tous") {
      if (statusFilter === "rdv_pris") { if (colOfLead(l) !== "rdv_pris") return false; }
      else if (l.status !== statusFilter) return false;
    }
    if (sourceFilter === "téléphone" && l.source !== "téléphone" && l.source !== "whatsapp") return false;
    if (sourceFilter !== "tous" && sourceFilter !== "téléphone" && l.source !== sourceFilter) return false;
    if (typeFilter !== "tous" && l.project !== typeFilter) return false;
    if (secteurFilter !== "tous" && deptOf(l.location) !== secteurFilter) return false;
    if (commercialFilter !== "tous") {
      const cid = (l as Lead & { commercialId?: string | null }).commercialId ?? null;
      if (commercialFilter === "none" ? cid !== null : cid !== commercialFilter) return false;
    }
    if (actionFilter !== "tous") {
      const a = leadAction(l);
      // « Prochaine étape » est un sous-statut de « Contact établi » : on l'ignore dès que le
      // prospect est passé au devis/gagné, sinon un devis déjà envoyé ressort en « Devis à faire »
      // (le sous-statut restait collé après l'envoi du devis).
      const pe = l.status === "contacté" ? (l as Lead & { prochaineEtape?: string | null }).prochaineEtape : null;
      const isRelance = (!!a && a.startsWith("Relance")) || pe === "a_recontacter";
      const isDevis = pe === "devis_a_faire";
      const ok =
        actionFilter === "a_traiter" ? (a !== null || pe === "a_recontacter" || pe === "devis_a_faire" || pe === "rdv_a_convenir") :
        actionFilter === "relance" ? isRelance :
        actionFilter === "devis" ? isDevis :
        actionFilter === "rdv_pris" ? pe === "rdv_pris" :
        actionFilter === "rdv" ? a === "Fixer le RDV" :
        actionFilter === "reflexion" ? pe === "en_reflexion" : true;
      if (!ok) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const lx = l as Lead & { address?: string | null; entreprise?: string | null };
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.location ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (lx.address ?? "").toLowerCase().includes(q) ||
        (lx.entreprise ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });
  const duplicatesMap = useMemo(() => detectDuplicates(leads), [leads]);

  // ─── API helpers ────────────────────────────────────────────────────────────

  // Applique la version serveur d'un prospect (synchronise version/clientId localement).
  function applyServerLead(sv: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === sv.id ? { ...l, ...sv } : l)));
    setSelectedLead((prev) => (prev && prev.id === sv.id ? ({ ...prev, ...sv } as Lead) : prev));
  }

  // Enregistre un champ du prospect OUVERT avec verrou de version + gestion du 409.
  // Renvoie true si OK. En cas de conflit/échec, resynchronise la fiche serveur.
  function flashSaved() {
    setSaveFlash("saved");
    if (saveFlashTimer.current) clearTimeout(saveFlashTimer.current);
    saveFlashTimer.current = setTimeout(() => setSaveFlash("idle"), 1800);
  }

  // Enregistre la liste des tâches du prospect (checklist du parcours client).
  async function saveTaches(next: LeadTache[]) {
    setSelectedLead((prev) => (prev ? ({ ...prev, taches: next } as Lead) : null));
    await patchLeadField({ taches: next });
  }

  // Poste un message interne, signé par l'admin connecté (apparaît dans le fil).
  async function sendMessage(leadId: string) {
    const contenu = msgDraft.trim();
    if (!contenu || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/suivis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", contenu }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (res.ok) {
        const { suivi } = await res.json();
        setSuivis((prev) => [suivi, ...prev]);
        setMsgDraft("");
      }
    } finally { setSendingMsg(false); }
  }

  // Annule un devis envoyé (en attente) : lien client désactivé + retour en « Contact établi »
  // si c'était le devis courant, pour pouvoir en renvoyer un nouveau proprement.
  async function annulerDevis(devisId: string) {
    const id = selectedLead?.id;
    if (!id) return;
    if (!confirm("Annuler ce devis ?\n\nLe lien envoyé au client sera désactivé, et le prospect repassera en « Contact établi » pour que tu puisses lui en renvoyer un nouveau.")) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}/devis/annuler`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ devisId }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert(d.error ?? "Échec de l'annulation."); return; }
      setDevisHist((prev) => prev.map((dv) => (dv.id === devisId ? { ...dv, decision: "annule" } : dv)));
      if (d.leadReset) setSelectedLead((prev) => prev ? ({ ...prev, status: "contacté" as LeadStatus, prochaineEtape: "devis_a_faire", devisDecision: null } as Lead) : null);
    } catch { alert("Erreur réseau, réessayez."); }
  }

  async function patchLeadField(fields: Record<string, unknown>): Promise<boolean> {
    const id = selectedLead?.id;
    if (!id) return false;
    setSaveFlash("saving");
    // Pas de "version" ici : ce sont des modifications inline d'un seul champ (dernier gagne).
    // Évite les faux conflits quand un champ date envoie plusieurs sauvegardes rapprochées
    // (jour, puis heure, puis minutes) plus vite que la version locale ne se met à jour.
    const res = await fetch("/api/admin/leads", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    if (res.status === 401) { window.location.href = "/admin"; return false; }
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      setSaveFlash("idle");
      if (data.lead) applyServerLead(data.lead);
      alert("⚠️ " + (data.error ?? "Ce prospect a été modifié par quelqu'un d'autre."));
      return false;
    }
    if (!res.ok) { setSaveFlash("idle"); alert("Échec de l'enregistrement. Réessayez."); return false; }
    if (data.lead) applyServerLead(data.lead);
    flashSaved();
    return true;
  }

  // Envoi MANUEL de l'e-mail de confirmation de RDV au client (bouton dans la fiche).
  async function sendRdvConfirmation() {
    const id = selectedLead?.id;
    if (!id || rdvConfirmBusy) return;
    setRdvConfirmBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}/rdv/confirmer`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setRdvConfirmSent(true);
      else alert(d.error ?? "L'e-mail n'a pas pu être envoyé.");
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setRdvConfirmBusy(false); }
  }

  // Génère le lien personnel de qualification Alex + le SMS prêt à envoyer (depuis le téléphone du gérant).
  async function genQualifLink() {
    const id = selectedLead?.id;
    if (!id || qualifBusy) return;
    setQualifBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}/qualif-link`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setQualifLink({ link: d.link, sms: d.sms, phone: d.phone ?? "" });
      else alert(d.error ?? "Échec de la génération du lien.");
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setQualifBusy(false); }
  }
  async function copySms() {
    if (!qualifLink) return;
    try { await navigator.clipboard.writeText(qualifLink.sms); setSmsCopied(true); setTimeout(() => setSmsCopied(false), 2000); } catch { /* presse-papiers indisponible */ }
  }
  // Envoi DIRECT du lien de qualification par e-mail au client (depuis la fiche, sans copier-coller).
  async function sendQualifEmail() {
    const id = selectedLead?.id;
    if (!id || qualifEmailBusy) return;
    setQualifEmailBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}/qualif-email`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setQualifEmailSent(true);
      else alert(d.error ?? "L'e-mail n'a pas pu être envoyé.");
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setQualifEmailBusy(false); }
  }

  // ⭐ Marquer / démarquer un prospect comme « intéressant » (optimiste + verrou version).
  async function toggleFavori(lead: Lead) {
    // On lit la version dans `leads` (source de vérité) juste avant l'envoi, pas de
    // fallback sur une snapshot potentiellement périmée (sinon 409 systématique).
    const current = leads.find((l) => l.id === lead.id);
    if (!current) return;
    const next = !current.favori;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, favori: next } : l)));
    setSelectedLead((prev) => (prev && prev.id === lead.id ? { ...prev, favori: next } : prev));
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, favori: next, version: current.version }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) { if (data.lead) applyServerLead(data.lead); else setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, favori: !next } : l))); return; }
      if (!res.ok) { setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, favori: !next } : l))); return; }
      if (data.lead) applyServerLead(data.lead);
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, favori: !next } : l)));
    }
  }

  async function updateStatus(id: string, status: string, extra?: { prochaineEtape?: string | null }) {
    const current = leads.find((l) => l.id === id);
    const previous = current?.status;
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, ...(extra ?? {}), version: current?.version }), // verrou optimiste
      });
      if (res.status === 401) {
        if (previous) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previous } : l)));
        window.location.href = "/admin";
        return;
      }
      if (res.status === 409) {
        // Conflit : un autre utilisateur a modifié ce prospect → on remet l'état serveur.
        const d = await res.json().catch(() => ({}));
        if (previous) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previous } : l)));
        if (d.lead) applyServerLead(d.lead);
        alert("⚠️ " + (d.error ?? "Ce prospect a été modifié par quelqu'un d'autre."));
        return;
      }
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const newClientId: string | null = data.lead?.clientId ?? null;
        // Synchronise version + statut + clientId depuis le serveur.
        if (data.lead) applyServerLead(data.lead);
        else setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as LeadStatus, ...(extra ?? {}) } as Lead : l)));
        // Compteurs de colonne : -1 à l'ancien statut, +1 au nouveau.
        if (previous && previous !== status) {
          setColCounts((c) => ({ ...c, [previous]: Math.max(0, (c[previous] ?? 0) - 1), [status]: (c[status] ?? 0) + 1 }));
        }
        if (newClientId) setConvertDone((prev) => new Set(prev).add(id));
        if (data.warning) alert("⚠️ " + data.warning);
      } else {
        if (previous) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previous } : l)));
      }
    } finally {
      setUpdating(null);
    }
  }

  // Actions de « premier contact » sur un prospect "nouveau" (file d'appels).
  // pas_de_reponse : reste en "nouveau", +1 tentative, renvoyé en bas de la file (trace).
  // pas_de_business / contact_etabli : changent le statut (perdu / contacté).
  async function premierContact(id: string, action: "pas_de_reponse" | "pas_de_business" | "contact_etabli") {
    const current = leads.find((l) => l.id === id);
    const previous = current?.status;
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/leads/${id}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert("⚠️ " + (data.error ?? "Échec de l'action.")); return; }
      if (data.lead) applyServerLead(data.lead);
      const newStatus: string | undefined = data.lead?.status;
      if (previous && newStatus && previous !== newStatus) {
        setColCounts((c) => ({ ...c, [previous]: Math.max(0, (c[previous] ?? 0) - 1), [newStatus]: (c[newStatus] ?? 0) + 1 }));
      }
      // « Pas de réponse » : le prospect repart en bas de la file "Nouveau".
      if (action === "pas_de_reponse") {
        setLeads((prev) => { const me = prev.find((l) => l.id === id); return me ? [...prev.filter((l) => l.id !== id), me] : prev; });
      }
    } finally {
      setUpdating(null);
    }
  }

  async function saveNotes(id: string) {
    setUpdating(id);
    setSaveFlash("saving");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: notesValue }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.lead) applyServerLead(data.lead); // garde la version locale à jour
        else setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: notesValue } : l)));
        setEditingNotes(null);
        flashSaved();
      } else { setSaveFlash("idle"); }
    } finally {
      setUpdating(null);
    }
  }

  async function convertToClient(lead: Lead) {
    if (lead.clientId || convertDone.has(lead.id)) return; // déjà converti
    setConvertingId(lead.id);
    try {
      // createClientFromLead côté serveur : copie TOUTES les données (adresse incluse),
      // lie le lead, marque "gagné". Idempotent → zéro doublon.
      const res = await fetch(`/api/admin/leads/${lead.id}/convert`, { method: "POST" });
      if (!res.ok) return;
      const { client } = await res.json();

      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, status: "gagné" as LeadStatus, clientId: client.id } : l
        )
      );
      // Met à jour le panneau ouvert → fait apparaître « Client créé » + « Créer l'intervention »
      setSelectedLead((prev) =>
        prev && prev.id === lead.id ? { ...prev, status: "gagné" as LeadStatus, clientId: client.id } : prev
      );
      setConvertDone((prev) => new Set(prev).add(lead.id));
    } finally {
      setConvertingId(null);
    }
  }

  async function handleMerge(masterId: string, duplicateId: string) {
    setMerging(true);
    try {
      const res = await fetch("/api/admin/leads/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId, duplicateId }),
      });
      if (res.ok) {
        const { lead } = await res.json();
        setLeads((prev) => prev
          .filter((l) => l.id !== duplicateId)
          .map((l) => (l.id === masterId ? lead : l))
        );
        setMergingPanel(null);
      }
    } finally {
      setMerging(false);
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      setAddError("Nom et téléphone sont requis.");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const { lead } = await res.json();
        setLeads((prev) => [lead, ...prev]);
        closeAddModal();
      } else {
        const data = await res.json();
        setAddError(data.error ?? "Erreur lors de la création.");
      }
    } finally {
      setAdding(false);
    }
  }

  // Ferme la modale d'ajout ET réinitialise le formulaire (évite la persistance des données d'un
  // prospect à l'autre : doublons accidentels, consentement/e-mail d'un autre client encore visibles).
  function closeAddModal() {
    setShowAddModal(false);
    setAddError("");
    setAddForm({ name: "", phone: "", source: "téléphone", project: "", location: "", address: "", email: "", notes: "", consentementMarketing: false, typeClient: "particulier", entreprise: "", siren: "" });
  }

  function startEditLead(lead: Lead) {
    const l = lead as Lead & { address?: string | null; typeClient?: string | null; entreprise?: string | null; siren?: string | null };
    setEditForm({
      name: lead.name ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      project: lead.project ?? "",
      location: lead.location ?? "",
      address: l.address ?? "",
      typeClient: l.typeClient ?? "particulier",
      entreprise: l.entreprise ?? "",
      siren: l.siren ?? "",
    });
    setEditingLead(true);
  }

  async function saveLeadEdit(id: string) {
    if (!editForm.name.trim() || !editForm.phone.trim()) return;
    const current = leads.find((l) => l.id === id);
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm, version: current?.version }), // verrou optimiste
      });
      if (res.status === 409) {
        const d = await res.json().catch(() => ({}));
        if (d.lead) applyServerLead(d.lead);
        alert("⚠️ " + (d.error ?? "Ce prospect a été modifié par quelqu'un d'autre."));
        setEditingLead(false);
        return;
      }
      if (res.ok) {
        const { lead: updated } = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
        setSelectedLead(updated);
        setEditingLead(false);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  // ─── Drag & drop ────────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, id: string) {
    dragId.current = id;
    // "Text" (capital T) is required for Safari, text/plain is not supported
    e.dataTransfer.setData("Text", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOverColumn(e: React.DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(key);
  }

  function onDragLeaveColumn(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(null);
    }
  }

  // Dépose une carte dans une colonne. « RDV pris » = statut contacté + sous-étape rdv_pris ;
  // sortir une carte de « RDV pris » vers « Contact établi » retire le sous-statut.
  async function onDropColumn(e: React.DragEvent, column: BoardColumn) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    // Try both Safari legacy format and ref fallback
    const id = e.dataTransfer.getData("Text") || e.dataTransfer.getData("text/plain") || dragId.current;
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || colOfLead(lead) === column.key) return;
    if (column.key === "rdv_pris") await updateStatus(id, "contacté", { prochaineEtape: "rdv_pris" });
    else if (column.key === "contacté") await updateStatus(id, "contacté", colOfLead(lead) === "rdv_pris" ? { prochaineEtape: null } : undefined);
    else await updateStatus(id, column.status);
  }

  // ─── Card component ──────────────────────────────────────────────────────────

  function LeadCard({ lead }: { lead: Lead }) {
    const dupes = duplicatesMap.get(lead.id) ?? [];
    const commercialId = (lead as Lead & { commercialId?: string | null }).commercialId;
    const c = commerciaux.find((x) => x.id === commercialId);
    const commercialName = c ? (c.prenom ? `${c.prenom} ${c.name}` : c.name) : null;
    const pe = (lead as Lead & { prochaineEtape?: string | null }).prochaineEtape;
    const peCfg = lead.status === "contacté" && pe ? PROCHAINE_ETAPE[pe] : null;
    const action = leadAction(lead);

    const SourceIcon = lead.source === "alex" ? Bot : lead.source === "whatsapp" ? MessageSquare : lead.source === "téléphone" ? Phone : FileText;
    const sourceLabel = lead.source === "alex" ? "Alex" : lead.source === "whatsapp" ? "WhatsApp" : lead.source === "téléphone" ? "Téléphone" : "Formulaire";
    const sourceColor = lead.source === "alex" ? "text-sky-400" : (lead.source === "whatsapp" || lead.source === "téléphone") ? "text-emerald-400" : "text-violet-400";

    const meta = [lead.project ? (PROJECT_LABELS[lead.project] ?? lead.project) : null, lead.location || null].filter(Boolean);
    const lastAct = activityMap[lead.id];
    const pal = (lead as Lead & { prochaineActionLe?: string | null }).prochaineActionLe;
    // « En sommeil » : prospect actif, sans alerte ni relance planifiée, sans activité depuis 7j+.
    const active = lead.status !== "gagné" && lead.status !== "perdu";
    const daysSince = Math.floor((Date.now() - new Date(lastAct ?? lead.createdAt).getTime()) / 86400000);
    const enSommeil = active && !action && !pal && daysSince >= 7;
    // Devis accepté en ligne par le client (signé) -> mise en avant dorée.
    const devisSigne = lead.devisDecision === "accepte";

    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, lead.id)}
        onClick={() => setSelectedLead(lead)}
        className={`bg-slate-800/40 border rounded-xl px-3 py-2.5 transition-colors cursor-pointer hover:bg-slate-800/70 select-none ${
          devisSigne
            ? "border-amber-400/60 ring-1 ring-amber-400/50 bg-amber-500/[0.04] hover:border-amber-400/80"
            : action ? "border-red-500/40 hover:border-red-500/60" : lead.status === "nouveau" ? "border-sky-500/20 hover:border-white/15" : "border-white/[0.06] hover:border-white/15"
        } ${lead.favori && !devisSigne ? "ring-1 ring-amber-400/40" : ""}`}
      >
        {/* Ligne 1 : étoile + nom (héros) + doublon + pastille commercial */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavori(lead); }}
            title={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
            aria-label={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
            className="flex-shrink-0 -ml-0.5"
          >
            <Star className={`w-4 h-4 transition-colors ${lead.favori ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-amber-400"}`} />
          </button>
          <p className="text-white font-semibold text-[13px] leading-tight line-clamp-2 break-words flex-1">{lead.name}</p>
          {dupes.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setMergingPanel({ leadId: lead.id, dupes }); }}
              title="Doublon potentiel"
              className="w-5 h-5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0 hover:bg-orange-500/20 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
            </button>
          )}
          <span
            title={commercialName ?? "Non affecté"}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 border ${
              c ? "bg-violet-500/15 text-violet-200 border-violet-500/30" : "border-dashed border-slate-600 text-slate-600"
            }`}
          >
            {commercialName ? initials(commercialName) : "?"}
          </span>
        </div>

        {/* Ligne 2 : type · lieu */}
        {meta.length > 0 && (
          <p className="text-slate-400 text-xs mt-1 truncate">{meta.join(" · ")}</p>
        )}

        {/* Devis signé en ligne par le client */}
        {devisSigne && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/40">
            <CheckCircle2 className="w-3 h-3" /> Devis signé
          </span>
        )}

        {/* Prospect injoignable : 4 appels sans réponse ou plus (reste dans la file) */}
        {lead.status === "nouveau" && (lead.tentativesAppel ?? 0) >= 4 && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-400/40">
            <AlertTriangle className="w-3 h-3" /> Injoignable ({lead.tentativesAppel})
          </span>
        )}

        {/* Repère qualification Alex : lien envoyé (violet) ou client déjà qualifié (vert) */}
        {(() => {
          const l = lead as Lead & { qualifToken?: string | null; qualifLe?: string | null };
          if (l.qualifLe) {
            const d = new Date(l.qualifLe);
            const jour = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
            const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", "h");
            return (
              <span className="inline-flex items-center gap-1 mt-1.5 ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40" title={`Le client a répondu à Alex et a été qualifié le ${jour} à ${heure}`}>
                <Bot className="w-3 h-3" /> Répondu {jour} · {heure}
              </span>
            );
          }
          if (l.qualifToken) return (
            <span className="inline-flex items-center gap-1 mt-1.5 ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-400/40" title="Lien de qualification Alex généré/envoyé, en attente de la réponse du client">
              <Bot className="w-3 h-3" /> Alex envoyé
            </span>
          );
          return null;
        })()}

        {/* Ligne 3 : dernière activité (ou source) · action rouge / relance planifiée / sous-statut */}
        <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
          {enSommeil ? (
            <span className="flex items-center gap-1 text-amber-300/80 text-[11px]" title={`En sommeil, ${daysSince}j sans activité`}>
              💤 {lastAct ? `il y a ${timeAgoShort(lastAct)}` : `${daysSince}j sans activité`}
            </span>
          ) : lastAct ? (
            <span className="flex items-center gap-1 text-slate-500 text-[11px]" title={`Dernière activité le ${new Date(lastAct).toLocaleString("fr-FR")}`}>
              <MessageSquare className="w-3 h-3 flex-shrink-0 text-slate-500" />
              il y a {timeAgoShort(lastAct)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 text-[11px]" title={`Source : ${sourceLabel}`}>
              <SourceIcon className={`w-3 h-3 flex-shrink-0 ${sourceColor}`} />
              {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          )}
          {action ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5 whitespace-nowrap" title={`Action à faire : ${action}`}>
              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" /> {action}
            </span>
          ) : pal ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-300/90 whitespace-nowrap" title="Relance planifiée">
              <Clock className="w-2.5 h-2.5 flex-shrink-0" /> relance {new Date(pal).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          ) : peCfg ? (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${peCfg.color}`}>
              {peCfg.emoji} {peCfg.short}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const totalCount = Object.values(colCounts).reduce((a, b) => a + b, 0);
  const newCount = colCounts["nouveau"] ?? 0;
  // Nb de prospects affichés dans la colonne virtuelle « RDV pris » (sous-ensemble de contacté chargé).
  const rdvLoadedCount = leads.filter((l) => colOfLead(l) === "rdv_pris").length;
  // Aucun filtre actif : on peut afficher « Charger plus » (pagination serveur par statut).
  const noColFilters = !search && !favorisOnly && sourceFilter === "tous" && typeFilter === "tous" && secteurFilter === "tous" && actionFilter === "tous" && commercialFilter === "tous";

  return (
    <div>
      {/* Stats, masquées sur mobile (superflu) ; sur mobile, voir les chips par étape ci-dessous */}
      <div className="hidden sm:grid sm:grid-cols-6 gap-2 mb-6">
        {[
          { label: "Total",         value: Object.values(colCounts).reduce((a, b) => a + b, 0),        dot: null },
          { label: "Nouveau",       value: colCounts["nouveau"] ?? 0,                                 dot: "bg-sky-400" },
          { label: "Contact",       value: colCounts["contacté"] ?? 0,                                dot: "bg-amber-400" },
          { label: "Devis",         value: colCounts["devis_envoyé"] ?? 0,                            dot: "bg-violet-400" },
          { label: "Gagné",         value: colCounts["gagné"] ?? 0,                                   dot: "bg-emerald-400" },
          { label: "Perdu",         value: colCounts["perdu"] ?? 0,                                   dot: "bg-slate-400" },
        ].map(({ label, value, dot }) => {
          // « Perdu » n'a plus de colonne : la carte devient un bouton qui ouvre la liste des perdus.
          if (label === "Perdu") {
            const perduActive = statusFilter === "perdu";
            return (
              <button
                key={label}
                type="button"
                onClick={() => { if (perduActive) { setStatusFilter("tous"); setView("kanban"); } else { setStatusFilter("perdu"); setView("liste"); } }}
                title={perduActive ? "Revenir au tableau" : "Voir les prospects perdus"}
                className={`rounded-xl text-center py-3 px-1 border transition-colors cursor-pointer ${perduActive ? "bg-slate-500/20 border-slate-400/50" : "bg-slate-800/40 border-white/8 hover:border-white/20 hover:bg-slate-800/70"}`}
              >
                <p className="text-lg font-bold text-white tabular-nums leading-none">{value}</p>
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  <p className="text-slate-400 text-[10px] truncate">{perduActive ? "Fermer" : "Perdu"}</p>
                </div>
              </button>
            );
          }
          return (
            <div key={label} className="bg-slate-800/40 border border-white/8 rounded-xl text-center py-3 px-1">
              <p className="text-lg font-bold text-white tabular-nums leading-none">{value}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
                <p className="text-slate-500 text-[10px] truncate">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Source filter (liste déroulante) */}
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500/50 ${sourceFilter !== "tous" ? "border-sky-500/40 bg-sky-500/10 text-sky-200" : "border-white/10 bg-slate-800/60 text-white"}`}>
          <option value="tous">Toutes sources</option>
          <option value="alex">Via Alex</option>
          <option value="formulaire">Formulaire</option>
          <option value="téléphone">Tél. / WhatsApp</option>
        </select>

        {/* ⭐ Filtre favoris */}
        <button
          onClick={() => setFavorisOnly((v) => !v)}
          title="N'afficher que les prospects marqués d'une étoile"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            favorisOnly
              ? "bg-amber-400 border-amber-400 text-slate-900"
              : "border-white/10 text-slate-400 hover:text-white hover:border-amber-400/40"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${favorisOnly ? "fill-slate-900" : ""}`} />
          Favoris
        </button>

        {/* Filtre type de prestation */}
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-white/10 bg-slate-800/60 text-xs text-white focus:outline-none focus:border-sky-500/50">
          <option value="tous">Tous types</option>
          {Object.entries(PROJECT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {/* Filtre action à faire (à recontacter, devis à faire, RDV à fixer, réflexion) */}
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500/50 ${actionFilter !== "tous" ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-white/10 bg-slate-800/60 text-white"}`}>
          <option value="tous">Toutes actions</option>
          <option value="a_traiter">À traiter (toute alerte)</option>
          <option value="relance">À recontacter / relance</option>
          <option value="devis">Devis à faire</option>
          <option value="rdv_pris">RDV pris</option>
          <option value="rdv">RDV à fixer (sans date)</option>
          <option value="reflexion">En réflexion</option>
        </select>

        {/* Filtre secteur (département présent dans les leads) */}
        {secteurs.length > 0 && (
          <select value={secteurFilter} onChange={(e) => setSecteurFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-slate-800/60 text-xs text-white focus:outline-none focus:border-sky-500/50">
            <option value="tous">Tous secteurs</option>
            {secteurs.map((d) => <option key={d} value={d}>{DEPT_LABELS[d] ?? `Dépt ${d}`}</option>)}
          </select>
        )}

        {/* Filtre commercial assigné */}
        {commerciaux.length > 0 && (
          <select value={commercialFilter} onChange={(e) => setCommercialFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-sky-500/50 ${commercialFilter !== "tous" ? "border-violet-500/40 bg-violet-500/10 text-violet-200" : "border-white/10 bg-slate-800/60 text-white"}`}>
            <option value="tous">Tous commerciaux</option>
            {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.prenom ? `${c.prenom} ${c.name}` : c.name}</option>)}
            <option value="none">Non affecté</option>
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${searching ? "text-sky-400 animate-pulse" : "text-slate-500"}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, ville…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-slate-800/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Import en masse de numéros à rappeler */}
        <button
          onClick={() => { setBulkOpen(true); setBulkResult(null); }}
          title="Coller une liste de numéros entrants à rappeler"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-white/10 hover:border-white/20 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Importer des numéros
        </button>

        {/* Add lead button */}
        <button
          onClick={() => { setShowAddModal(true); setAddError(""); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un lead
        </button>

        {/* Nouveau devis (client existant ou nouveau contact) */}
        <NouveauDevisModal triggerClassName="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold rounded-xl transition-colors" />

        {/* View toggle (desktop seulement, le mobile est toujours en liste verticale) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "kanban" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setView("liste")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "liste" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Liste
          </button>
        </div>
      </div>

      {/* Raccourcis par étape (mobile), remplacent le scroll horizontal du Kanban.
          « Tous » = aperçu global ; chaque étape = vue filtrée verticale. */}
      {leads.length > 0 && (
        <div className="sm:hidden -mx-4 px-4 mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("tous")}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${statusFilter === "tous" ? "bg-sky-500 border-sky-500 text-white" : "border-white/10 bg-slate-800/40 text-slate-300"}`}
          >
            Tous <span className="tabular-nums opacity-70">{totalCount}</span>
          </button>
          {BOARD_COLUMNS.map((c) => {
            const cnt = c.key === "rdv_pris" ? rdvLoadedCount
              : c.key === "contacté" ? Math.max(0, (colCounts["contacté"] ?? 0) - rdvLoadedCount)
              : (colCounts[c.status] ?? 0);
            return (
              <button
                key={c.key}
                onClick={() => setStatusFilter(c.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${statusFilter === c.key ? "bg-sky-500 border-sky-500 text-white" : "border-white/10 bg-slate-800/40 text-slate-300"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                {c.label} <span className="tabular-nums opacity-70">{cnt}</span>
              </button>
            );
          })}
          {/* Perdu : plus de colonne, mais accessible en filtre (liste). */}
          <button
            onClick={() => setStatusFilter("perdu")}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${statusFilter === "perdu" ? "bg-slate-500 border-slate-500 text-white" : "border-white/10 bg-slate-800/40 text-slate-300"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400" />
            Perdu <span className="tabular-nums opacity-70">{colCounts["perdu"] ?? 0}</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun lead pour l&apos;instant. Les prospects via Alex et le formulaire apparaîtront ici.</p>
        </div>
      )}

      {/* ── KANBAN VIEW ─────────────────────────────────────────────────────── */}
      {view === "kanban" && leads.length > 0 && (
        <div
          className="hidden sm:flex lg:grid lg:grid-cols-5 gap-2 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={focusedStatus ? { gridTemplateColumns: BOARD_COLUMNS.map((c) => (c.key === focusedStatus ? "minmax(0,3fr)" : "minmax(0,0.6fr)")).join(" ") } : undefined}
        >
          {BOARD_COLUMNS.map((column) => {
            const col = filtered.filter((l) => colOfLead(l) === column.key);
            const isOver = dragOver === column.key;
            const isCollapsed = !!focusedStatus && focusedStatus !== column.key; // une AUTRE colonne est agrandie
            const statusTotal = colCounts[column.status] ?? 0;
            // Compteur d'en-tête : RDV pris = sous-ensemble chargé ; Contact établi = total contacté moins RDV pris.
            const headerCount = favorisOnly ? col.length
              : column.key === "rdv_pris" ? rdvLoadedCount
              : column.key === "contacté" ? Math.max(0, statusTotal - rdvLoadedCount)
              : statusTotal;
            // Pagination serveur par statut (pas sur la colonne virtuelle RDV pris : ses cartes arrivent en chargeant « contacté »).
            const loadedStatusTotal = leads.filter((l) => l.status === column.status).length;
            const canLoadMore = noColFilters && column.key !== "rdv_pris" && loadedStatusTotal < statusTotal;
            return (
              <div
                key={column.key}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(column.key); }}
                onDragOver={(e) => onDragOverColumn(e, column.key)}
                onDragLeave={(e) => onDragLeaveColumn(e)}
                onDrop={(e) => onDropColumn(e, column)}
                className={`bg-slate-800/30 border-t-2 rounded-xl transition-all min-w-[80%] sm:min-w-[300px] lg:min-w-0 flex-shrink-0 lg:flex-shrink snap-start ${column.col} ${
                  isOver ? "ring-2 ring-sky-500/40 bg-slate-800/60" : "border-white/5"
                }`}
              >
                {/* Column header, cliquable : agrandit la colonne et rétrécit les autres */}
                <button
                  type="button"
                  onClick={() => setFocusedStatus((f) => (f === column.key ? null : column.key))}
                  title={focusedStatus === column.key ? "Réduire" : "Agrandir cette colonne"}
                  className={`w-full px-2.5 py-2 flex items-center justify-between border-b border-white/5 gap-1 cursor-pointer hover:bg-white/[0.04] transition-colors ${focusedStatus === column.key ? "bg-white/[0.05]" : ""}`}
                >
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border truncate min-w-0 ${column.color}`}>
                    {column.label}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-slate-500 text-xs font-medium">{headerCount}</span>
                    {focusedStatus === column.key
                      ? <Minimize2 className="w-3 h-3 text-sky-400" />
                      : <Maximize2 className="w-3 h-3 text-slate-600" />}
                  </span>
                </button>

                {/* Cards (masquées quand une AUTRE colonne est agrandie : évite les cartes écrasées illisibles) */}
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setFocusedStatus(column.key)}
                    title="Agrandir cette colonne"
                    className="w-full min-h-[120px] flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.02] transition-colors py-4"
                  >
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium tracking-wide whitespace-nowrap">{column.label} · {headerCount}</span>
                  </button>
                ) : (
                <div
                  className="p-1.5 space-y-1.5 min-h-32"
                  onDragEnter={(e) => { e.preventDefault(); setDragOver(column.key); }}
                  onDragOver={(e) => onDragOverColumn(e, column.key)}
                  onDrop={(e) => onDropColumn(e, column)}
                >
                  {col.length === 0 && (
                    <div
                      className={`h-24 rounded-lg border-2 border-dashed transition-all ${
                        isOver ? "border-sky-500/40" : "border-white/5"
                      }`}
                      onDragEnter={(e) => { e.preventDefault(); setDragOver(column.key); }}
                      onDragOver={(e) => onDragOverColumn(e, column.key)}
                      onDrop={(e) => onDropColumn(e, column)}
                    />
                  )}
                  {col.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {/* Charger plus (uniquement hors recherche/filtre, quand il reste des prospects) */}
                  {canLoadMore && (
                    <button
                      onClick={() => loadMore(column.status)}
                      disabled={loadingCol === column.status}
                      className="w-full text-[11px] text-slate-400 hover:text-white py-1.5 rounded-lg border border-dashed border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
                    >
                      {loadingCol === column.status ? "Chargement…" : `Charger plus (${Math.max(0, statusTotal - loadedStatusTotal)})`}
                    </button>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LISTE VIEW (toujours affichée sur mobile ; sur desktop si vue=liste) ── */}
      {leads.length > 0 && (
        <div className={view === "liste" ? "space-y-3" : "space-y-3 sm:hidden"}>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-12">
              Aucun prospect{statusFilter !== "tous" ? " à cette étape" : ""}{favorisOnly ? " en favori" : ""}.
            </p>
          )}
          {filtered.map((lead) => {
            const statusCfg = STATUS_CONFIG[lead.status];
            const listDupes = duplicatesMap.get(lead.id) ?? [];
            const devisSigne = lead.devisDecision === "accepte";
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`bg-slate-800/40 border rounded-2xl p-4 transition-all cursor-pointer hover:bg-slate-800/70 ${
                  devisSigne ? "border-amber-400/60 ring-1 ring-amber-400/50 bg-amber-500/[0.04]" : lead.status === "nouveau" ? "border-sky-500/20" : "border-white/8"
                } ${lead.favori && !devisSigne ? "ring-1 ring-amber-400/40" : ""}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavori(lead); }}
                      title={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
            aria-label={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
                      className="flex-shrink-0"
                    >
                      <Star className={`w-4 h-4 transition-colors ${lead.favori ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-amber-400"}`} />
                    </button>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        lead.source === "alex"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      }`}
                    >
                      {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                      {lead.source === "alex" ? "Alex" : "Formulaire"}
                    </span>

                    {listDupes.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMergingPanel({ leadId: lead.id, dupes: listDupes }); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-semibold hover:bg-orange-500/20 transition-colors"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Doublon possible
                      </button>
                    )}

                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      disabled={updating === lead.id}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-transparent cursor-pointer transition-opacity appearance-none ${statusCfg.color} ${
                        updating === lead.id ? "opacity-50 cursor-wait" : ""
                      }`}
                    >
                      {Object.entries(STATUS_CONFIG).filter(([val]) => val !== "pas_de_reponse").map(([val, cfg]) => (
                        <option key={val} value={val} className="bg-slate-800 text-white text-xs">
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Name + Phone */}
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{lead.name}</span>
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {lead.phone}
                  </a>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-2">
                  {lead.project && (
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      {PROJECT_LABELS[lead.project] ?? lead.project}
                    </span>
                  )}
                  {lead.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lead.location}
                    </span>
                  )}
                </div>

                {/* Notes */}
                {editingNotes === lead.id ? (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={2}
                      placeholder="Ajouter une note interne..."
                      className="w-full text-xs bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => saveNotes(lead.id)}
                        disabled={updating === lead.id}
                        className="px-3 py-1 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-lg text-xs font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="px-3 py-1 text-slate-500 hover:text-slate-400 text-xs transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-slate-500 text-xs bg-slate-700/20 hover:bg-slate-700/40 rounded-lg px-3 py-2 flex gap-2 mb-3 cursor-pointer transition-colors group"
                    onClick={(e) => { e.stopPropagation(); setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}
                  >
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 group-hover:text-slate-400" />
                    <span className="group-hover:text-slate-400 line-clamp-2">{lead.notes || "Ajouter une note..."}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Appeler
                  </a>
                  {lead.status === "nouveau" && (
                    <button
                      onClick={() => premierContact(lead.id, "pas_de_reponse")}
                      disabled={updating === lead.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Pas de réponse
                    </button>
                  )}
                  {lead.status === "nouveau" && (
                    <button
                      onClick={() => premierContact(lead.id, "contact_etabli")}
                      disabled={updating === lead.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Contact établi
                    </button>
                  )}
                  {lead.status === "gagné" && (
                    <button
                      onClick={() => { if (!lead.clientId && !convertDone.has(lead.id)) convertToClient(lead); }}
                      disabled={convertingId === lead.id || !!lead.clientId || convertDone.has(lead.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        lead.clientId || convertDone.has(lead.id)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {lead.clientId || convertDone.has(lead.id) ? (
                        <><CheckCircle2 className="w-3 h-3" /> Client créé</>
                      ) : (
                        <><UserPlus className="w-3 h-3" /> Convertir en client</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!search && !favorisOnly && statusFilter === "tous" && typeFilter === "tous" && secteurFilter === "tous" && leads.length < totalCount && (
            <button
              onClick={loadMoreListe}
              disabled={searching}
              className="w-full text-xs text-slate-400 hover:text-white py-2.5 rounded-xl border border-dashed border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
            >
              {searching ? "Chargement…" : `Charger plus (${totalCount - leads.length} restants)`}
            </button>
          )}
        </div>
      )}

      {totalCount > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {totalCount} lead{totalCount > 1 ? "s" : ""} · {newCount} nouveau{newCount > 1 ? "x" : ""}
        </p>
      )}

      {/* ── PANNEAU DÉTAIL LEAD ─────────────────────────────────────────────── */}
      {selectedLead && (() => {
        const lead = leads.find((l) => l.id === selectedLead.id) ?? selectedLead;
        const statusCfg = STATUS_CONFIG[lead.status];
        const isConverted = !!lead.clientId || convertDone.has(lead.id);
        const dupes = duplicatesMap.get(lead.id) ?? [];
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => { setSelectedLead(null); setEditingLead(false); }}>
            <div
              className="bg-slate-900 border-l border-white/10 w-full max-w-2xl lg:max-w-none lg:w-2/3 h-full overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-slate-900 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => toggleFavori(lead)}
                    title={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
            aria-label={lead.favori ? "Retirer des favoris" : "Marquer comme intéressant"}
                    className="flex-shrink-0"
                  >
                    <Star className={`w-5 h-5 transition-colors ${lead.favori ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-amber-400"}`} />
                  </button>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0 ${
                    lead.source === "alex" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  }`}>
                    {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                    {lead.source === "alex" ? "Alex" : "Formulaire"}
                  </span>
                  {lead.clientId ? (
                    <Link
                      href={`/admin/clients/${lead.clientId}`}
                      title="Voir la fiche client"
                      className="text-white font-semibold text-sm truncate hover:text-sky-300 hover:underline underline-offset-2 transition-colors"
                    >
                      {lead.name}
                    </Link>
                  ) : (
                    <h3 className="text-white font-semibold text-sm truncate">{lead.name}</h3>
                  )}
                  {(lead as Lead & { typeClient?: string }).typeClient === "professionnel" && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex-shrink-0">Pro</span>
                  )}
                  {(lead as Lead).consentementMarketing && (
                    <span title="Consentement démarchage donné" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex-shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" /> Démarchage OK
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  {/* Retour visuel d'enregistrement (les champs se sauvegardent automatiquement) */}
                  {saveFlash !== "idle" && (
                    <span className={`flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${saveFlash === "saved" ? "text-emerald-400" : "text-slate-400"}`}>
                      {saveFlash === "saving"
                        ? <><span className="w-3 h-3 border-2 border-slate-500/40 border-t-slate-300 rounded-full animate-spin" /> Enregistrement…</>
                        : <><Check className="w-3.5 h-3.5" /> Enregistré</>}
                    </span>
                  )}
                  {/* Commercial : visible et affectable directement depuis l'en-tête */}
                  {!editingLead && commerciaux.length > 0 && (() => {
                    const cId = (lead as Lead & { commercialId?: string | null }).commercialId ?? "";
                    const assigned = commerciaux.find((x) => x.id === cId);
                    return (
                      <div className="relative flex-shrink-0">
                        <Briefcase className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${assigned ? "text-violet-300" : "text-amber-300"}`} />
                        <select
                          value={cId}
                          onChange={async (e) => { await patchLeadField({ commercialId: e.target.value || null }); }}
                          title="Commercial assigné"
                          className={`appearance-none cursor-pointer rounded-full pl-7 pr-2.5 py-1 text-[11px] font-semibold border focus:outline-none max-w-[150px] ${assigned ? "bg-violet-500/15 text-violet-200 border-violet-500/30 hover:bg-violet-500/25" : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"}`}
                        >
                          <option value="">Affecter…</option>
                          {commerciaux.map((c) => (
                            <option key={c.id} value={c.id}>{c.prenom ? `${c.prenom} ${c.name}` : c.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  {!editingLead && (
                    <button
                      onClick={() => startEditLead(lead)}
                      title="Modifier les coordonnées"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setSelectedLead(null); setEditingLead(false); }} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {editingLead ? (
                  /* ── Mode édition des coordonnées ── */
                  <div className="bg-slate-800/40 border border-sky-500/20 rounded-2xl p-4 space-y-3">
                    <p className="text-sky-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Modifier les coordonnées
                    </p>
                    {/* Type de client : un professionnel a une entreprise + un SIREN en plus du contact */}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditForm(f => ({ ...f, typeClient: "particulier" }))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${editForm.typeClient !== "professionnel" ? "bg-sky-500/15 border-sky-500/40 text-sky-200" : "bg-slate-900/40 border-white/10 text-slate-400"}`}>
                        Particulier
                      </button>
                      <button type="button" onClick={() => setEditForm(f => ({ ...f, typeClient: "professionnel" }))}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${editForm.typeClient === "professionnel" ? "bg-amber-500/15 border-amber-500/40 text-amber-200" : "bg-slate-900/40 border-white/10 text-slate-400"}`}>
                        Professionnel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">{editForm.typeClient === "professionnel" ? "Contact *" : "Nom *"}</label>
                        <input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Téléphone *</label>
                        <input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                    </div>
                    {editForm.typeClient === "professionnel" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">Nom de l&apos;entreprise</label>
                          <input value={editForm.entreprise} onChange={(e) => setEditForm(f => ({ ...f, entreprise: e.target.value }))}
                            placeholder="Raison sociale"
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">N° SIREN</label>
                          <input value={editForm.siren} onChange={(e) => setEditForm(f => ({ ...f, siren: e.target.value }))}
                            placeholder="ex : 123 456 789"
                            className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Projet</label>
                        <select value={editForm.project} onChange={(e) => setEditForm(f => ({ ...f, project: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm appearance-none focus:outline-none focus:border-sky-500/50">
                          <option value="">- Aucun -</option>
                          {Object.entries(PROJECT_LABELS).map(([val, lbl]) => (
                            <option key={val} value={val} className="bg-slate-800">{lbl}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Ville / CP</label>
                        <input value={editForm.location} onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Adresse du chantier</label>
                      <AddressAutocomplete
                        value={editForm.address}
                        onChange={(v) => setEditForm(f => ({ ...f, address: v }))}
                        onSelect={(s) => setEditForm(f => ({ ...f, address: s.label, location: f.location || `${s.postcode} ${s.city}` }))}
                        placeholder="12 rue de la Paix, 75002 Paris"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingLead(false)}
                        className="flex-1 px-3 py-2 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                        Annuler
                      </button>
                      <button onClick={() => saveLeadEdit(lead.id)} disabled={savingEdit || !editForm.name.trim() || !editForm.phone.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors">
                        {savingEdit ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                <>
                {/* Gagné & converti : action principale mise en avant tout en haut */}
                {lead.status === "gagné" && isConverted && lead.clientId && (
                  <div className="bg-emerald-500/[0.08] border border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2 mb-2.5">
                      <CheckCircle2 className="w-4 h-4" /> Devis gagné, prochaine étape
                    </p>
                    <Link
                      href={`/admin/interventions/new?client=${lead.clientId}${lead.project ? `&type=${lead.project}` : ""}${
                        (lead as Lead & { dateSouhaiteeIntervention?: string | null }).dateSouhaiteeIntervention
                          ? `&date=${encodeURIComponent(toLocalDT((lead as Lead & { dateSouhaiteeIntervention?: string | null }).dateSouhaiteeIntervention))}`
                          : ""
                      }`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <CalendarPlus className="w-4 h-4" /> Créer l&apos;intervention
                    </Link>
                  </div>
                )}

                {/* ── Fiche client : l'essentiel, compact ── */}
                <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-3.5">
                  <p className="text-slate-500 text-[10px] font-medium mb-2.5 uppercase tracking-wide">Fiche client</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-5">
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 group min-w-0">
                      <Phone className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="text-white font-semibold text-sm group-hover:text-sky-300 transition-colors">{lead.phone}</span>
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-2 group min-w-0">
                        <Mail className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="text-slate-200 text-sm truncate group-hover:text-violet-300 transition-colors">{lead.email}</span>
                      </a>
                    )}
                  </div>

                  {(() => {
                    const l = lead as Lead & { typeClient?: string | null; entreprise?: string | null; siren?: string | null };
                    return l.typeClient === "professionnel" && (l.entreprise || l.siren) ? (
                      <p className="text-xs mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <Briefcase className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-slate-200 font-medium">{l.entreprise || "Entreprise"}</span>
                        {l.siren && <span className="text-slate-500">· SIREN {l.siren}</span>}
                      </p>
                    ) : null;
                  })()}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-xs">
                    {lead.project && (
                      <span className="flex items-center gap-1 text-slate-300"><Wrench className="w-3 h-3 text-slate-500" /> {PROJECT_LABELS[lead.project] ?? lead.project}</span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3 text-slate-500" /> Reçu le {formatDate(lead.createdAt)}</span>
                    {lead.location && !(lead as Lead & { address?: string | null }).address && (
                      <span className="flex items-center gap-1 text-slate-400"><MapPin className="w-3 h-3 text-slate-500" /> {lead.location}</span>
                    )}
                  </div>

                  {(lead as Lead & { address?: string | null }).address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent((lead as Lead & { address?: string | null }).address!)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2.5 text-sm text-emerald-300 hover:text-white transition-colors group">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{(lead as Lead & { address?: string | null }).address}</span>
                    </a>
                  )}
                </div>

                </>
                )}

                {/* ─── Qualification Alex : priorité, juste sous la fiche client et au-dessus du premier contact ─── */}
                <div className="mb-5">
                  <p className="text-violet-300 text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Qualification Alex
                  </p>
                  {!qualifLink ? (
                    <button onClick={genQualifLink} disabled={qualifBusy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-violet-500/40 text-violet-200 hover:bg-violet-500/10 disabled:opacity-50 text-sm font-semibold transition-colors">
                      <Bot className="w-4 h-4" /> {qualifBusy ? "Génération…" : "Faire qualifier par Alex"}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3 space-y-2.5">
                      <p className="text-slate-400 text-[11px]">Le client décrit son besoin, Alex le qualifie et remplit la fiche. Le SMS est le plus simple (gratuit, depuis ton téléphone).</p>
                      <textarea readOnly value={qualifLink.sms} rows={7} onFocus={(e) => e.currentTarget.select()} className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs resize-none [color-scheme:dark]" />
                      <div className="flex gap-2">
                        <button onClick={copySms} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors">
                          {smsCopied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier le SMS</>}
                        </button>
                        {qualifLink.phone && <a href={`sms:${qualifLink.phone}?&body=${encodeURIComponent(qualifLink.sms)}`} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium">Messages</a>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]"><span className="flex-1 h-px bg-white/10" />ou par e-mail<span className="flex-1 h-px bg-white/10" /></div>
                      {qualifEmailSent ? (
                        <p className="text-emerald-400 text-xs flex items-center gap-1.5"><Check className="w-3.5 h-3.5 flex-shrink-0" /> Lien envoyé par e-mail au client</p>
                      ) : lead.email ? (
                        <button onClick={sendQualifEmail} disabled={qualifEmailBusy} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 disabled:opacity-50 text-sm font-medium transition-colors">
                          <Mail className="w-4 h-4" /> {qualifEmailBusy ? "Envoi…" : "Envoyer le lien par e-mail"}
                        </button>
                      ) : (
                        <p className="text-slate-500 text-[11px]">Pas d&apos;e-mail sur la fiche pour l&apos;envoi direct.</p>
                      )}
                      <a href={qualifLink.link} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-[11px] block truncate">{qualifLink.link}</a>
                    </div>
                  )}
                </div>

                {/* ─── Suivi commercial sur 2 colonnes (panneau large) ─── */}
                {/* Premier contact : file d'appels (uniquement tant que le prospect est "nouveau") */}
                {lead.status === "nouveau" && (
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3 mb-5">
                    <p className="text-sky-400 text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Premier contact
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => premierContact(lead.id, "pas_de_reponse")} disabled={updating === lead.id}
                        className="flex items-center justify-center text-center py-2.5 px-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        Pas de réponse
                      </button>
                      <button onClick={() => premierContact(lead.id, "pas_de_business")} disabled={updating === lead.id}
                        className="flex items-center justify-center text-center py-2.5 px-1 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-300 hover:bg-slate-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        Pas de business
                      </button>
                      <button onClick={() => premierContact(lead.id, "contact_etabli")} disabled={updating === lead.id}
                        className="flex items-center justify-center text-center py-2.5 px-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        Contact établi
                      </button>
                    </div>
                    {(lead.tentativesAppel ?? 0) > 0 && (
                      <p className={`text-[11px] mt-2 flex items-center gap-1 ${(lead.tentativesAppel ?? 0) >= 4 ? "text-orange-400" : "text-slate-500"}`}>
                        {(lead.tentativesAppel ?? 0) >= 4 && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                        {lead.tentativesAppel} appel{(lead.tentativesAppel ?? 0) > 1 ? "s" : ""} sans réponse{(lead.tentativesAppel ?? 0) >= 4 ? " (injoignable)" : ""}.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">

                {/* Statut (élément principal) */}
                <div>
                  <p className="text-slate-500 text-[11px] font-medium mb-1 uppercase tracking-wide">Statut</p>
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as LeadStatus;
                      setSelectedLead({ ...lead, status: newStatus });
                      // Passer en « Gagné » crée automatiquement le client (comme une signature).
                      if (newStatus === "gagné" && !lead.clientId && !convertDone.has(lead.id)) {
                        convertToClient({ ...lead, status: newStatus });
                      } else {
                        updateStatus(lead.id, newStatus);
                      }
                    }}
                    disabled={updating === lead.id}
                    className={`text-sm font-bold px-3.5 py-2 rounded-xl border-2 bg-slate-800/60 cursor-pointer transition-opacity appearance-none w-full ${statusCfg.color} ${
                      updating === lead.id ? "opacity-50 cursor-wait" : ""
                    }`}
                  >
                    {Object.entries(STATUS_CONFIG).filter(([val]) => val !== "pas_de_reponse").map(([val, cfg]) => (
                      <option key={val} value={val} className="bg-slate-800 text-white text-xs">
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prochaine étape, quand le contact est établi, avant l'envoi du devis */}
                {lead.status === "contacté" && (
                  <div>
                    <p className="text-slate-500 text-[11px] font-medium mb-1 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Prochaine étape
                    </p>
                    <select
                      value={(lead as Lead & { prochaineEtape?: string | null }).prochaineEtape ?? ""}
                      onChange={async (e) => {
                        const prochaineEtape = e.target.value || null;
                        // « Aucune opportunité » → le serveur passe le prospect en "perdu".
                        const perdu = prochaineEtape === "aucune_opportunite";
                        setSelectedLead(prev => prev ? { ...prev, prochaineEtape, ...(perdu ? { status: "perdu" as LeadStatus } : {}) } as Lead : null);
                        await patchLeadField({ prochaineEtape });
                      }}
                      className="w-full text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-slate-200 appearance-none focus:outline-none focus:border-sky-500/50 cursor-pointer"
                    >
                      <option value="">- Non précisé</option>
                      {Object.entries(PROCHAINE_ETAPE).map(([val, cfg]) => (
                        <option key={val} value={val} className="bg-slate-800 text-white">
                          {cfg.emoji} {cfg.label}
                        </option>
                      ))}
                    </select>

                    {/* Date du RDV → calendrier (créneau 2h) */}
                    {(lead as Lead & { prochaineEtape?: string | null }).prochaineEtape === "rdv_pris" && (() => {
                      const savedRdv = (lead as Lead & { rdvDate?: string | null }).rdvDate;
                      const savedRdvLocal = toLocalDT(savedRdv);
                      const rdvVal = rdvDraft !== null ? rdvDraft : savedRdvLocal;
                      const rdvChanged = rdvDraft !== null && rdvDraft !== savedRdvLocal;
                      const saveRdv = async () => {
                        const iso = rdvVal ? new Date(rdvVal).toISOString() : null;
                        setSelectedLead(prev => prev ? { ...prev, rdvDate: iso } as Lead : null);
                        await patchLeadField({ rdvDate: iso });
                        setRdvDraft(null);
                      };
                      return (
                        <div className="mt-2.5">
                          <p className="text-slate-500 text-[11px] mb-1.5 flex items-center gap-1.5">
                            <CalendarPlus className="w-3 h-3" /> Date du rendez-vous (créneau 2h au calendrier)
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="datetime-local" step={1800}
                              value={rdvVal}
                              onChange={(e) => setRdvDraft(e.target.value)}
                              className="flex-1 min-w-0 text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white [color-scheme:dark] focus:outline-none focus:border-sky-500/50"
                            />
                            <button onClick={saveRdv} disabled={!rdvChanged}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-default text-white text-sm font-semibold transition-colors">
                              <Check className="w-4 h-4" /> Enregistrer
                            </button>
                          </div>
                          {savedRdv && rdvDraft === null && (
                            <>
                              <p className="text-emerald-400 text-[11px] mt-1.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Rendez-vous le {new Date(savedRdv).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ajouté au Planning
                              </p>
                              {lead.email ? (
                                rdvConfirmSent ? (
                                  <p className="text-emerald-400 text-[11px] mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Confirmation envoyée au client par e-mail</p>
                                ) : (
                                  <button onClick={sendRdvConfirmation} disabled={rdvConfirmBusy}
                                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-sky-500/40 text-sky-300 hover:bg-sky-500/10 disabled:opacity-50 text-sm font-semibold transition-colors">
                                    <Mail className="w-4 h-4" /> {rdvConfirmBusy ? "Envoi…" : "Envoyer la confirmation au client"}
                                  </button>
                                )
                              ) : (
                                <p className="text-slate-500 text-[11px] mt-2">Ajoute un e-mail au prospect pour pouvoir lui envoyer la confirmation.</p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Visite client : bouton → encadré (date + heure + Enregistrer). Chip si déjà posée. */}
                {lead.status !== "perdu" && (() => {
                  const saved = (lead as Lead & { visiteClientLe?: string | null }).visiteClientLe;
                  const savedVisite = toLocalDT(saved);
                  const visiteVal = visiteDraft !== null ? visiteDraft : savedVisite;
                  const saveVisite = async () => {
                    const iso = visiteVal ? new Date(visiteVal).toISOString() : null;
                    setSelectedLead(prev => prev ? { ...prev, visiteClientLe: iso } as Lead : null);
                    await patchLeadField({ visiteClientLe: iso });
                    setVisiteDraft(null); setVisiteOpen(false);
                  };
                  const removeVisite = async () => {
                    setSelectedLead(prev => prev ? { ...prev, visiteClientLe: null } as Lead : null);
                    await patchLeadField({ visiteClientLe: null });
                    setVisiteDraft(null); setVisiteOpen(false);
                  };
                  if (saved && !visiteOpen) return (
                    <div className="flex items-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2.5">
                      <CalendarPlus className="w-4 h-4 text-fuchsia-300 flex-shrink-0" />
                      <span className="flex-1 min-w-0 text-sm text-fuchsia-100">Visite client le {new Date(saved).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={() => { setVisiteDraft(savedVisite); setVisiteOpen(true); }} className="text-slate-300 hover:text-white text-xs font-medium flex-shrink-0">Modifier</button>
                      <button onClick={removeVisite} title="Supprimer la visite" className="text-slate-400 hover:text-red-400 flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                  );
                  if (visiteOpen) return (
                    <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/[0.06] p-3">
                      <p className="text-fuchsia-300 text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5"><CalendarPlus className="w-3 h-3" /> Visite client (créneau 1h)</p>
                      <input type="datetime-local" step={1800} value={visiteVal} onChange={(e) => setVisiteDraft(e.target.value)} autoFocus className="w-full text-sm bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-white [color-scheme:dark] focus:outline-none focus:border-fuchsia-500/50" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveVisite} disabled={!visiteVal} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors"><Check className="w-4 h-4" /> Enregistrer</button>
                        <button onClick={() => { setVisiteDraft(null); setVisiteOpen(false); }} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">Annuler</button>
                      </div>
                      <p className="text-slate-500 text-[10px] mt-1.5">S&apos;ajoute au Planning (en fuchsia).</p>
                    </div>
                  );
                  return (
                    <button onClick={() => { setVisiteDraft(savedVisite); setVisiteOpen(true); }} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10 text-sm font-semibold transition-colors">
                      <Plus className="w-4 h-4" /> Visite client
                    </button>
                  );
                })()}

                {/* ─── Note épinglée : infos clés mises en avant (appel, visite, accès…), juste au-dessus du devis ─── */}
                <div>
                  <p className="text-amber-300/80 text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Pin className="w-3 h-3" /> Note épinglée
                  </p>
                  <textarea
                    key={`noteep-${lead.id}`}
                    defaultValue={(lead as Lead & { noteEpinglee?: string | null }).noteEpinglee ?? ""}
                    onBlur={async (e) => {
                      const v = e.target.value.trim() || null;
                      if (v === ((lead as Lead & { noteEpinglee?: string | null }).noteEpinglee ?? null)) return;
                      setSelectedLead(prev => prev ? { ...prev, noteEpinglee: v } as Lead : null);
                      await patchLeadField({ noteEpinglee: v });
                    }}
                    rows={2}
                    placeholder="Infos clés à garder en tête : préférences, accès, dispo… (ex : rappeler après 17h, code portail 1234)"
                    className="w-full text-sm bg-amber-500/[0.07] border border-amber-500/30 rounded-xl px-3 py-2.5 text-amber-50 placeholder-amber-200/30 focus:outline-none focus:border-amber-500/60 resize-none"
                  />
                </div>

                {/* ─── Devis (cœur commercial) : montant + historique + envoi ─── */}
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-3.5">
                  <p className="text-violet-300 text-xs font-semibold mb-2.5 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Devis
                  </p>

                  {/* Montant TTC (à côté du devis) */}
                  <div className="mb-3">
                    <label className="text-slate-400 text-[11px] block mb-1">Montant (€ TTC)</label>
                    <input
                      key={`montant-${lead.id}`}
                      type="number" min="0" step="1"
                      defaultValue={lead.montantDevisCt ? lead.montantDevisCt / 100 : ""}
                      placeholder="ex : 3500"
                      onBlur={async (e) => {
                        const euros = parseFloat(e.target.value);
                        const ct = Number.isFinite(euros) && euros > 0 ? Math.round(euros * 100) : null;
                        if (ct === (lead.montantDevisCt ?? null)) return;
                        await patchLeadField({ montantDevisCt: ct });
                      }}
                      className={`w-full bg-slate-900/60 border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 ${!lead.montantDevisCt && (lead.status === "devis_envoyé" || lead.status === "gagné") ? "border-amber-500/40" : "border-white/10"}`}
                    />
                    {!lead.montantDevisCt && (lead.status === "devis_envoyé" || lead.status === "gagné") && (
                      <p className="text-amber-400 text-[11px] mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Montant à renseigner.</p>
                    )}
                  </div>
                  {/* Historique : une ligne par devis envoyé (chaque lien a sa propre décision) */}
                  {devisHist.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      {devisHist.map((dv, idx) => (
                        <div key={dv.id} className="rounded-lg bg-slate-900/40 border border-white/8 px-2.5 py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex-1 min-w-0">
                              <span className="text-slate-300">Devis {devisHist.length - idx}</span>
                              <span className="text-slate-500 text-xs ml-1.5">{new Date(dv.envoyeLe).toLocaleDateString("fr-FR")}{dv.montantCt ? ` · ${(dv.montantCt / 100).toLocaleString("fr-FR")} €` : ""}</span>
                            </span>
                            {dv.decision === "accepte" ? (
                              <span className="text-emerald-400 text-xs font-medium flex items-center gap-1 flex-shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Accepté</span>
                            ) : dv.decision === "refuse" ? (
                              <span className="text-red-400 text-xs font-medium flex items-center gap-1 flex-shrink-0"><X className="w-3.5 h-3.5" /> Décliné</span>
                            ) : dv.decision === "annule" ? (
                              <span className="text-slate-500 text-xs font-medium flex items-center gap-1 flex-shrink-0 line-through"><X className="w-3.5 h-3.5" /> Annulé</span>
                            ) : (
                              <>
                                <span className="text-violet-300 text-xs font-medium flex items-center gap-1 flex-shrink-0"><Clock className="w-3.5 h-3.5" /> En attente</span>
                                <button onClick={() => annulerDevis(dv.id)} title="Annuler ce devis" className="text-slate-500 hover:text-red-400 text-xs font-medium flex-shrink-0 transition-colors">Annuler</button>
                              </>
                            )}
                            {dv.url && <a href={dv.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs flex-shrink-0">PDF</a>}
                          </div>
                          {dv.decision === "accepte" && (dv.decisionLe || dv.accepteIp) && (
                            <p className="text-emerald-400/60 text-[10px] mt-1">Bon pour accord en ligne{dv.decisionLe ? ` le ${new Date(dv.decisionLe).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}{dv.accepteIp ? ` · IP ${dv.accepteIp}` : ""}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : lead.devisEnvoyeLe ? (
                    /* Repli : devis envoyé avant la mise en place de l'historique */
                    <div className="text-sm mb-3">
                      {lead.devisDecision === "accepte" ? (
                        <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Accepté{lead.devisDecisionLe ? ` le ${new Date(lead.devisDecisionLe).toLocaleDateString("fr-FR")}` : ""}</div>
                      ) : lead.devisDecision === "refuse" ? (
                        <div><div className="flex items-center gap-2 text-red-400"><X className="w-4 h-4 flex-shrink-0" /> Décliné{lead.devisDecisionLe ? ` le ${new Date(lead.devisDecisionLe).toLocaleDateString("fr-FR")}` : ""}</div>{lead.devisMotifRefus && <p className="text-slate-400 text-xs mt-1">Motif : {lead.devisMotifRefus}</p>}</div>
                      ) : (
                        <div className="flex items-center gap-2 text-violet-300"><Clock className="w-4 h-4 flex-shrink-0" /> Envoyé le {new Date(lead.devisEnvoyeLe).toLocaleDateString("fr-FR")}, en attente de réponse</div>
                      )}
                      {lead.devisUrl && <a href={lead.devisUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-medium mt-1 inline-block">Voir le PDF</a>}
                    </div>
                  ) : null}

                  {/* Outil de chiffrage terrain, pré-rempli avec les infos du prospect (ou reprise d'un brouillon) */}
                  {(lead as Lead & { chiffrageBrouillon?: unknown }).chiffrageBrouillon ? (
                    <Link href={`/admin/terrain/chiffrage?lead=${lead.id}`} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-sm font-semibold transition-colors">
                      <Calculator className="w-4 h-4" /> Reprendre le devis (brouillon)
                    </Link>
                  ) : (
                    <Link href={`/admin/terrain/chiffrage?lead=${lead.id}`} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 rounded-lg border border-sky-500/40 text-sky-300 hover:bg-sky-500/10 text-sm font-semibold transition-colors">
                      <Calculator className="w-4 h-4" /> Faire un chiffrage (outil terrain)
                    </Link>
                  )}

                  {/* Bouton toujours disponible : 1er devis OU devis supplémentaire (2e lien, etc.) */}
                  <button onClick={() => openDevis(lead)} disabled={!lead.email} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
                    <FileText className="w-4 h-4" /> {(devisHist.length > 0 || lead.devisEnvoyeLe) ? "Envoyer un autre devis" : "Envoyer un devis au client"}
                  </button>
                  {!lead.email && (
                    <p className="text-amber-400 text-[11px] mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Ajoute un e-mail à ce prospect pour pouvoir lui envoyer le devis.</p>
                  )}

                  {/* Pré-positionner l'intervention (créneau provisoire, non payé) une fois le devis envoyé */}
                  {(lead.status === "devis_envoyé" || lead.devisEnvoyeLe) && (() => {
                    const saved = (lead as Lead & { installPrevuLe?: string | null }).installPrevuLe;
                    const savedDuree = (lead as Lead & { installPrevuDureeMin?: number | null }).installPrevuDureeMin ?? 120;
                    const savedLocal = toLocalDT(saved);
                    const val = installDraft !== null ? installDraft : savedLocal;
                    const openEditor = () => { setInstallDraft(savedLocal); setInstallDuree(savedDuree); setInstallOpen(true); };
                    const saveInstall = async () => {
                      const iso = val ? new Date(snap30(val)).toISOString() : null; // créneaux sur l'heure / demi-heure
                      setSelectedLead(prev => prev ? { ...prev, installPrevuLe: iso, installPrevuDureeMin: installDuree } as Lead : null);
                      await patchLeadField({ installPrevuLe: iso, installPrevuDureeMin: installDuree });
                      setInstallDraft(null); setInstallOpen(false);
                    };
                    const removeInstall = async () => {
                      setSelectedLead(prev => prev ? { ...prev, installPrevuLe: null } as Lead : null);
                      await patchLeadField({ installPrevuLe: null });
                      setInstallDraft(null); setInstallOpen(false);
                    };
                    const dureeTxt = (m: number) => m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60}`;
                    if (saved && !installOpen) return (
                      <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 mt-2">
                        <CalendarPlus className="w-4 h-4 text-orange-300 flex-shrink-0" />
                        <span className="flex-1 min-w-0 text-sm text-orange-100">Intervention provisoire le {new Date(saved).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ({dureeTxt(savedDuree)}) · <span className="text-orange-300 font-semibold">non payé</span></span>
                        <button onClick={openEditor} className="text-slate-300 hover:text-white text-xs font-medium flex-shrink-0">Modifier</button>
                        <button onClick={removeInstall} title="Retirer le créneau" className="text-slate-400 hover:text-red-400 flex-shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                    );
                    if (installOpen) return (
                      <div className="rounded-xl border border-orange-500/30 bg-orange-500/[0.06] p-3 mt-2">
                        <p className="text-orange-300 text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1.5"><CalendarPlus className="w-3 h-3" /> Intervention provisoire (non payé)</p>
                        <div className="flex gap-2">
                          <input type="datetime-local" step={1800} value={val} onChange={(e) => setInstallDraft(e.target.value)} autoFocus className="flex-1 min-w-0 text-sm bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white [color-scheme:dark] focus:outline-none focus:border-orange-500/50" />
                          <select value={installDuree} onChange={(e) => setInstallDuree(parseInt(e.target.value))} className="flex-shrink-0 text-sm bg-slate-900/60 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-orange-500/50">
                            {[60, 90, 120, 180, 240, 480].map((m) => <option key={m} value={m} className="bg-slate-800">{m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)}h${m % 60}`}{m === 480 ? " (journée)" : ""}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={saveInstall} disabled={!val} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors"><Check className="w-4 h-4" /> Enregistrer</button>
                          <button onClick={() => { setInstallDraft(null); setInstallOpen(false); }} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">Annuler</button>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-1.5">Bloque le créneau au Planning (orange = non payé). Deviendra la vraie intervention quand le devis sera accepté.</p>
                      </div>
                    );
                    return (
                      <button onClick={openEditor} className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-xl border border-dashed border-orange-500/40 text-orange-300 hover:bg-orange-500/10 text-sm font-semibold transition-colors">
                        <CalendarPlus className="w-4 h-4" /> Pré-positionner l&apos;intervention (non payé)
                      </button>
                    );
                  })()}
                </div>

                </div>{/* ─── fin section suivi (une colonne) ─── */}

                {/* ── Note interne : mot rapide à l'équipe (le fil complet est dans l'onglet Historique) ── */}
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Note interne
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      value={msgDraft}
                      onChange={(e) => setMsgDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(lead.id); } }}
                      rows={2}
                      placeholder="Écrire un message à l'équipe… (Entrée pour envoyer)"
                      className="flex-1 min-w-0 text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
                    />
                    <button type="button" onClick={() => sendMessage(lead.id)} disabled={sendingMsg || !msgDraft.trim()}
                      className="flex-shrink-0 self-end flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                      <Send className="w-3.5 h-3.5" /> {sendingMsg ? "…" : "Envoyer"}
                    </button>
                  </div>
                </div>

                {/* ── Onglets : qualification · parcours · pièces · historique ── */}
                <div>
                  <div className="flex gap-1 p-0.5 bg-slate-800/60 border border-white/8 rounded-xl mb-3">
                    {([["qualif", "Qualif"], ["parcours", "Parcours"], ["pieces", "Pièces"], ["histo", "Historique"]] as const).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setTab(key)}
                        className={`flex-1 px-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${tab === key ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Qualification : guide des besoins + note / conversation Alex */}
                  {tab === "qualif" && (
                    <div className="space-y-4">
                      <LeadQualification
                        key={lead.id}
                        value={lead.qualification ?? null}
                        status={lead.status}
                        onSave={async (q) => { await patchLeadField({ qualification: q }); }}
                        notes={lead.notes}
                        onSaveNotes={async (text) => { setSelectedLead(prev => prev ? { ...prev, notes: text } as Lead : null); await patchLeadField({ notes: text }); }}
                        dateSouhaitee={toLocalDT((lead as Lead & { dateSouhaiteeIntervention?: string | null }).dateSouhaiteeIntervention)}
                        onSaveDateSouhaitee={async (localValue) => { const iso = localValue ? new Date(localValue).toISOString() : null; setSelectedLead(prev => prev ? { ...prev, dateSouhaiteeIntervention: iso } as Lead : null); await patchLeadField({ dateSouhaiteeIntervention: iso }); }}
                        consent={(lead as Lead).consentementMarketing}
                        onSaveConsent={async (v) => { setSelectedLead(prev => prev ? { ...prev, consentementMarketing: v } as Lead : null); await patchLeadField({ consentementMarketing: v }); }}
                      />
                      {/* Note interne & conversation Alex (repliée par défaut, peut être longue) */}
                      <div className="rounded-xl border border-white/10 bg-slate-900/30 overflow-hidden">
                        <button type="button" onClick={() => setNotesOpen((o) => !o)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                          <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                            Note interne{lead.source === "alex" ? " & conversation Alex" : ""}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${notesOpen ? "rotate-180" : ""}`} />
                        </button>
                        {!notesOpen && (
                          <p className="px-4 pb-3 -mt-1 text-xs text-slate-500 truncate">
                            {lead.notes ? lead.notes.split("\n").find((ln) => ln.trim()) : "Ajouter une note / des indications…"}
                          </p>
                        )}
                        {notesOpen && (
                          <div className="px-4 pb-4 border-t border-white/8 pt-3">
                            {editingNotes === lead.id ? (
                              <>
                                <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={6} placeholder="Indications sur ce client…" className="w-full text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none" autoFocus />
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => saveNotes(lead.id)} disabled={updating === lead.id} className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">Enregistrer</button>
                                  <button onClick={() => setEditingNotes(null)} className="px-4 py-1.5 text-slate-500 hover:text-slate-400 text-xs transition-colors">Annuler</button>
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-200 text-sm bg-amber-500/[0.06] hover:bg-amber-500/[0.1] border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2.5 cursor-pointer transition-colors"
                                onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}>
                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400/70" />
                                <span className="whitespace-pre-wrap">{lead.notes || <span className="text-slate-500">Ajouter une note / des indications…</span>}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parcours client : frise des jalons + tâches */}
                  {tab === "parcours" && (
                    <LeadParcours lead={lead} devisHist={devisHist} onSaveTaches={saveTaches} />
                  )}

                  {/* Pièces jointes : photos du formulaire + pièces internes */}
                  {tab === "pieces" && (
                    <div className="space-y-4">
                      {(lead.photosUrls?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
                            <Camera className="w-3 h-3" /> Photos du client ({lead.photosUrls!.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {lead.photosUrls!.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" title={`Photo ${i + 1}`}
                                className="block aspect-square rounded-lg overflow-hidden bg-slate-900/60 border border-white/10 hover:border-sky-500/50 transition-colors">
                                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <LeadAttachments key={lead.id} leadId={lead.id} initial={(lead as Lead & { piecesJointes?: string[] | null }).piecesJointes ?? []} />
                    </div>
                  )}

                  {/* Historique : fil des messages d'équipe + évènements automatiques */}
                  {tab === "histo" && (
                    <div className="space-y-2.5">
                      {loadingSuivis ? (
                        <p className="text-slate-600 text-xs">Chargement…</p>
                      ) : suivis.length === 0 ? (
                        <p className="text-slate-600 text-xs">Aucune activité pour l&apos;instant.</p>
                      ) : (() => {
                        const HISTO_COLLAPSED = 6;
                        const shown = showAllHistory ? suivis : suivis.slice(0, HISTO_COLLAPSED);
                        return (
                          <>
                            {shown.map((s) => {
                              const dateStr = new Date(s.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                              return s.auteur ? (
                                <div key={s.id} className="rounded-xl border border-white/8 bg-slate-800/40 px-3 py-2.5">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.auteur.charAt(0).toUpperCase()}</span>
                                    <span className="text-xs font-semibold text-sky-300">Message de {s.auteur.split(" ")[0]}</span>
                                    <span className="text-slate-600 text-[10px] ml-auto flex-shrink-0">{dateStr}</span>
                                  </div>
                                  <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{s.contenu}</p>
                                </div>
                              ) : (
                                <div key={s.id} className="flex gap-2.5 text-xs">
                                  <span className="flex-shrink-0 leading-none mt-0.5">{SUIVI_ICONS[s.type] ?? "📝"}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-400 whitespace-pre-wrap break-words">{s.contenu}</p>
                                    <p className="text-slate-600 text-[10px] mt-0.5">{dateStr}</p>
                                  </div>
                                </div>
                              );
                            })}
                            {suivis.length > HISTO_COLLAPSED && (
                              <button type="button" onClick={() => setShowAllHistory((v) => !v)}
                                className="w-full text-[11px] text-sky-400 hover:text-sky-300 py-1.5 rounded-lg border border-dashed border-white/10 hover:border-white/20 transition-colors">
                                {showAllHistory ? "Réduire" : `Voir tout (${suivis.length - HISTO_COLLAPSED} de plus)`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Doublon */}
                {dupes.length > 0 && (
                  <button
                    onClick={() => { setSelectedLead(null); setMergingPanel({ leadId: lead.id, dupes }); }}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {dupes.length} doublon{dupes.length > 1 ? "s" : ""} détecté{dupes.length > 1 ? "s" : ""}
                  </button>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                  {lead.status === "gagné" ? (
                    <button
                      onClick={() => { if (!isConverted) convertToClient(lead); }}
                      disabled={convertingId === lead.id || isConverted}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                        isConverted
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isConverted ? <><CheckCircle2 className="w-4 h-4" /> Client créé</> : convertingId === lead.id ? <><span className="w-4 h-4 border border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin" /> Conversion…</> : <><UserPlus className="w-4 h-4" /> Convertir</>}
                    </button>
                  ) : null}
                </div>

                {/* « Créer l'intervention » est désormais mis en avant en haut du panneau. */}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL FUSION DOUBLONS ────────────────────────────────────────────── */}
      {mergingPanel && (() => {
        const master = leads.find((l) => l.id === mergingPanel.leadId);
        if (!master) return null;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h3 className="text-white font-semibold text-sm">Doublons détectés</h3>
                </div>
                <button onClick={() => setMergingPanel(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-xs">
                  Ces leads partagent le même numéro ou email. Tu peux fusionner un doublon dans le lead principal, les données manquantes seront copiées, les notes combinées, et le doublon supprimé.
                </p>

                {/* Master */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Lead principal (conservé)</p>
                  <div className="bg-slate-800/60 border border-sky-500/20 rounded-xl p-3">
                    <p className="text-white font-semibold text-sm">{master.name}</p>
                    <p className="text-sky-400 text-xs">{master.phone}</p>
                    {master.email && <p className="text-slate-400 text-xs">{master.email}</p>}
                    <p className="text-slate-500 text-[10px] mt-1">
                      {new Date(master.createdAt).toLocaleDateString("fr-FR")} · {STATUS_CONFIG[master.status].label}
                    </p>
                  </div>
                </div>

                {/* Duplicates */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Doublons (seront supprimés après fusion)</p>
                  <div className="space-y-2">
                    {mergingPanel.dupes.map((dupe) => (
                      <div key={dupe.id} className="bg-slate-800/40 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{dupe.name}</p>
                          <p className="text-slate-400 text-xs">{dupe.phone}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {new Date(dupe.createdAt).toLocaleDateString("fr-FR")} · {STATUS_CONFIG[dupe.status].label}
                          </p>
                        </div>
                        <button
                          onClick={() => handleMerge(master.id, dupe.id)}
                          disabled={merging}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          {merging ? (
                            <span className="w-3 h-3 border border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
                          ) : (
                            <GitMerge className="w-3 h-3" />
                          )}
                          Fusionner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Modal ajout lead manuel ─────────────────────────────────────────── */}
      {devisOpen && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDevisOpen(false)} />
          <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-sky-400" /> Envoyer un devis</h2>
              <button onClick={() => setDevisOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-400 text-xs leading-relaxed">Glisse le PDF de ton devis (fait sur ton logiciel). Il part par e-mail à <span className="text-white">{selectedLead.email ?? "—"}</span> avec les boutons <span className="text-emerald-300">Accepter</span> / <span className="text-red-300">Décliner</span>.</p>

              <label
                onDragOver={(e) => { e.preventDefault(); setDevisDrag(true); }}
                onDragLeave={() => setDevisDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDevisDrag(false); const f = e.dataTransfer.files?.[0]; if (f && f.type === "application/pdf") { setDevisFile(f); setDevisError(""); } else setDevisError("Le fichier doit être un PDF."); }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${devisDrag ? "border-sky-500 bg-sky-500/10" : devisFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/15 hover:border-white/30 bg-slate-900/40"}`}
              >
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDevisFile(f); setDevisError(""); } }} />
                {devisFile ? (
                  <><CheckCircle2 className="w-7 h-7 text-emerald-400" /><span className="text-white text-sm font-medium text-center break-all px-2">{devisFile.name}</span><span className="text-slate-500 text-xs">Cliquer pour changer</span></>
                ) : (
                  <><FileText className="w-7 h-7 text-slate-500" /><span className="text-slate-300 text-sm">Glisser le PDF ici, ou cliquer</span><span className="text-slate-500 text-xs">PDF, 10 Mo max</span></>
                )}
              </label>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Montant TTC (€) — facultatif</label>
                <input type="number" min="0" value={devisMontant} onChange={(e) => setDevisMontant(e.target.value)} placeholder="ex : 3500" className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Mot d&apos;accompagnement — facultatif</label>
                <textarea value={devisMessage} onChange={(e) => setDevisMessage(e.target.value)} rows={2} placeholder="Bonjour, voici votre devis suite à notre échange…" className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none" />
              </div>

              {devisError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{devisError}</p>}

              <button onClick={sendDevis} disabled={devisSending || !devisFile} className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                {devisSending ? "Envoi en cours…" : "Envoyer le devis au client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setBulkOpen(false); setBulkResult(null); }} />
          <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2"><ClipboardPaste className="w-4 h-4 text-sky-400" /> Importer des numéros à rappeler</h2>
              <button onClick={() => { setBulkOpen(false); setBulkResult(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {bulkResult ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7 text-emerald-400" /></div>
                  <p className="text-white font-semibold">{bulkResult.created} prospect{bulkResult.created > 1 ? "s" : ""} ajouté{bulkResult.created > 1 ? "s" : ""}</p>
                  <p className="text-slate-400 text-sm mt-1">{bulkResult.skipped} déjà présent{bulkResult.skipped > 1 ? "s" : ""} ou ignoré{bulkResult.skipped > 1 ? "s" : ""}, sur {bulkResult.total} numéro{bulkResult.total > 1 ? "s" : ""} détecté{bulkResult.total > 1 ? "s" : ""}.</p>
                  <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-colors">Voir les prospects</button>
                </div>
              ) : (
                <>
                  <p className="text-slate-400 text-xs leading-relaxed">Colle ta liste de numéros (un par ligne, ou copiés depuis le journal d&apos;appels). Tous formats acceptés : <span className="text-slate-300">+33 6…</span>, <span className="text-slate-300">06…</span>. Les numéros déjà dans la base sont automatiquement ignorés. Ils arrivent en colonne <span className="text-slate-300">Nouveau</span> (source Téléphone), prêts à rappeler et qualifier.</p>
                  <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={9}
                    placeholder={"+33 6 84 02 55 48\n06 33 17 96 56\n07 68 17 63 55\n…"}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none font-mono" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{bulkDetected} numéro{bulkDetected > 1 ? "s" : ""} valide{bulkDetected > 1 ? "s" : ""} détecté{bulkDetected > 1 ? "s" : ""}</span>
                    <button onClick={importNumbers} disabled={bulkLoading || bulkDetected === 0}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors">
                      {bulkLoading ? "Import…" : `Importer ${bulkDetected || ""}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/12 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-white font-semibold text-sm">Ajouter un lead</h2>
                <p className="text-slate-500 text-xs mt-0.5">Contact téléphone ou WhatsApp</p>
              </div>
              <button onClick={closeAddModal} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddLead} className="px-6 py-5 space-y-4">
              {addError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-xs">{addError}</div>
              )}

              {/* Source */}
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Source *</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "téléphone", label: "Téléphone", icon: Phone },
                    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, source: value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        addForm.source === value
                          ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                          : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type de client */}
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Type de client</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "particulier", label: "Particulier" },
                    { value: "professionnel", label: "Professionnel" },
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setAddForm(f => ({ ...f, typeClient: value }))}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        addForm.typeClient === value
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                          : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Professionnel : raison sociale + SIREN (le « Nom » reste le contact) */}
              {addForm.typeClient === "professionnel" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs font-medium block mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={addForm.entreprise}
                      onChange={e => setAddForm(f => ({ ...f, entreprise: e.target.value }))}
                      placeholder="Raison sociale"
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium block mb-1">N° SIREN / SIRET</label>
                    <input
                      type="text"
                      value={addForm.siren}
                      onChange={e => setAddForm(f => ({ ...f, siren: e.target.value }))}
                      placeholder="123 456 789 00012"
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Nom + Téléphone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">{addForm.typeClient === "professionnel" ? "Contact *" : "Nom *"}</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Prénom Nom"
                    required
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="06 00 00 00 00"
                    required
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Type de projet */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Type de projet</label>
                <div className="flex flex-wrap gap-1.5">
                  {[["installation", "Installation"], ["entretien", "Entretien"], ["depannage", "Dépannage"], ["depose", "Dépose"], ["contrat-pro", "Contrat pro"], ["autre", "Autre"]].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, project: f.project === val ? "" : val }))}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        addForm.project === val
                          ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                          : "border-white/10 bg-slate-800/40 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ville + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Ville / CP</label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Paris 15 / 75015"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemple.fr"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1">Adresse du chantier</label>
                <AddressAutocomplete
                  value={addForm.address}
                  onChange={(v) => setAddForm(f => ({ ...f, address: v }))}
                  onSelect={(s) => setAddForm(f => ({ ...f, address: s.label, location: f.location || `${s.postcode} ${s.city}` }))}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1">Notes internes</label>
                <textarea
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Détails sur la demande, contexte du contact…"
                  rows={3}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 resize-none"
                />
              </div>

              {/* Consentement RGPD (démarchage) */}
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-800/40 border border-white/8 rounded-xl px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={addForm.consentementMarketing}
                  onChange={e => setAddForm(f => ({ ...f, consentementMarketing: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-transparent text-sky-500 focus:ring-sky-500/40 flex-shrink-0"
                />
                <span className="text-slate-400 text-xs leading-relaxed">
                  Le contact <span className="text-slate-300 font-medium">accepte d&apos;être démarché</span> (offres commerciales).
                  À cocher uniquement si la personne a donné son accord.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {adding ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {adding ? "Création…" : "Créer le lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
