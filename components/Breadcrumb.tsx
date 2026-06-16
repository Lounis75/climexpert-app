import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  dark?: boolean;
}

export default function Breadcrumb({ items, dark = false }: BreadcrumbProps) {
  const base = dark
    ? "border-white/8 bg-[#0B1120]/60"
    : "border-slate-100 bg-white/80";
  const text = dark ? "text-slate-400" : "text-slate-500";
  const active = dark ? "text-white" : "text-slate-800";
  const hover = dark ? "hover:text-sky-400" : "hover:text-sky-600";

  return (
    <nav aria-label="Fil d'ariane" className={`border-b ${base} backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <ol className="flex items-center gap-1.5 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" className={`flex items-center gap-1 text-xs ${text} ${hover} transition-colors`} itemProp="item">
              <Home className="w-3 h-3" />
              <span itemProp="name">Accueil</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center gap-1.5" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <ChevronRight className={`w-3 h-3 ${text} flex-shrink-0`} />
              {item.href ? (
                <Link href={item.href} className={`text-xs ${text} ${hover} transition-colors`} itemProp="item">
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span className={`text-xs font-medium ${active}`} itemProp="name">{item.label}</span>
              )}
              <meta itemProp="position" content={String(i + 2)} />
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
