"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertTriangle, ChevronLeft, Camera, PenLine } from "lucide-react";
import Link from "next/link";
import SignaturePad from "@/components/SignaturePad";

export default function RapportForm({
  interventionId,
  isVisiteTechnique,
  returnTo,
  clientHasEmail = false,
}: {
  interventionId: string;
  isVisiteTechnique: boolean;
  returnTo?: string; // où revenir après clôture (admin: fiche intervention admin)
  clientHasEmail?: boolean; // le client a-t-il un e-mail (pour proposer la signature à distance)
}) {
  const router = useRouter();
  const backHref = returnTo ?? `/technicien/interventions/${interventionId}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [conforme, setConforme]           = useState(true);
  // Entretien annuel (obligatoire) + signature contrat
  const [entretienPropose, setEntretienPropose] = useState<boolean | null>(null);
  const [entretienAccepte, setEntretienAccepte] = useState<boolean | null>(null);
  const [signature, setSignature]         = useState<string | null>(null);
  const [notes, setNotes]                 = useState("");
  const [dureeH, setDureeH]               = useState(""); // heures
  const [dureeM, setDureeM]               = useState(""); // minutes
  const [photos, setPhotos]               = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [dragOver, setDragOver]           = useState(false); // glisser-déposer (web)
  const [nbExt, setNbExt]                 = useState("1"); // nb d'unités extérieures
  const [nbInt, setNbInt]                 = useState("1"); // nb d'unités intérieures
  const [uploading, setUploading]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");
  // Visite technique
  const [dimensions, setDimensions]       = useState("");
  const [typeMur, setTypeMur]             = useState("");
  const [distanceGroupes, setDistanceGroupes] = useState("");
  const [contraintesElec, setContraintesElec] = useState("");
  const [equipReco, setEquipReco]         = useState("");
  const [difficulte, setDifficulte]       = useState("standard");
  // Attestation CERFA (fiche d'intervention fluides frigorigènes) : TOUJOURS obligatoire.
  const cerfaActif = true;
  const [cerfaSig, setCerfaSig]           = useState<string | null>(null);
  // Signature du CERFA : "tablette" (client présent) ou "envoi" (client absent -> lien e-mail).
  const [cerfaMode, setCerfaMode]         = useState<"tablette" | "envoi">("tablette");
  // Photos obligatoires : au moins 1 par unité (ext. + int.).
  const minPhotos = Math.max(1, (parseInt(nbExt || "0") || 0) + (parseInt(nbInt || "0") || 0));
  const [cEquipId, setCEquipId]           = useState("");
  const [cFluide, setCFluide]             = useState("");
  const [cCharge, setCCharge]             = useState("");
  const [cTonnage, setCTonnage]           = useState("");
  const [cNatMaint, setCNatMaint]         = useState(true);
  const [cNatCtrl, setCNatCtrl]           = useState(true);
  const [cDetecteur, setCDetecteur]       = useState("Détecteur électronique");
  const [cSysteme, setCSysteme]           = useState<"oui" | "non">("non");
  const [cFuites, setCFuites]             = useState<"oui" | "non">("non");
  // [7] quantité de fluide (plage) / [8-9] fréquence du contrôle périodique
  const [cQuantite, setCQuantite]         = useState("");
  const [cFreq, setCFreq]                 = useState("");
  // [10] jusqu'à 3 fuites (localisation + réparation)
  const [cFuitesList, setCFuitesList]     = useState<{ loca: string; rep: "realisee" | "a_faire" | "" }[]>([{ loca: "", rep: "" }]);
  // [11] manipulation du fluide frigorigène (kg) / [13] destination du fluide récupéré
  const [mn, setMn]                       = useState({ charge: "", vierge: "", recycle: "", regenere: "", denom: "", recup: "", traitement: "", reutil: "", bsff: "", contenants: "" });
  const [cDestination, setCDestination]   = useState("");
  // [12] dénomination ADR/RID (déchet)
  const [adr, setAdr]                     = useState({ un1078: false, un1078Autres: "", un3161: false, un3161Autres: "" });

  async function addPhotos(files: FileList | File[]) {
    const newPhotos = Array.from(files).slice(0, 12 - photos.length);
    for (const f of newPhotos) {
      const preview = URL.createObjectURL(f);
      setPhotos((prev) => [...prev, { file: f, preview }]);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const p of photos) {
      if (p.url) { urls.push(p.url); continue; }
      const form = new FormData();
      form.append("file", p.file);
      const res = await fetch("/api/technicien/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      // Échec d'upload (taille >5Mo, format HEIC, R2 KO, session expirée) : on
      // STOPPE au lieu de perdre la photo en silence, c'est une preuve d'intervention.
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Échec de l'envoi d'une photo. Vérifiez le format (JPG/PNG, <5 Mo) et réessayez.");
      }
      urls.push(data.url);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Photos obligatoires : au moins 1 par unité déclarée (extérieure(s) + intérieure(s)).
    if (photos.length < minPhotos) {
      setError(`Photos obligatoires : au moins ${minPhotos} (1 par unité : ${nbExt} ext. + ${nbInt} int.). ${photos.length} ajoutée(s).`);
      return;
    }
    // Validation obligatoire : entretien annuel proposé ?
    if (entretienPropose === null) {
      setError("Indiquez si vous avez proposé l'entretien annuel.");
      return;
    }
    if (entretienPropose && entretienAccepte && !signature) {
      setError("Le client doit signer le contrat d'entretien.");
      return;
    }
    if (cerfaMode === "tablette" && !cerfaSig) {
      setError("Le CERFA est obligatoire : faites signer le client, ou choisissez « Envoyer par e-mail pour signature ».");
      return;
    }
    setSubmitting(true);
    try {
      setUploading(true);
      const photosUrls = await uploadPhotos();

      // Upload de la signature (si contrat accepté)
      let signatureUrl: string | undefined;
      if (entretienPropose && entretienAccepte && signature) {
        const blob = await (await fetch(signature)).blob();
        const form = new FormData();
        form.append("file", new File([blob], "signature.png", { type: "image/png" }));
        const res = await fetch("/api/technicien/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        // Si la signature ne s'enregistre pas, on NE clôture PAS : le contrat signé
        // par le client serait perdu sans trace. On bloque pour que le technicien réessaie.
        if (!res.ok || !data.url) {
          throw new Error(data.error ?? "Échec de l'enregistrement de la signature. Réessayez.");
        }
        signatureUrl = data.url;
      }
      setUploading(false);

      const dureeMin = (parseInt(dureeH || "0") * 60) + parseInt(dureeM || "0");

      const body: Record<string, unknown> = {
        interventionId,
        installationConforme: conforme,
        notes,
        photosUrls,
        dureeReelleMinutes: dureeMin || null,
        entretienAnnuelPropose: entretienPropose,
        entretienAnnuelAccepte: entretienPropose ? !!entretienAccepte : false,
        signatureUrl,
        // Signature contrat en data URL → apposée sur le PDF du contrat signé.
        contratClientSignature: (entretienPropose && entretienAccepte && signature) ? signature : undefined,
        nbUnitesExt: Number(nbExt) || 1,
        nbUnitesInt: Number(nbInt) || 1,
        ...(isVisiteTechnique && {
          dimensionsPiece: dimensions,
          typeMur,
          distanceGroupes,
          contraintesElec,
          equipementRecommande: equipReco,
          difficulte,
        }),
        // Attestation CERFA (générée + envoyée au client + posée sur sa fiche à la clôture)
        ...(cerfaActif && {
          cerfaClientSignature: cerfaMode === "tablette" ? cerfaSig : undefined,
          cerfaEnvoiSignature: cerfaMode === "envoi",
          cerfa: {
            equipement: { identification: cEquipId, fluide: cFluide, chargeKg: cCharge, tonnageCO2: cTonnage },
            nature: { maintenance: cNatMaint, controleEtanchPeriodique: cNatCtrl },
            detecteurManuel: cDetecteur,
            systemePermanent: cSysteme,
            quantiteRange: cQuantite || undefined,
            frequence: cFreq || undefined,
            fuitesConstatees: cFuites,
            fuites: cFuites === "oui"
              ? cFuitesList.filter((f) => f.loca.trim() || f.rep).map((f) => ({ localisation: f.loca, reparation: f.rep || null }))
              : [],
            manip: { chargeeTotale: mn.charge, vierge: mn.vierge, recycle: mn.recycle, regenere: mn.regenere, denominationSiChangement: mn.denom, recupereeTotale: mn.recup, traitement: mn.traitement, reutilisation: mn.reutil, bsff: mn.bsff, contenants: mn.contenants },
            adr: { un1078: adr.un1078, un1078Autres: adr.un1078Autres, un3161: adr.un3161, un3161Autres: adr.un3161Autres },
            destination: cDestination,
            observations: notes,
          },
        }),
      };

      const res = await fetch("/api/technicien/rapports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");

      router.replace(backHref);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="p-2 bg-white border border-slate-200 rounded-xl">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="font-bold text-slate-900">Rapport de clôture</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Conformité */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Installation conforme ?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConforme(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                conforme ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Oui, conforme
            </button>
            <button
              type="button"
              onClick={() => setConforme(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                !conforme ? "bg-red-50 border-red-300 text-red-700" : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Non conforme
            </button>
          </div>
          {!conforme && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg">
              ⚠️ L'email de clôture NE sera PAS envoyé automatiquement. L'admin sera notifié.
            </p>
          )}
        </div>

        {/* Durée réelle */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-3">Durée réelle</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Heures</label>
              <input
                type="number" min="0" max="12" value={dureeH}
                onChange={(e) => setDureeH(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Minutes</label>
              <input
                type="number" min="0" max="59" value={dureeM}
                onChange={(e) => setDureeM(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <label className="text-sm font-semibold text-slate-900 block mb-3">Observations</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Décrivez les travaux effectués, remarques importantes…"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Champs visite technique */}
        {isVisiteTechnique && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-900">Informations visite technique</p>
            {[
              { label: "Dimensions de la pièce", value: dimensions, set: setDimensions, placeholder: "ex: 4m x 5m" },
              { label: "Type de mur", value: typeMur, set: setTypeMur, placeholder: "béton / placo / brique" },
              { label: "Distance groupe/unité intérieure", value: distanceGroupes, set: setDistanceGroupes, placeholder: "ex: 8m" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs text-slate-500 block mb-1">{label}</label>
                <input
                  type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Contraintes électriques</label>
              <textarea value={contraintesElec} onChange={(e) => setContraintesElec(e.target.value)}
                rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Équipement recommandé</label>
              <input type="text" value={equipReco} onChange={(e) => setEquipReco(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Difficulté estimée</label>
              <select value={difficulte} onChange={(e) => setDifficulte(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
                <option value="standard">Standard</option>
                <option value="complexe">Complexe</option>
                <option value="tres_complexe">Très complexe</option>
              </select>
            </div>
          </div>
        )}

        {/* Unités de l'installation (déterminent le nombre de photos obligatoires) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Unités de l&apos;installation</p>
          <p className="text-xs text-slate-500 mb-3">1 photo obligatoire par unité (ex. 1 extérieure + 2 intérieures = 3 photos).</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Unités extérieures</label>
              <input type="number" min="0" max="10" value={nbExt} onChange={(e) => setNbExt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Unités intérieures</label>
              <input type="number" min="0" max="20" value={nbInt} onChange={(e) => setNbInt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
        </div>

        {/* Photos, OBLIGATOIRES (1 par unité) */}
        <div
          className={`bg-white border rounded-2xl p-5 transition-colors ${dragOver ? "border-sky-400 ring-2 ring-sky-400/30" : "border-slate-100"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const imgs = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
            if (imgs.length) addPhotos(imgs);
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">
              Photos <span className={photos.length >= minPhotos ? "text-emerald-600" : "text-red-500"}>({photos.length}/{minPhotos} min)</span>
            </p>
            {photos.length < 12 && (
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => cameraRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold">
                  <Camera className="w-3.5 h-3.5" /> Photo
                </button>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Upload className="w-3.5 h-3.5" /> Galerie
                </button>
              </div>
            )}
          </div>
          {/* Caméra directe (iPad/iPhone) */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files && addPhotos(e.target.files)} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={(e) => e.target.files && addPhotos(e.target.files)} />
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-slate-400 text-sm text-center hover:border-slate-300 transition-colors"
            >
              <span className="sm:hidden">Appuyer pour ajouter des photos</span>
              <span className="hidden sm:inline">Glisser-déposer des photos ici, ou cliquer</span>
            </button>
          )}
        </div>

        {/* Entretien annuel, OBLIGATOIRE */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Entretien annuel proposé au client ? <span className="text-red-500">*</span></p>
          <p className="text-xs text-slate-500 mb-3">Obligatoire pour clôturer l&apos;intervention.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setEntretienPropose(true); }}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${entretienPropose === true ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>
              Oui, proposé
            </button>
            <button type="button" onClick={() => { setEntretienPropose(false); setEntretienAccepte(null); setSignature(null); }}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${entretienPropose === false ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500"}`}>
              Non
            </button>
          </div>

          {entretienPropose === true && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-semibold text-slate-900 mb-3">Le client accepte-t-il le contrat ?</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEntretienAccepte(true)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${entretienAccepte === true ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
                  Oui, il signe
                </button>
                <button type="button" onClick={() => { setEntretienAccepte(false); setSignature(null); }}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${entretienAccepte === false ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-slate-200 text-slate-500"}`}>
                  Pas maintenant
                </button>
              </div>

              {entretienAccepte === true && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <PenLine className="w-4 h-4 text-emerald-600" /> Signature du client
                  </p>
                  <p className="text-xs text-slate-500 mb-2">Contrat d&apos;entretien annuel, 200 € TTC/an. Faites signer le client ci-dessous.</p>
                  <SignaturePad onChange={setSignature} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attestation CERFA */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Attestation d&apos;entretien (CERFA)</p>
              <p className="text-xs text-slate-500 mt-0.5">Fiche officielle fluides frigorigènes, envoyée au client à la clôture.</p>
            </div>
            <span className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-semibold flex-shrink-0">Obligatoire</span>
          </div>

          {cerfaActif && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              <p className="text-[11px] text-slate-400">Opérateur (ClimExpert), client et date sont remplis automatiquement.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">Équipement (marque, modèle, n° série)</label>
                  <input value={cEquipId} onChange={(e) => setCEquipId(e.target.value)} placeholder="DAIKIN 3MXM68A2V1B9, N° série…" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div><label className="text-xs text-slate-500 block mb-1">Fluide (R-)</label><input value={cFluide} onChange={(e) => setCFluide(e.target.value)} placeholder="32" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Charge (kg)</label><input value={cCharge} onChange={(e) => setCCharge(e.target.value)} placeholder="9" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">Tonnage éq. CO2 (t)</label><input value={cTonnage} onChange={(e) => setCTonnage(e.target.value)} placeholder="1.35" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" /></div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Nature de l&apos;intervention</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setCNatMaint((v) => !v)} className={`px-3 py-2 rounded-xl border text-xs font-medium ${cNatMaint ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>Maintenance</button>
                  <button type="button" onClick={() => setCNatCtrl((v) => !v)} className={`px-3 py-2 rounded-xl border text-xs font-medium ${cNatCtrl ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>Contrôle d&apos;étanchéité périodique</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Détecteur manuel de fuite</label>
                <input value={cDetecteur} onChange={(e) => setCDetecteur(e.target.value)} placeholder="ex : Détecteur Value" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Système permanent de détection ?</p>
                  <div className="flex gap-2">
                    {(["oui", "non"] as const).map((o) => (
                      <button key={o} type="button" onClick={() => setCSysteme(o)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold uppercase ${cSysteme === o ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"}`}>{o}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Fuites constatées ?</p>
                  <div className="flex gap-2">
                    {(["oui", "non"] as const).map((o) => (
                      <button key={o} type="button" onClick={() => setCFuites(o)} className={`flex-1 py-2 rounded-lg border text-xs font-semibold uppercase ${cFuites === o ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"}`}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
              {/* [10] Détail des fuites (jusqu'à 3) */}
              {cFuites === "oui" && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Fuites constatées, localisation + réparation</p>
                  {cFuitesList.map((f, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-400 block mb-1">Localisation {i + 1}</label>
                        <input value={f.loca} onChange={(e) => setCFuitesList((p) => p.map((x, j) => j === i ? { ...x, loca: e.target.value } : x))} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {(["realisee", "a_faire"] as const).map((r) => (
                          <button key={r} type="button" onClick={() => setCFuitesList((p) => p.map((x, j) => j === i ? { ...x, rep: x.rep === r ? "" : r } : x))} className={`px-2.5 py-2 rounded-lg border text-[11px] font-medium ${f.rep === r ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>{r === "realisee" ? "Réparée" : "À faire"}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cFuitesList.length < 3 && (
                    <button type="button" onClick={() => setCFuitesList((p) => [...p, { loca: "", rep: "" }])} className="text-xs text-sky-600 font-medium">+ Ajouter une fuite</button>
                  )}
                </div>
              )}

              {/* [7] Quantité de fluide dans l'équipement */}
              <div>
                <p className="text-xs text-slate-500 mb-2">[7] Quantité de fluide dans l&apos;équipement</p>
                {[
                  { fam: "HCFC", opts: [["HCFC_2", "2–30 kg"], ["HCFC_30", "30–300 kg"], ["HCFC_300", "≥ 300 kg"]] },
                  { fam: "HFC/PFC", opts: [["HFC_5", "5–50 t"], ["HFC_50", "50–500 t"], ["HFC_500", "≥ 500 t"]] },
                  { fam: "HFO", opts: [["HFO_1", "1–10 kg"], ["HFO_10", "10–100 kg"], ["HFO_100", "≥ 100 kg"]] },
                ].map((row) => (
                  <div key={row.fam} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-500 w-14 flex-shrink-0">{row.fam}</span>
                    <div className="flex gap-1 flex-wrap">
                      {row.opts.map(([val, lbl]) => (
                        <button key={val} type="button" onClick={() => setCQuantite(cQuantite === val ? "" : val)} className={`px-2 py-1.5 rounded-lg border text-[11px] ${cQuantite === val ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* [8/9] Fréquence du contrôle périodique */}
              <div>
                <p className="text-xs text-slate-500 mb-2">[8/9] Fréquence du contrôle périodique</p>
                {[
                  { lbl: "Sans détection", opts: [["Sans_12m", "12 mois"], ["Sans_6m", "6 mois"], ["Sans_3m", "3 mois"]] },
                  { lbl: "Avec détection", opts: [["Avec_24m", "24 mois"], ["Avec_12m", "12 mois"], ["Avec_6m", "6 mois"]] },
                ].map((row) => (
                  <div key={row.lbl} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] text-slate-500 w-24 flex-shrink-0">{row.lbl}</span>
                    <div className="flex gap-1">
                      {row.opts.map(([val, lbl]) => (
                        <button key={val} type="button" onClick={() => setCFreq(cFreq === val ? "" : val)} className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${cFreq === val ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* [11] Manipulation du fluide frigorigène */}
              <div>
                <p className="text-xs text-slate-500 mb-2">[11] Manipulation du fluide (kg)</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["charge", "Quantité chargée totale (A+B+C)"],
                    ["recup", "Quantité récupérée totale (D+E)"],
                    ["vierge", "A — fluide vierge"],
                    ["traitement", "D — destiné au traitement"],
                    ["recycle", "B — recyclé"],
                    ["reutil", "E — conservé pour réutilisation"],
                    ["regenere", "C — régénéré"],
                    ["bsff", "N° BSFF (Trackdéchets)"],
                  ] as const).map(([k, lbl]) => (
                    <div key={k}>
                      <label className="text-[11px] text-slate-400 block mb-1">{lbl}</label>
                      <input value={mn[k]} onChange={(e) => setMn((p) => ({ ...p, [k]: e.target.value }))} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Dénomination du fluide chargé (si changement)</label>
                    <input value={mn.denom} onChange={(e) => setMn((p) => ({ ...p, denom: e.target.value }))} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Identification du ou des contenants</label>
                    <input value={mn.contenants} onChange={(e) => setMn((p) => ({ ...p, contenants: e.target.value }))} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* [12] Dénomination ADR/RID (déchet) */}
              <div>
                <p className="text-xs text-slate-500 mb-2">[12] Dénomination ADR/RID (déchet)</p>
                <label className="flex items-start gap-2 text-xs text-slate-600 mb-1.5">
                  <input type="checkbox" checked={adr.un1078} onChange={(e) => setAdr((p) => ({ ...p, un1078: e.target.checked }))} className="mt-0.5" />
                  <span>UN 1078, gaz frigorifique non-inflammable (2.2)</span>
                </label>
                <input value={adr.un1078Autres} onChange={(e) => setAdr((p) => ({ ...p, un1078Autres: e.target.value }))} placeholder="Autres fluides non-inflammables…" className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm mb-2" />
                <label className="flex items-start gap-2 text-xs text-slate-600 mb-1.5">
                  <input type="checkbox" checked={adr.un3161} onChange={(e) => setAdr((p) => ({ ...p, un3161: e.target.checked }))} className="mt-0.5" />
                  <span>UN 3161, gaz liquéfié inflammable (2.1)</span>
                </label>
                <input value={adr.un3161Autres} onChange={(e) => setAdr((p) => ({ ...p, un3161Autres: e.target.value }))} placeholder="Autres fluides inflammables…" className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>

              {/* [13] Installation de destination du fluide récupéré */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">[13] Installation de destination du fluide récupéré (Nom, SIRET, adresse)</label>
                <textarea value={cDestination} onChange={(e) => setCDestination(e.target.value)} rows={2} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5"><PenLine className="w-4 h-4 text-sky-600" /> Signature du client</p>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setCerfaMode("tablette")}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${cerfaMode === "tablette" ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"}`}>
                    Signer sur la tablette
                  </button>
                  <button type="button" onClick={() => { if (clientHasEmail) setCerfaMode("envoi"); }} disabled={!clientHasEmail}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${cerfaMode === "envoi" ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-slate-200 text-slate-500"} ${!clientHasEmail ? "opacity-50 cursor-not-allowed" : ""}`}>
                    Envoyer par e-mail
                  </button>
                </div>
                {cerfaMode === "tablette" ? (
                  <>
                    <p className="text-xs text-slate-500 mb-2">Faites signer le client au stylet : il atteste l&apos;entretien de son installation. (ClimExpert est déjà signataire.)</p>
                    <SignaturePad onChange={setCerfaSig} />
                  </>
                ) : (
                  <p className="text-xs text-slate-600 bg-sky-50 border border-sky-100 rounded-xl p-3 leading-relaxed">
                    Le client recevra un e-mail avec un lien pour lire et signer son attestation. L&apos;intervention est clôturée maintenant ; l&apos;attestation officielle signée lui sera envoyée dès qu&apos;il aura signé.
                    {!clientHasEmail && <span className="block mt-1 text-amber-600">Aucun e-mail client enregistré : renseignez-le pour utiliser cette option.</span>}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors text-base"
        >
          {uploading ? "Upload des photos…" : submitting ? "Envoi…" : "Terminer et envoyer"}
        </button>
      </form>
    </div>
  );
}
