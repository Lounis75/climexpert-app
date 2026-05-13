import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ClimExpert",
  description: "Politique de confidentialité et protection des données personnelles de ClimExpert.",
  robots: { index: false, follow: false },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Header />
      <main className="bg-white min-h-screen pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Politique de confidentialité</h1>
          <p className="text-slate-400 text-sm mb-12">Dernière mise à jour : mai 2026</p>

          <div className="space-y-10 text-sm text-slate-600 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Responsable du traitement</h2>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-2">
                <p><span className="font-semibold text-slate-800">CLIM EXPERT SAS</span></p>
                <p>200 rue de la Croix Nivert, 75015 Paris</p>
                <p>Email : <a href="mailto:contact@climexpert.fr" className="text-sky-600 hover:underline">contact@climexpert.fr</a></p>
                <p>Téléphone : 06 67 43 27 67</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Données collectées</h2>
              <p>Dans le cadre de son activité, CLIM EXPERT est susceptible de collecter les données suivantes :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li>Données d&apos;identification : nom, prénom</li>
                <li>Coordonnées : adresse email, numéro de téléphone, adresse postale</li>
                <li>Données relatives à votre projet : type de bien, surface, type de prestation souhaitée</li>
                <li>Données de navigation : adresse IP, pages visitées, durée de visite (via des outils d&apos;analyse anonymisés)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Finalités du traitement</h2>
              <p>Vos données sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li>Répondre à vos demandes de devis et vous rappeler</li>
                <li>Assurer le suivi de votre dossier (installation, entretien, dépannage)</li>
                <li>Vous envoyer des informations commerciales si vous y avez consenti</li>
                <li>Améliorer nos services et notre site internet</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Base légale</h2>
              <p>Les traitements reposent sur les bases légales suivantes :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li><span className="font-medium text-slate-700">Exécution du contrat</span> : pour le traitement des demandes de devis et l&apos;exécution des prestations</li>
                <li><span className="font-medium text-slate-700">Consentement</span> : pour l&apos;envoi de communications commerciales</li>
                <li><span className="font-medium text-slate-700">Intérêt légitime</span> : pour l&apos;amélioration de nos services</li>
                <li><span className="font-medium text-slate-700">Obligation légale</span> : pour la conservation des documents comptables</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Durée de conservation</h2>
              <p>Vos données sont conservées pour la durée strictement nécessaire à leur finalité :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li>Données prospects : 3 ans à compter du dernier contact</li>
                <li>Données clients : 5 ans à compter de la fin du contrat (obligation légale)</li>
                <li>Documents comptables : 10 ans (obligation légale)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Destinataires des données</h2>
              <p>
                Vos données sont destinées exclusivement aux équipes de CLIM EXPERT. Elles ne sont ni vendues, ni louées, ni cédées à des tiers.
              </p>
              <p className="mt-3">
                Certains prestataires techniques (hébergement, outils de gestion) peuvent avoir accès à vos données dans le cadre de leur mission et sont soumis à des obligations de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Cookies</h2>
              <p>
                Le site climexpert.fr utilise des cookies techniques nécessaires à son bon fonctionnement. Ces cookies ne collectent aucune donnée personnelle identifiable et n&apos;ont pas vocation à suivre votre navigation à des fins publicitaires.
              </p>
              <p className="mt-3">
                Vous pouvez configurer votre navigateur pour refuser les cookies, sans que cela n&apos;affecte votre accès au site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Vos droits</h2>
              <p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside mt-3 space-y-1.5 ml-2">
                <li><span className="font-medium text-slate-700">Droit d&apos;accès</span> : obtenir une copie de vos données</li>
                <li><span className="font-medium text-slate-700">Droit de rectification</span> : corriger des données inexactes</li>
                <li><span className="font-medium text-slate-700">Droit à l&apos;effacement</span> : demander la suppression de vos données</li>
                <li><span className="font-medium text-slate-700">Droit à la limitation</span> : restreindre le traitement de vos données</li>
                <li><span className="font-medium text-slate-700">Droit à la portabilité</span> : recevoir vos données dans un format structuré</li>
                <li><span className="font-medium text-slate-700">Droit d&apos;opposition</span> : vous opposer au traitement de vos données</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à :{" "}
                <a href="mailto:contact@climexpert.fr" className="text-sky-600 hover:underline">
                  contact@climexpert.fr
                </a>
              </p>
              <p className="mt-3">
                En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Sécurité</h2>
              <p>
                CLIM EXPERT met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, toute divulgation, altération ou destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Modifications</h2>
              <p>
                La présente politique peut être modifiée à tout moment. La date de dernière mise à jour figure en haut de cette page. Nous vous encourageons à la consulter régulièrement.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
