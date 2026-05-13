import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080d18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <p className="font-bold mb-3 text-white">ClimExpert</p>
          <p className="text-sm text-slate-400 mb-4">
            Votre expert en climatisation en Île-de-France.
            Installation, entretien et dépannage par des techniciens confirmés.
          </p>
          <p className="text-sm">
            <a href="tel:+33667432767" className="text-slate-400 hover:text-white transition-colors">06 67 43 27 67</a>
          </p>
          <p className="text-sm">
            <a href="mailto:contact@climexpert.fr" className="text-slate-400 hover:text-white transition-colors">contact@climexpert.fr</a>
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3 text-xs uppercase tracking-wider text-slate-500">Services</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/installation" className="text-slate-400 hover:text-white transition-colors">Installation</Link></li>
            <li><Link href="/entretien" className="text-slate-400 hover:text-white transition-colors">Entretien et maintenance</Link></li>
            <li><Link href="/depannage" className="text-slate-400 hover:text-white transition-colors">Dépannage</Link></li>
            <li><Link href="/guide-climatisation" className="text-slate-400 hover:text-white transition-colors">Guide climatisation</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-3 text-xs uppercase tracking-wider text-slate-500">Entreprise</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/mentions-legales" className="text-slate-400 hover:text-white transition-colors">Mentions légales</Link></li>
            <li><Link href="/politique-confidentialite" className="text-slate-400 hover:text-white transition-colors">Politique de confidentialité</Link></li>
            <li><Link href="/cgv" className="text-slate-400 hover:text-white transition-colors">CGV</Link></li>
            <li><a href="/#avis" className="text-slate-400 hover:text-white transition-colors">Avis clients</a></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-3 text-xs uppercase tracking-wider text-slate-500">Société</p>
          <p className="text-sm text-slate-400">
            Clim Expert SAS<br />
            SIREN 992 975 862, RCS Paris<br />
            TVA FR77 992 975 862<br />
            200 rue de la Croix Nivert<br />
            75015 Paris
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-600 flex flex-col md:flex-row md:justify-between gap-2">
          <p>© {new Date().getFullYear()} Clim Expert SAS. Tous droits réservés.</p>
          <p>Île-de-France : 75, 77, 78, 91, 92, 93, 94, 95</p>
        </div>
      </div>
    </footer>
  );
}
