import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — ClimExpert",
  description: "Conditions générales de vente de ClimExpert, expert en climatisation en Île-de-France.",
  robots: { index: false, follow: false },
};

export default function CGVPage() {
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Conditions Générales de Vente</h1>
          <p className="text-slate-400 text-sm mb-12">Dernière mise à jour : mai 2026</p>

          <div className="space-y-10 text-sm text-slate-600 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Objet</h2>
              <p>
                Les présentes conditions générales de vente (CGV) s&apos;appliquent à toutes les prestations de services conclues entre CLIM EXPERT SAS (ci-après « le Prestataire ») et ses clients (ci-après « le Client »), dans le domaine de l&apos;installation, de l&apos;entretien et du dépannage de systèmes de climatisation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Identification du prestataire</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2">
                <p><span className="font-semibold text-slate-800">CLIM EXPERT SAS</span></p>
                <p>200 rue de la Croix Nivert, 75015 Paris</p>
                <p>SIRET : 992 975 862 00010</p>
                <p>TVA : FR77992975862</p>
                <p>Email : contact@climexpert.fr — Tél. : 06 67 43 27 67</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Prestations proposées</h2>
              <p>CLIM EXPERT propose les prestations suivantes :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li>Installation de systèmes de climatisation (monosplit, multisplit, gainable, PAC air-air, PAC air-eau)</li>
                <li>Entretien et maintenance annuelle de systèmes de climatisation</li>
                <li>Dépannage et réparation de systèmes de climatisation toutes marques</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Devis et commande</h2>
              <p>
                Toute prestation fait l&apos;objet d&apos;un devis préalable gratuit et sans engagement. Le devis est établi après visite technique ou étude à distance selon la nature de la prestation.
              </p>
              <p className="mt-3">
                Le devis est valable 30 jours à compter de sa date d&apos;émission. La commande est réputée ferme et définitive à réception du devis signé par le Client, accompagné le cas échéant d&apos;un acompte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Tarifs</h2>
              <p>
                Les prix sont indiqués en euros toutes taxes comprises (TTC). CLIM EXPERT se réserve le droit de modifier ses tarifs à tout moment. Les prestations sont facturées sur la base du tarif en vigueur au moment de la commande.
              </p>
              <p className="mt-3">
                Pour les installations, un acompte de 30 % peut être demandé à la signature du devis. Le solde est exigible à la fin des travaux.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Modalités de paiement</h2>
              <p>Le règlement des prestations peut être effectué par :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li>Virement bancaire</li>
                <li>Chèque</li>
                <li>Espèces (dans la limite légale en vigueur)</li>
                <li>Carte bancaire</li>
              </ul>
              <p className="mt-3">
                Tout retard de paiement entraîne l&apos;application de pénalités de retard égales à trois fois le taux d&apos;intérêt légal en vigueur, ainsi qu&apos;une indemnité forfaitaire de recouvrement de 40 €.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Délais d&apos;intervention</h2>
              <p>
                Les délais d&apos;intervention sont donnés à titre indicatif et peuvent varier selon les disponibilités et la complexité du chantier. CLIM EXPERT s&apos;engage à respecter les délais convenus au moment de la commande.
              </p>
              <p className="mt-3">
                Pour les dépannages urgents, le délai d&apos;intervention est de 48h maximum en Île-de-France.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Garanties</h2>
              <p>Les prestations de CLIM EXPERT bénéficient des garanties suivantes :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li><span className="font-medium text-slate-700">Garantie légale de conformité</span> : conformément aux articles L.217-4 et suivants du Code de la consommation</li>
                <li><span className="font-medium text-slate-700">Garantie main-d&apos;œuvre installation</span> : 2 ans à compter de la date d&apos;installation</li>
                <li><span className="font-medium text-slate-700">Garantie main-d&apos;œuvre réparation</span> : 3 mois à compter de l&apos;intervention</li>
                <li><span className="font-medium text-slate-700">Garantie fabricant</span> : selon les conditions du fabricant de l&apos;équipement installé</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Responsabilité</h2>
              <p>
                CLIM EXPERT est couvert par une assurance responsabilité civile professionnelle. Sa responsabilité ne peut être engagée qu&apos;en cas de faute prouvée de sa part et est limitée au montant de la prestation facturée.
              </p>
              <p className="mt-3">
                Le Client s&apos;engage à fournir un accès sécurisé aux équipements à entretenir ou réparer et à informer le Prestataire de toute contrainte particulière.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Droit de rétractation</h2>
              <p>
                Conformément à l&apos;article L.221-18 du Code de la consommation, le Client particulier dispose d&apos;un délai de 14 jours pour exercer son droit de rétractation à compter de la signature du devis.
              </p>
              <p className="mt-3">
                Ce droit ne s&apos;applique pas si les travaux ont commencé avant l&apos;expiration du délai avec l&apos;accord exprès du Client.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Litiges</h2>
              <p>
                En cas de litige, le Client peut recourir à un médiateur de la consommation. Les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de Paris seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">12. Contact</h2>
              <p>
                Pour toute question relative aux présentes CGV :{" "}
                <a href="mailto:contact@climexpert.fr" className="text-sky-600 hover:underline">
                  contact@climexpert.fr
                </a>{" "}
                — 06 67 43 27 67
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
