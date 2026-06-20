import {
  LayoutDashboard, Users, Contact, ScrollText, Wrench,
  HeadphonesIcon, HardHat, Briefcase, BarChart2, FileText, Megaphone,
} from "lucide-react";

// Configuration de navigation admin partagée entre l'en-tête (desktop) et la
// barre d'onglets du bas (mobile). Source unique de vérité.
export const standalone = { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard };

export const groups = [
  {
    label: "CRM",
    items: [
      { href: "/admin/leads",        label: "Prospects",    icon: Users },
      { href: "/admin/clients",      label: "Clients",      icon: Contact },
      { href: "/admin/contrats",     label: "Contrats",     icon: ScrollText },
    ],
  },
  {
    label: "Terrain",
    items: [
      { href: "/admin/interventions", label: "Interventions", icon: Wrench },
      { href: "/admin/sav",           label: "SAV",           icon: HeadphonesIcon },
    ],
  },
  {
    label: "Équipe",
    items: [
      { href: "/admin/salaries",    label: "Salariés & accès", icon: Users },
      { href: "/admin/commerciaux", label: "Commerciaux",      icon: Briefcase },
      { href: "/admin/techniciens", label: "Techniciens",      icon: HardHat },
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
