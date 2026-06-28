import {
  LayoutDashboard, Users, Contact, ScrollText, Wrench,
  HeadphonesIcon, HardHat, Briefcase, BarChart2, FileText, Megaphone, CalendarOff, ShieldCheck, Receipt, Calculator,
} from "lucide-react";

// Configuration de navigation admin partagée entre l'en-tête (desktop) et la
// barre d'onglets du bas (mobile). Source unique de vérité.
export const standalone = { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard };

export const groups = [
  {
    label: "CRM",
    items: [
      { href: "/admin/leads",        label: "Prospects",    icon: Users },
      { href: "/admin/suivi-devis",  label: "Devis",        icon: FileText },
      { href: "/admin/clients",      label: "Clients",      icon: Contact },
      { href: "/admin/contrats",     label: "Contrats",     icon: ScrollText },
      { href: "/admin/facturation",  label: "Facturation",  icon: Receipt },
    ],
  },
  {
    label: "Terrain",
    items: [
      { href: "/admin/terrain/chiffrage", label: "Chiffrage devis", icon: Calculator },
      { href: "/admin/interventions",     label: "Interventions",   icon: Wrench },
      { href: "/admin/sav",               label: "SAV",             icon: HeadphonesIcon },
    ],
  },
  {
    label: "Équipe",
    items: [
      { href: "/admin/salaries",         label: "Salariés & accès",   icon: Users },
      { href: "/admin/commerciaux",      label: "Commerciaux",        icon: Briefcase },
      { href: "/admin/techniciens",      label: "Techniciens",        icon: HardHat },
      { href: "/admin/indisponibilites", label: "Congés / Indispo",   icon: CalendarOff },
      { href: "/admin/securite",         label: "Sécurité (2FA)",     icon: ShieldCheck },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/marketing/statistiques", label: "Statistiques",     icon: BarChart2 },
      { href: "/admin/articles",               label: "Articles",         icon: FileText },
      { href: "/admin/marketing/contacts",     label: "Base de contacts", icon: Megaphone },
    ],
  },
];
