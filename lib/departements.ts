import { VILLES, Ville } from "@/lib/villes";

export interface Departement {
  slug: string;
  code: string;
  name: string;
  population: string;
  communes: number;
  context: string;
  highlights: string[];
  faqItems: { q: string; a: string }[];
}

export const DEPARTEMENTS: Departement[] = [
  {
    slug: "paris-75",
    code: "75",
    name: "Paris",
    population: "2,1 millions d'habitants",
    communes: 1,
    context:
      "Paris est le département le plus dense de France, composé quasi exclusivement d'appartements en copropriété. Les étés parisiens, amplifiés par l'îlot de chaleur urbain, rendent la climatisation réversible indispensable. Les immeubles haussmanniens, les résidences modernes et les lofts des anciens ateliers constituent l'essentiel de notre clientèle parisienne. Nos techniciens maîtrisent les contraintes spécifiques des copropriétés : passages de liaisons en gaines, installation discrète en façade arrière ou sur cours, et démarches ABF pour les secteurs protégés.",
    highlights: [
      "Spécialistes copropriétés parisiennes",
      "Connaissance des zones ABF et secteurs sauvegardés",
      "Installation discrète en façade arrière ou cour",
      "Devis sans déplacement sur photos",
    ],
    faqItems: [
      {
        q: "Faut-il l'accord de la copropriété pour installer une climatisation à Paris ?",
        a: "Oui, dans la grande majorité des cas. Si l'unité extérieure est posée en façade visible depuis la voie publique ou sur une partie commune, l'accord de l'assemblée générale est requis. Pour les unités placées sur un balcon privatif, une déclaration préalable de travaux à la mairie du 1er au 20e arrondissement est souvent nécessaire. Nos techniciens vous accompagnent dans ces démarches.",
      },
      {
        q: "Quelles sont les zones protégées à Paris qui compliquent l'installation ?",
        a: "Paris comporte de nombreux secteurs soumis aux règles de l'Architecte des Bâtiments de France (ABF), notamment autour des monuments historiques. Dans ces zones, toute installation visible depuis l'espace public nécessite une autorisation spéciale. En pratique, les unités posées en cour intérieure ou sur les toitures non visibles passent sans problème. Nous effectuons un diagnostic préalable à votre adresse.",
      },
      {
        q: "Quel est le délai d'intervention à Paris ?",
        a: "Nous intervenons à Paris sous 48h après acceptation du devis. Le devis gratuit est envoyé sous 24h, souvent sans déplacement préalable sur photos. En cas d'urgence de dépannage, nous faisons notre maximum pour intervenir le jour même ou le lendemain.",
      },
    ],
  },
  {
    slug: "hauts-de-seine-92",
    code: "92",
    name: "Hauts-de-Seine",
    population: "1,6 million d'habitants",
    communes: 36,
    context:
      "Le département des Hauts-de-Seine concentre certaines des communes les plus riches et les plus denses d'Île-de-France. De Boulogne-Billancourt à Neuilly-sur-Seine, en passant par La Défense (Nanterre, Courbevoie, Puteaux), le 92 mêle immeubles haussmanniens, résidences de standing et tours de bureaux. La chaleur estivale est particulièrement ressentie dans les appartements orientés sud et ouest. Nos techniciens interviennent régulièrement dans toutes les communes du 92, pour des installations résidentielles comme professionnelles.",
    highlights: [
      "Couverture complète des 36 communes du 92",
      "Expertise installations dans les tours de bureaux",
      "Spécialistes résidences de standing et hôtels particuliers",
      "Techniciens RGE certifiés, devis sous 24h",
    ],
    faqItems: [
      {
        q: "Y a-t-il des aides spécifiques aux Hauts-de-Seine pour la climatisation ?",
        a: "Les aides nationales s'appliquent pleinement dans le 92 : TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau) pour les logements de plus de 2 ans, certificats d'économies d'énergie (CEE) pour les PAC air-eau éligibles, et MaPrimeRénov' selon vos revenus. Le Département des Hauts-de-Seine peut proposer des aides complémentaires pour la rénovation énergétique. Nos techniciens RGE vérifient votre éligibilité.",
      },
      {
        q: "Intervenez-vous à La Défense pour des locaux professionnels ?",
        a: "Oui, La Défense est l'une de nos zones d'intervention principales pour les bureaux et espaces professionnels. Nous installons des systèmes VRV/VRF pour les open spaces, des cassettes de plafond pour les salles de réunion et des splits pour les bureaux individuels. Intervention possible en dehors des heures ouvrées pour minimiser l'impact sur l'activité.",
      },
      {
        q: "Quelle solution pour un appartement haussmannien dans les Hauts-de-Seine ?",
        a: "Pour les appartements haussmanniens du 92, nous recommandons soit un monosplit avec unité extérieure posée en cour ou sur un balcon privatif, soit un gainable si le logement dispose de faux-plafonds. Dans les immeubles classés ou proches de monuments historiques, nous réalisons un diagnostic ABF préalable. Finition soignée avec moulures et habillages sur mesure.",
      },
    ],
  },
  {
    slug: "seine-saint-denis-93",
    code: "93",
    name: "Seine-Saint-Denis",
    population: "1,7 million d'habitants",
    communes: 40,
    context:
      "La Seine-Saint-Denis est le département le plus jeune et l'un des plus dynamiques d'Île-de-France. Porté par le Grand Paris Express et l'héritage des Jeux Olympiques 2024, le 93 connaît une transformation immobilière profonde avec de nombreux programmes neufs à Saint-Denis, Saint-Ouen et Montreuil. Le parc ancien des années 60-80, souvent énergivore, bénéficie particulièrement de la climatisation réversible. Nos techniciens interviennent sur toutes les typologies de logements et locaux professionnels du département.",
    highlights: [
      "Couverture complète des 40 communes du 93",
      "Solutions adaptées aux budgets variés",
      "Expertise logements anciens énergivores",
      "Aides CEE et TVA réduite pour logements +2 ans",
    ],
    faqItems: [
      {
        q: "Comment réduire le coût d'une installation climatisation en Seine-Saint-Denis ?",
        a: "Plusieurs leviers permettent de réduire la facture dans le 93 : la TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau) s'applique sur la pose pour les logements de plus de 2 ans (jusqu'à 14,5 points d'économie pour une PAC air-eau), les CEE peuvent apporter jusqu'à 800 € pour certaines installations, et MaPrimeRénov' est accessible sous conditions de revenus. En cumulant ces aides, un monosplit installé à 1 500 € TTC peut revenir à moins de 900 € net.",
      },
      {
        q: "Proposez-vous des interventions dans les logements sociaux en Seine-Saint-Denis ?",
        a: "Nous intervenons dans les logements privés du 93. Pour les logements HLM ou sociaux, l'accord préalable du bailleur social est obligatoire. Nous pouvons vous aider à constituer ce dossier. Pour les copropriétés privées, l'accord de l'assemblée générale est requis pour les travaux en parties communes.",
      },
      {
        q: "Quel délai pour intervenir dans les nouvelles zones Grand Paris en 93 ?",
        a: "Nous intervenons sous 48h dans toute la Seine-Saint-Denis, y compris les nouvelles zones transformées par le Grand Paris Express (Saint-Ouen, Saint-Denis, Plaine Commune). Pour les chantiers actifs avec accès restreint, un délai complémentaire peut s'appliquer. Devis gratuit sous 24h, sans déplacement préalable sur photos.",
      },
    ],
  },
  {
    slug: "val-de-marne-94",
    code: "94",
    name: "Val-de-Marne",
    population: "1,4 million d'habitants",
    communes: 47,
    context:
      "Le Val-de-Marne est un département résidentiel au caractère affirmé, bordé par la Marne à l'est et aux portes de Paris à l'ouest. Vincennes et ses abords boisés, Créteil la préfecture avec ses tours, Saint-Maur-des-Fossés et ses pavillons en bord de Marne, Vitry-sur-Seine en pleine mutation : le 94 offre une diversité de typologies immobilières qui fait la richesse de nos interventions. La chaleur estivale y est amplifiée par la minéralisation des zones urbaines.",
    highlights: [
      "Couverture complète des 47 communes du 94",
      "Expertise maisons individuelles en bord de Marne",
      "Spécialistes grands ensembles et copropriétés",
      "Intervention sous 48h dans tout le département",
    ],
    faqItems: [
      {
        q: "Quel type de climatisation pour une maison en bord de Marne dans le 94 ?",
        a: "Pour les maisons individuelles du Val-de-Marne (Saint-Maur, Vincennes, Nogent), nous recommandons un multisplit 2 à 4 têtes avec unité extérieure au sol dans le jardin ou sur façade. Les maisons avec faux-plafonds peuvent bénéficier d'un gainable invisible. Le coût varie de 2 800 à 5 500 € TTC selon le nombre de pièces. Devis gratuit lors de la visite technique.",
      },
      {
        q: "Intervenez-vous dans les tours d'appartements à Créteil ?",
        a: "Oui, nous avons une solide expérience dans les grands ensembles de Créteil (Lac, Mont-Mesly, Palais). Les contraintes techniques, hauteur, accès toiture, passage de gaines en cage, sont maîtrisées par nos équipes. L'accord du syndic est requis pour les interventions en parties communes.",
      },
      {
        q: "Y a-t-il des aides locales dans le Val-de-Marne pour la climatisation ?",
        a: "Les aides nationales s'appliquent dans le 94 : TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau) pour les logements +2 ans, CEE, MaPrimeRénov' selon revenus. Le Département du Val-de-Marne peut proposer des aides complémentaires pour la rénovation énergétique dans le cadre de ses politiques habitat. Nos techniciens RGE vous guident dans les dossiers.",
      },
    ],
  },
  {
    slug: "seine-et-marne-77",
    code: "77",
    name: "Seine-et-Marne",
    population: "1,4 million d'habitants",
    communes: 514,
    context:
      "La Seine-et-Marne est le plus grand département d'Île-de-France, représentant près de la moitié de la surface de la région. Ce département à dominante rurale et périurbaine offre un mélange unique de maisons de village, pavillons modernes et zones d'activités logistiques. Les étés de plus en plus chauds en contexte continental rendent la climatisation indispensable, aussi bien dans les maisons individuelles de Meaux, Melun ou Fontainebleau que dans les entrepôts et bureaux des zones d'activités.",
    highlights: [
      "Couverture complète des 514 communes du 77",
      "Spécialistes maisons individuelles et pavillons",
      "Délai d'intervention 48-72h selon localisation",
      "Devis gratuit sur photos sans déplacement",
    ],
    faqItems: [
      {
        q: "Intervenez-vous dans toute la Seine-et-Marne, même les communes rurales ?",
        a: "Oui, nous couvrons l'ensemble du département 77. Pour les communes éloignées (sud du département, Fontainebleau, Provins), le délai d'intervention peut être de 48 à 72h selon nos disponibilités. Le devis est établi sous 24h sur photos sans déplacement préalable. Des frais de déplacement peuvent s'appliquer mais sont offerts sur devis accepté.",
      },
      {
        q: "Quelle climatisation pour une maison de village en Seine-et-Marne ?",
        a: "Pour les maisons de village typiques de la Seine-et-Marne, avec souvent des volumes importants et des matériaux anciens (pierres, briques), le multisplit est la solution adaptée. L'unité extérieure peut être discrètement posée sur un côté de la maison ou en toiture terrasse. Nous réalisons un calcul de puissance précis tenant compte de l'isolation et de l'exposition.",
      },
      {
        q: "Y a-t-il des contraintes particulières à Fontainebleau pour l'installation de clim ?",
        a: "Fontainebleau et ses environs comportent des zones ABF liées au château et à la forêt classée. Pour les bâtiments en centre-ville ou près du château, une autorisation de l'Architecte des Bâtiments de France peut être requise. Nous réalisons le diagnostic de votre adresse avant tout devis.",
      },
    ],
  },
  {
    slug: "yvelines-78",
    code: "78",
    name: "Yvelines",
    population: "1,5 million d'habitants",
    communes: 262,
    context:
      "Les Yvelines sont un département verdoyant à l'ouest de Paris, dominé par les grandes forêts de Saint-Germain et de Rambouillet. Versailles et son secteur classé UNESCO, les villes nouvelles comme Saint-Quentin-en-Yvelines, les communes résidentielles de Rueil-Malmaison ou des Mureaux composent un tissu immobilier très varié. Malgré la fraîcheur apportée par les forêts, les vagues de chaleur estivales touchent autant les pavillons des Yvelines que les appartements de banlieue parisienne.",
    highlights: [
      "Couverture complète des 262 communes du 78",
      "Expertise zones ABF autour de Versailles",
      "Spécialistes maisons individuelles et pavillons",
      "Devis sans déplacement sur photos",
    ],
    faqItems: [
      {
        q: "La zone ABF de Versailles complique-t-elle l'installation d'une climatisation ?",
        a: "Dans le périmètre protégé de Versailles (centre-ville, abords du château), toute installation visible depuis l'espace public nécessite l'accord de l'Architecte des Bâtiments de France. En pratique, les unités posées en cour intérieure, sur une toiture non visible ou sur un mur arrière sont souvent acceptées. Nous réalisons un diagnostic ABF préalable gratuit pour votre adresse.",
      },
      {
        q: "Proposez-vous des installations pour les maisons individuelles dans les Yvelines ?",
        a: "Les maisons individuelles représentent la majorité de nos interventions dans les Yvelines. Pour les pavillons, nous recommandons le multisplit 2 à 4 têtes selon le nombre de pièces, ou le gainable pour les maisons avec faux-plafonds ou combles aménagés. L'unité extérieure peut être posée au sol dans le jardin pour une installation discrète.",
      },
      {
        q: "Quel délai pour une installation clim à Saint-Quentin-en-Yvelines ?",
        a: "Nous intervenons à Saint-Quentin-en-Yvelines et dans tout le secteur de la ville nouvelle sous 48h après acceptation du devis. La densité résidentielle et professionnelle de cette zone nous permet d'y affecter des techniciens régulièrement. Devis gratuit sous 24h sur photos.",
      },
    ],
  },
  {
    slug: "essonne-91",
    code: "91",
    name: "Essonne",
    population: "1,3 million d'habitants",
    communes: 196,
    context:
      "L'Essonne (91) est un département du sud de l'Île-de-France qui associe pôles technologiques majeurs (Massy, Saclay, Évry-Courcouronnes, Palaiseau) et vastes zones résidentielles pavillonnaires à Longjumeau, Corbeil-Essonnes, Montgeron et Brétigny-sur-Orge. Le plateau de Saclay abrite l'un des plus grands campus scientifiques d'Europe. Les zones industrielles et tertiaires génèrent une forte demande en climatisation professionnelle. Le parc résidentiel, mixte entre maisons individuelles et copropriétés des années 70, bénéficie grandement des solutions réversibles monosplit et multisplit. L'installation climatisation en Essonne, le nettoyage annuel et le dépannage représentent nos trois prestations principales sur l'ensemble des 196 communes du 91.",
    highlights: [
      "Couverture complète des 196 communes du 91",
      "Installation, entretien et nettoyage climatisation Essonne",
      "Dépannage sous 48h, Évry, Massy, Corbeil, Palaiseau",
      "Techniciens RGE, aides CEE et MaPrimeRénov'",
    ],
    faqItems: [
      {
        q: "Quel est le prix d'un nettoyage climatisation en Essonne ?",
        a: "Le nettoyage et l'entretien climatisation en Essonne coûte à partir de 200 € TTC pour 1 unité, avec +60 € TTC par unité supplémentaire. Le tarif peut varier selon la distance depuis Paris et l'accessibilité de l'installation. La prestation comprend le nettoyage des filtres, de l'évaporateur et du condenseur, le contrôle du circuit frigorigène et un rapport d'intervention signé.",
      },
      {
        q: "Proposez-vous des solutions climatisation pour les entreprises de l'Essonne ?",
        a: "Oui, l'Essonne, et notamment la zone Massy-Palaiseau, est l'une de nos zones principales pour la climatisation professionnelle. Bureaux, salles de réunion, salles serveurs, laboratoires : nous installons des systèmes adaptés à chaque usage. Contrats de maintenance annuelle disponibles avec intervention prioritaire sous 48h.",
      },
      {
        q: "Intervenez-vous pour le dépannage climatisation en Essonne ?",
        a: "Oui, nous assurons le dépannage climatisation dans tout le 91 : Évry-Courcouronnes, Massy, Corbeil-Essonnes, Palaiseau, Longjumeau, Brétigny-sur-Orge, Montgeron. Délai d'intervention sous 48h après diagnostic. Toutes marques prises en charge : Daikin, Mitsubishi, Samsung, Fujitsu, Toshiba.",
      },
      {
        q: "Y a-t-il des aides pour installer une climatisation en Essonne ?",
        a: "Les logements en Essonne bénéficient pleinement des aides à la rénovation : TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau), CEE, MaPrimeRénov' pour les PAC éligibles. Ces aides peuvent couvrir 20 à 40 % du coût total de l'installation. Nos techniciens RGE gèrent les dossiers de demande de A à Z.",
      },
      {
        q: "Intervenez-vous autour du plateau de Saclay ?",
        a: "Oui, nous couvrons tout le secteur Saclay-Orsay-Les Ulis. La densification immobilière liée au développement du campus Paris-Saclay génère une forte demande que nous anticipons avec des équipes dédiées. Devis rapide sur photos, intervention sous 48h.",
      },
    ],
  },
  {
    slug: "val-d-oise-95",
    code: "95",
    name: "Val-d'Oise",
    population: "1,2 million d'habitants",
    communes: 185,
    context:
      "Le Val-d'Oise est le département le plus au nord de l'Île-de-France, bordé par la Seine et l'Oise. Il associe des villes densément peuplées comme Cergy-Pontoise (ville nouvelle), Argenteuil ou Sarcelles à des zones rurales et boisées (forêts de Montmorency, L'Isle-Adam). Le trafic aérien d'Orly et de Roissy contribue à la densité des zones urbanisées. Nos techniciens couvrent l'ensemble des communes du 95, des pavillons de la campagne valdoisienne aux appartements de Cergy.",
    highlights: [
      "Couverture complète des 185 communes du 95",
      "Expertise Cergy-Pontoise et zones résidentielles",
      "Intervention sous 48h depuis Paris",
      "Solutions pour tous budgets",
    ],
    faqItems: [
      {
        q: "Couvrez-vous tout le Val-d'Oise, y compris les zones rurales ?",
        a: "Oui, nous intervenons dans l'ensemble du département 95, des communes urbaines d'Argenteuil et Cergy aux villages ruraux du Vexin. Pour les zones les plus éloignées (nord du département), le délai peut atteindre 72h. Le devis gratuit est établi sous 24h sur photos.",
      },
      {
        q: "Quelles solutions climatisation pour les maisons de la vallée de Montmorency ?",
        a: "La vallée de Montmorency concentre de nombreuses maisons individuelles et pavillons. La végétation dense peut tempérer les températures, mais les vagues de chaleur restent intenses. Nous recommandons un multisplit 2-3 têtes pour les maisons de 80-150 m², avec unité extérieure au sol dans le jardin. Devis après visite technique gratuite.",
      },
      {
        q: "Y a-t-il des contraintes particulières à Cergy pour l'installation de climatisation ?",
        a: "Cergy-Pontoise, ville nouvelle planifiée, dispose d'une architecture variée : barres d'immeubles, pavillons, logements collectifs récents. Pour les copropriétés, l'accord de l'assemblée générale reste nécessaire. Les logements individuels offrent généralement plus de souplesse d'installation. Délai standard 48h, devis sous 24h.",
      },
    ],
  },
];

export function getDepartementBySlug(slug: string): Departement | undefined {
  return DEPARTEMENTS.find((d) => d.slug === slug);
}

export function getVillesByDept(code: string): Ville[] {
  return VILLES.filter((v) => v.dept === code);
}
