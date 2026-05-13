import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mentions légales · Clim Expert",
  description: "Mentions légales du site climexpert.fr et de la société Clim Expert SAS.",
  robots: { index: false, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Mentions légales</h1>
          <p className="text-slate-400 text-sm mb-12">Dernière mise à jour : mai 2026</p>

          <div className="prose prose-slate max-w-none space-y-10">

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Éditeur du site</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2 text-sm text-slate-600">
                <p><strong>Clim Expert SAS</strong></p>
                <p>Société par actions simplifiée au capital de 1 000 €</p>
                <p>Siège social : 200 rue de la Croix Nivert, 75015 Paris</p>
                <p>Immatriculée au RCS de Paris sous le numéro 992 975 862</p>
                <p>SIRET : 992 975 862 00010</p>
                <p>Numéro de TVA intracommunautaire : FR77 992 975 862</p>
                <p>Code NAF / APE : 4322B (Travaux d&apos;installation d&apos;équipements thermiques et de climatisation)</p>
                <p>Directeur de la publication : Kamel Aissaoui</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2 text-sm text-slate-600">
                <p>
                  Téléphone :{" "}
                  <a href="tel:+33667432767" className="text-sky-600 hover:underline">06 67 43 27 67</a>
                </p>
                <p>
                  Email :{" "}
                  <a href="mailto:contact@climexpert.fr" className="text-sky-600 hover:underline">contact@climexpert.fr</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Hébergeur</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2 text-sm text-slate-600">
                <p>Vercel Inc.</p>
                <p>340 S Lemon Ave #4133</p>
                <p>Walnut, CA 91789, États-Unis</p>
                <p>
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                    vercel.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Propriété intellectuelle</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                L&apos;ensemble du contenu du site climexpert.fr (textes, images, logos, vidéos, code) est la propriété exclusive de Clim Expert SAS, sauf mention contraire. Toute reproduction, représentation, modification, publication ou adaptation, totale ou partielle, sans autorisation écrite préalable, est interdite et constitue une contrefaçon (articles L335-2 et suivants du Code de la propriété intellectuelle).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Données personnelles</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Le traitement des données personnelles collectées via ce site est décrit dans notre{" "}
                <a href="/politique-confidentialite" className="text-sky-600 hover:underline">politique de confidentialité</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Cookies</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Le site utilise des cookies techniques nécessaires à son fonctionnement et, le cas échéant, des cookies de mesure d&apos;audience. Le détail est précisé dans notre{" "}
                <a href="/politique-confidentialite" className="text-sky-600 hover:underline">politique de confidentialité</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Droit applicable et juridiction compétente</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Le présent site et ses conditions d&apos;utilisation sont régis par le droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux de Paris.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
