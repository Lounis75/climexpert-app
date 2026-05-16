export interface ArticleSection {
  heading: string;
  content?: string[];
  subsections?: { heading: string; content: string[] }[];
  table?: { headers: string[]; rows: string[][] };
  list?: string[];
  highlight?: string;
}

export interface Article {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  date: string;
  readTime: number;
  category: string;
  heroImage: string;
  heroAlt: string;
  intro: string;
  sections: ArticleSection[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
  author?: string;
}

export const articles: Article[] = [
  {
    slug: "prix-climatisation-ile-de-france-2025",
    title: "Prix d'une climatisation en Île-de-France en 2026 : tous les tarifs",
    metaTitle: "Prix Climatisation Île-de-France 2026 : Tarifs Complets | ClimExpert",
    metaDescription:
      "Combien coûte une climatisation en Île-de-France en 2026 ? Tarifs par type de système (monosplit, multisplit, gainable), facteurs de prix et aides disponibles.",
    keywords:
      "prix climatisation ile de france, tarif installation climatisation paris, combien coûte climatisation, devis climatisation idf",
    date: "2025-05-01",
    readTime: 7,
    category: "Prix & Budget",
    heroImage:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Technicien installant une climatisation en Île-de-France",
    intro:
      "Le prix d'une climatisation en Île-de-France varie fortement selon le type de système, la surface à traiter et la complexité de l'installation. En 2026, comptez entre 1 500 € pour un monosplit d'entrée de gamme et plus de 15 000 € pour une PAC air-eau sur une grande maison. Voici une grille tarifaire complète pour vous aider à budgéter votre projet.",
    sections: [
      {
        heading: "Tableau des prix par type de système (2026)",
        content: [
          "Ces tarifs incluent le matériel, la main-d'œuvre, les raccordements frigorifiques et électriques, et la mise en service. Ils sont donnés pour des installations standards en Île-de-France.",
        ],
        table: {
          headers: ["Type de système", "Surface couverte", "Prix TTC (pose incluse)"],
          rows: [
            ["Monosplit (1 pièce)", "15 – 30 m²", "1 500 € – 2 500 €"],
            ["Multisplit 2 pièces", "30 – 60 m²", "2 800 € – 4 500 €"],
            ["Multisplit 3 pièces", "60 – 90 m²", "3 500 € – 5 500 €"],
            ["Multisplit 4+ pièces", "90 m² et +", "4 500 € – 8 000 €"],
            ["Gainable (toute la maison)", "100 – 200 m²", "4 000 € – 10 000 €"],
            ["PAC air-eau", "Maison individuelle", "8 000 € – 15 000 €"],
          ],
        },
        highlight:
          "Ces prix s'entendent avec la TVA à 5,5 % pour les logements de plus de 2 ans. Pour une construction neuve, la TVA s'applique à 20 %.",
      },
      {
        heading: "Facteurs qui font varier le prix",
        subsections: [
          {
            heading: "La longueur des liaisons frigorifiques",
            content: [
              "La distance entre l'unité intérieure et l'unité extérieure impacte directement le coût. Chaque mètre supplémentaire de liaison représente environ 30 à 50 € de matériel et de pose supplémentaires. En appartement parisien avec une façade en cour, les liaisons peuvent atteindre 10 à 15 mètres.",
            ],
          },
          {
            heading: "La complexité de passage des gaines",
            content: [
              "Dans un immeuble haussmannien ou une maison ancienne, faire passer les gaines peut nécessiter des travaux spécifiques : passage sous plancher, dans les combles, ou le long d'une façade. Ces travaux supplémentaires peuvent ajouter 200 à 600 € selon la configuration.",
            ],
          },
          {
            heading: "La marque et la gamme de l'équipement",
            content: [
              "Les marques premium comme Daikin ou Mitsubishi Electric coûtent 20 à 30 % plus cher à l'achat qu'une marque d'entrée de gamme, mais leur fiabilité sur 15 à 20 ans justifie souvent l'investissement. Une unité Daikin monosplit vaut entre 800 et 1 200 € de matériel seul.",
            ],
          },
          {
            heading: "L'étage et l'accessibilité",
            content: [
              "Une installation en rez-de-chaussée ou au 1er étage est plus rapide et moins coûteuse qu'une installation en hauteur nécessitant un échafaudage ou une nacelle. À Paris, les immeubles sans ascenseur impliquent également une logistique plus lourde pour monter le matériel.",
            ],
          },
        ],
      },
      {
        heading: "Prix selon les départements d'Île-de-France",
        content: [
          "Les tarifs varient légèrement selon les départements, principalement en raison des coûts de déplacement et de la densité du tissu urbain.",
        ],
        table: {
          headers: ["Département", "Spécificités", "Variation de prix"],
          rows: [
            ["Paris (75)", "Accès difficile, immeubles anciens, contraintes copropriété", "+ 5 à 15 %"],
            ["Hauts-de-Seine (92)", "Zone dense, bonne accessibilité", "Prix de référence"],
            ["Val-de-Marne (94)", "Mix urbain/résidentiel", "Prix de référence"],
            ["Yvelines (78)", "Maisons individuelles, accès facile", "- 5 à 10 %"],
            ["Essonne (91)", "Zones pavillonnaires", "- 5 à 10 %"],
            ["Seine-et-Marne (77)", "Éloignement, maisons avec jardin", "- 5 %"],
          ],
        },
      },
      {
        heading: "Ce qui est inclus dans notre devis",
        list: [
          "Fourniture de l'unité intérieure et de l'unité extérieure",
          "Liaisons frigorifiques en cuivre gainé",
          "Raccordement électrique (jusqu'à 5 m du tableau)",
          "Support mural et fixation de l'unité extérieure",
          "Mise en service et vérification des performances",
          "Démonstration de la télécommande et conseils d'utilisation",
          "Rapport d'intervention signé",
        ],
      },
      {
        heading: "Réduire le coût grâce aux aides financières",
        content: [
          "En 2026, plusieurs dispositifs permettent de réduire significativement le coût d'une installation climatisation en Île-de-France. La TVA à 5,5 % s'applique automatiquement pour tout logement de plus de 2 ans. Pour une PAC air-eau, MaPrimeRénov' peut couvrir jusqu'à 4 000 € selon vos revenus. Les Certificats d'Économie d'Énergie (CEE) représentent une prime supplémentaire de 200 à 800 € selon les opérations.",
          "Pour une installation classique (monosplit ou multisplit), la TVA réduite représente déjà une économie de 14,5 % par rapport au taux normal. Sur une installation à 4 000 €, c'est environ 580 € d'économie immédiate.",
        ],
      },
    ],
    faq: [
      {
        question: "Le devis est-il gratuit ?",
        answer:
          "Oui, le devis ClimExpert est entièrement gratuit et sans engagement. Nous pouvons établir une première estimation à distance sur photos, puis affiner avec une visite technique si nécessaire.",
      },
      {
        question: "Y a-t-il des frais cachés après le devis ?",
        answer:
          "Non. Nos devis sont fermes et définitifs. Le seul cas de modification est si une contrainte technique imprévue est découverte lors de l'installation (ex : mur en béton armé non signalé), auquel cas nous vous prévenons avant de continuer.",
      },
      {
        question: "Peut-on payer en plusieurs fois ?",
        answer:
          "Oui, nous proposons des facilités de paiement. Contactez-nous pour connaître les modalités selon le montant de votre projet.",
      },
      {
        question: "La TVA à 5,5 % s'applique-t-elle aux appartements neufs ?",
        answer:
          "Non, la TVA réduite à 5,5 % ne s'applique qu'aux logements achevés depuis plus de 2 ans. Pour un logement neuf ou récent, la TVA est à 10 % ou 20 % selon les cas.",
      },
    ],
    relatedSlugs: [
      "maprimerenov-climatisation-2025",
      "choisir-climatisation-maison",
      "climatisation-appartement-paris",
    ],
  },

  {
    slug: "climatisation-appartement-paris",
    title: "Climatisation dans un appartement à Paris : tout ce qu'il faut savoir",
    metaTitle: "Climatisation Appartement Paris 2026 : Guide Complet | ClimExpert",
    metaDescription:
      "Installer une climatisation dans un appartement à Paris : autorisations copropriété, contraintes ABF, solutions adaptées aux immeubles anciens. Guide complet 2026.",
    keywords:
      "climatisation appartement paris, installer clim appartement paris, copropriété climatisation, clim paris autorisation, climatisation immeuble haussmannien",
    date: "2025-05-05",
    readTime: 8,
    category: "Installation",
    heroImage:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Appartement parisien avec climatisation installée",
    intro:
      "Installer une climatisation dans un appartement parisien est tout à fait possible, mais cela demande de respecter des règles spécifiques liées à la copropriété, aux Architectes des Bâtiments de France (ABF) et aux contraintes des immeubles anciens. Ce guide vous explique tout ce qu'il faut savoir avant de vous lancer.",
    sections: [
      {
        heading: "Faut-il une autorisation pour installer une clim à Paris ?",
        content: [
          "La réponse dépend de deux facteurs : votre règlement de copropriété et la localisation de votre immeuble. Dans la majorité des cas, une autorisation est nécessaire dès que l'unité extérieure est visible depuis la rue ou placée sur une partie commune.",
        ],
        subsections: [
          {
            heading: "L'autorisation de la copropriété",
            content: [
              "Si votre unité extérieure se pose sur un balcon privatif fermé ou en toiture avec accès privatif, une simple déclaration au syndic peut suffire. En revanche, si elle se pose en façade ou dans une cour commune, un vote en assemblée générale à la majorité de l'article 25 est généralement requis.",
              "Conseil pratique : demandez d'abord un extrait de votre règlement de copropriété. La section 'travaux privatifs' précise généralement les conditions. ClimExpert peut vous aider à préparer le dossier technique pour l'AG.",
            ],
          },
          {
            heading: "Les zones protégées ABF",
            content: [
              "Une grande partie de Paris est classée en secteur sauvegardé ou à proximité de monuments historiques, ce qui soumet les travaux visibles au contrôle des Architectes des Bâtiments de France. Dans ces zones, l'unité extérieure en façade peut être refusée ou imposer des contraintes de discrétion (couleur, taille, emplacement).",
              "Alternative : l'installation en toiture ou en cour intérieure est souvent plus facilement acceptée. Nous réalisons systématiquement une vérification préalable du périmètre ABF avant chaque devis.",
            ],
          },
        ],
      },
      {
        heading: "Solutions adaptées aux appartements parisiens",
        subsections: [
          {
            heading: "Le monosplit pour un appartement ou un studio",
            content: [
              "Pour climatiser 1 à 2 pièces, le monosplit reste la solution la plus simple à installer et la plus économique. L'unité intérieure se fixe en hauteur sur un mur, l'unité extérieure en façade arrière ou sur un garde-corps de balcon. Comptez 1 500 à 2 500 € pose incluse.",
            ],
          },
          {
            heading: "Le multisplit pour un appartement de 3 pièces et plus",
            content: [
              "Le multisplit permet de climatiser plusieurs pièces avec une seule unité extérieure, ce qui limite les autorisations nécessaires. Un multisplit 3 têtes pour un appartement de 70 m² coûte entre 3 500 et 5 500 € pose incluse.",
            ],
          },
          {
            heading: "La cassette de plafond pour les espaces sans mur disponible",
            content: [
              "Dans les grands appartements avec hauteur sous plafond importante, la cassette encastrée est une option discrète et esthétique. Elle nécessite un faux-plafond ou un habillage, mais disparaît complètement de la vue.",
            ],
          },
        ],
      },
      {
        heading: "Spécificités des immeubles haussmanniens",
        content: [
          "Les immeubles haussmanniens (construits entre 1853 et 1870) présentent des défis techniques particuliers : murs en pierre de taille de 60 à 80 cm d'épaisseur, hauteurs sous plafond de 3 à 4 m, et souvent pas de tableau électrique mis aux normes.",
          "Pour la traversée des murs : nous utilisons des carotteuses professionnelles adaptées à la pierre. Le passage de gaine (∅ 65 mm) est réalisé proprement et calfeutré à l'identique de la paroi. Le temps d'installation est généralement plus long (+2h à +4h) mais le résultat est net et durable.",
        ],
        highlight:
          "Important : dans un immeuble haussmannien classé, toute perforation en façade avant est soumise à déclaration préalable en mairie. Nous gérons ces démarches pour vous.",
      },
      {
        heading: "Si vous êtes locataire",
        content: [
          "En tant que locataire, vous pouvez installer une climatisation à condition d'obtenir l'accord écrit de votre propriétaire. La loi ELAN de 2018 vous y oblige pour tout aménagement modifiant le bien. Si le propriétaire refuse sans motif légitime, vous pouvez saisir le tribunal.",
          "Bon à savoir : à la fin du bail, vous pouvez soit remettre le bien en état (enlever la clim), soit la laisser si le propriétaire l'accepte — parfois moyennant un avenant au bail.",
        ],
      },
      {
        heading: "Délai et déroulement d'une installation à Paris",
        list: [
          "J-0 : prise de contact et estimation à distance sur photos",
          "J+2 : visite technique gratuite si nécessaire (vérification ABF, copropriété, tableau électrique)",
          "J+5 à J+10 : remise du devis définitif",
          "J+15 à J+30 : planification de l'installation (selon accord copropriété)",
          "Jour J : installation en 4 à 8h selon la configuration",
        ],
      },
    ],
    faq: [
      {
        question: "Mon syndic tarde à convoquer une AG, que faire ?",
        answer:
          "Vous pouvez demander une autorisation temporaire au conseil syndical, ou proposer un vote par correspondance si votre règlement le permet. Dans certains cas, si le règlement de copropriété est silencieux sur la question et que l'installation est sur votre partie privative, aucune autorisation n'est formellement requise.",
      },
      {
        question: "L'unité extérieure sur le balcon privatif est-elle toujours autorisée ?",
        answer:
          "Pas systématiquement. Même si le balcon est privatif, la façade de l'immeuble est une partie commune. Dans la plupart des règlements, modifier l'aspect extérieur de la façade requiert un accord de la copropriété. Vérifiez votre règlement ou demandez-nous, nous pouvons le faire pour vous.",
      },
      {
        question: "Intervenez-vous dans tous les arrondissements de Paris ?",
        answer:
          "Oui, nous intervenons dans les 20 arrondissements de Paris ainsi que dans toute la petite et grande couronne. Aucun frais de déplacement sur devis accepté.",
      },
      {
        question: "Combien de temps dure l'installation dans un appartement ?",
        answer:
          "Entre 4 et 8 heures selon la configuration. Un monosplit standard se pose en demi-journée. Un multisplit 3 têtes nécessite généralement une journée complète.",
      },
    ],
    relatedSlugs: [
      "prix-climatisation-ile-de-france-2025",
      "maprimerenov-climatisation-2025",
      "entretien-climatisation",
    ],
  },

  {
    slug: "maprimerenov-climatisation-2025",
    title: "MaPrimeRénov' et aides pour la climatisation en 2026",
    metaTitle: "MaPrimeRénov' Climatisation 2026 : Montants, Conditions & Démarches | ClimExpert",
    metaDescription:
      "Quelles aides pour financer votre climatisation en 2026 ? MaPrimeRénov', CEE, TVA 5,5%… Conditions d'éligibilité, montants et démarches expliqués simplement.",
    keywords:
      "maprimerenov climatisation, aide climatisation 2025, subvention climatisation, CEE climatisation, TVA climatisation, financement climatisation",
    date: "2025-05-08",
    readTime: 7,
    category: "Aides & Financement",
    heroImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Documents administratifs pour les aides à la rénovation énergétique",
    intro:
      "En 2026, plusieurs dispositifs permettent de réduire significativement le coût d'une installation de climatisation ou de pompe à chaleur. Entre MaPrimeRénov', les Certificats d'Économie d'Énergie (CEE) et la TVA réduite, l'aide totale peut atteindre plusieurs milliers d'euros. Voici un tour d'horizon complet et à jour.",
    sections: [
      {
        heading: "MaPrimeRénov' : jusqu'à 4 000 € pour une PAC air-eau",
        content: [
          "MaPrimeRénov' est la principale aide de l'État pour la rénovation énergétique. En 2026, elle concerne principalement les systèmes de chauffage — dont les pompes à chaleur air-eau — et non les climatiseurs réversibles air-air classiques.",
        ],
        subsections: [
          {
            heading: "Ce qui est éligible",
            content: [
              "La PAC air-eau est éligible à MaPrimeRénov' car elle produit de la chaleur pour le chauffage central et l'eau chaude sanitaire. Elle peut remplacer une chaudière gaz ou fioul.",
              "Les climatiseurs réversibles air-air (monosplit, multisplit, gainable) ne sont pas éligibles à MaPrimeRénov' en 2026, mais bénéficient de la TVA à 5,5 % et peuvent être éligibles aux CEE.",
            ],
          },
          {
            heading: "Montants MaPrimeRénov' PAC air-eau en 2026",
            content: [
              "Le montant dépend de vos revenus fiscaux de référence et de la composition de votre foyer.",
            ],
          },
        ],
        table: {
          headers: ["Profil de revenus", "Ménages concernés", "Aide MaPrimeRénov' PAC air-eau"],
          rows: [
            ["Très modestes (bleu)", "Revenus très faibles", "Jusqu'à 4 000 €"],
            ["Modestes (jaune)", "Revenus modestes", "Jusqu'à 3 000 €"],
            ["Intermédiaires (violet)", "Revenus intermédiaires", "Jusqu'à 2 000 €"],
            ["Supérieurs (rose)", "Revenus élevés", "Non éligible"],
          ],
        },
      },
      {
        heading: "Les Certificats d'Économie d'Énergie (CEE)",
        content: [
          "Les CEE sont des primes versées par les fournisseurs d'énergie (EDF, Engie, TotalEnergies…) en échange de travaux d'économie d'énergie. Contrairement à MaPrimeRénov', ils s'appliquent aussi aux climatiseurs réversibles air-air.",
          "Pour une installation de climatisation réversible en Île-de-France, la prime CEE se situe généralement entre 200 et 800 € selon la puissance de l'équipement et le nombre d'unités. ClimExpert gère le dossier CEE pour vous et déduit la prime directement de votre facture.",
        ],
        highlight:
          "Important : pour bénéficier des CEE, l'entreprise doit être certifiée RGE (Reconnu Garant de l'Environnement). Tous nos techniciens sont certifiés RGE Qualibat.",
      },
      {
        heading: "La TVA à 5,5 % : une économie automatique",
        content: [
          "Pour tout logement achevé depuis plus de 2 ans, la TVA sur les travaux d'installation d'une climatisation est de 5,5 % au lieu de 20 %. Ce n'est pas une aide à demander : elle s'applique automatiquement sur votre facture dès lors que votre logement remplit la condition d'ancienneté.",
          "Sur une installation à 4 000 €, la TVA réduite représente une économie d'environ 580 € comparé au taux normal de 20 %.",
        ],
        table: {
          headers: ["Type de logement", "Taux de TVA applicable"],
          rows: [
            ["Logement de plus de 2 ans (résidence principale)", "5,5 %"],
            ["Logement de plus de 2 ans (résidence secondaire)", "10 %"],
            ["Construction neuve ou rénovée à plus de 25 %", "20 %"],
          ],
        },
      },
      {
        heading: "Aides locales en Île-de-France",
        content: [
          "En complément des aides nationales, certaines collectivités d'Île-de-France proposent des aides supplémentaires pour les travaux de rénovation énergétique. La Région Île-de-France peut accorder des subventions complémentaires dans le cadre du programme Île-de-France Énergies.",
          "Certaines communes (notamment dans les Hauts-de-Seine et le Val-de-Marne) proposent des prêts à taux zéro ou des subventions directes pour des travaux d'amélioration de l'efficacité énergétique. Renseignez-vous auprès de votre mairie ou contactez l'ADIL (Agence Départementale d'Information sur le Logement) de votre département.",
        ],
      },
      {
        heading: "Exemple de financement complet pour une PAC air-eau",
        content: [
          "Prenons l'exemple d'un propriétaire à revenus modestes installant une PAC air-eau à 12 000 € dans sa maison des Yvelines.",
        ],
        table: {
          headers: ["Dispositif", "Montant"],
          rows: [
            ["Prix total TTC", "12 000 €"],
            ["TVA à 5,5 % déjà appliquée (vs 20 %)", "- 1 740 €"],
            ["MaPrimeRénov' (profil jaune)", "- 3 000 €"],
            ["Prime CEE", "- 600 €"],
            ["Reste à charge", "≈ 6 660 €"],
          ],
        },
        highlight:
          "Soit plus de 5 300 € d'aides sur un projet à 12 000 €. ClimExpert gère l'ensemble des dossiers pour vous.",
      },
    ],
    faq: [
      {
        question: "Peut-on cumuler MaPrimeRénov' et les CEE ?",
        answer:
          "Oui, les deux aides sont cumulables. MaPrimeRénov' est versée par l'ANAH et les CEE sont versés par les fournisseurs d'énergie — ce sont deux dispositifs indépendants.",
      },
      {
        question: "Qui s'occupe des démarches d'aides ?",
        answer:
          "ClimExpert prend en charge le montage des dossiers CEE et vous accompagne pour MaPrimeRénov'. Vous n'avez rien à faire de votre côté : nous collectons les documents nécessaires et déduisons les primes directement sur votre facture.",
      },
      {
        question: "Faut-il avancer les sommes avant de percevoir les aides ?",
        answer:
          "Pour les CEE, non — la prime est directement déduite de votre facture. Pour MaPrimeRénov', vous devez en général avancer une partie des fonds, puis percevoir le remboursement après les travaux. Dans certains cas (profils très modestes), une avance peut être accordée.",
      },
      {
        question: "Ces aides sont-elles disponibles pour les professionnels ?",
        answer:
          "Les CEE sont accessibles aux professionnels pour certaines opérations. MaPrimeRénov' est réservée aux propriétaires de logements à usage d'habitation. Pour les locaux professionnels, d'autres dispositifs existent (TVA à 20 % récupérable, amortissement fiscal).",
      },
    ],
    relatedSlugs: [
      "prix-climatisation-ile-de-france-2025",
      "choisir-climatisation-maison",
      "climatisation-reversible-fonctionnement",
    ],
  },

  {
    slug: "climatisation-reversible-fonctionnement",
    title: "Climatisation réversible : fonctionnement, avantages et prix",
    metaTitle: "Climatisation Réversible : Fonctionnement, Avantages & Prix 2026 | ClimExpert",
    metaDescription:
      "Comment fonctionne une climatisation réversible ? Avantages, économies, différence avec un chauffage classique, COP, SEER et prix. Tout savoir en 2025.",
    keywords:
      "climatisation reversible, clim reversible fonctionnement, pompe chaleur air air, avantages climatisation reversible, COP SEER climatisation",
    date: "2025-04-20",
    readTime: 6,
    category: "Guide technique",
    heroImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Unité intérieure de climatisation réversible installée dans un salon",
    intro:
      "La climatisation réversible — aussi appelée pompe à chaleur air-air — est aujourd'hui la solution de confort thermique la plus efficace du marché. Elle refroidit en été et chauffe en hiver, avec un rendement 3 à 5 fois supérieur à un radiateur électrique classique. Comprendre son fonctionnement vous aidera à mieux choisir et optimiser votre équipement.",
    sections: [
      {
        heading: "Comment ça fonctionne ?",
        content: [
          "Une climatisation réversible fonctionne sur le principe du cycle frigorifique : elle ne produit pas de chaleur ou de froid directement, elle transfère des calories d'un endroit à un autre grâce à un fluide frigorigène.",
          "En mode climatisation (été) : le système capte la chaleur de l'air intérieur et la rejette à l'extérieur via l'unité extérieure. L'air intérieur est ainsi refroidi.",
          "En mode chauffage (hiver) : le cycle est inversé. Le système capte les calories présentes dans l'air extérieur (même par temps froid, jusqu'à -15°C pour les modèles récents) et les transfère à l'intérieur.",
        ],
        highlight:
          "Le principe clé : la pompe à chaleur air-air ne crée pas d'énergie, elle la déplace. C'est pourquoi elle consomme 3 à 5 fois moins qu'un radiateur électrique pour produire la même chaleur.",
      },
      {
        heading: "Les indicateurs de performance à connaître",
        subsections: [
          {
            heading: "Le SEER (efficacité en mode climatisation)",
            content: [
              "Le SEER (Seasonal Energy Efficiency Ratio) mesure l'efficacité en mode froid sur une saison entière. Un SEER de 6 signifie que pour 1 kWh d'électricité consommé, l'appareil produit 6 kWh de froid. En 2026, visez un SEER minimum de 6,1 (classe A++) pour une consommation optimisée.",
            ],
          },
          {
            heading: "Le SCOP (efficacité en mode chauffage)",
            content: [
              "Le SCOP (Seasonal Coefficient of Performance) est l'équivalent du SEER pour le mode chauffage. Un SCOP de 4 signifie que pour 1 kWh électrique, vous obtenez 4 kWh de chaleur. Visez un SCOP minimum de 4,0 pour un chauffage économique.",
            ],
          },
        ],
        table: {
          headers: ["Classe énergétique", "SEER (froid)", "SCOP (chaud)", "Impact sur facture"],
          rows: [
            ["A+++ (meilleure)", "≥ 8,5", "≥ 5,1", "Très faible consommation"],
            ["A++", "≥ 6,1", "≥ 4,0", "Consommation optimisée"],
            ["A+", "≥ 5,6", "≥ 3,4", "Bonne efficacité"],
            ["A", "≥ 5,1", "≥ 3,0", "Standard"],
          ],
        },
      },
      {
        heading: "Réversible vs radiateur électrique : la différence sur la facture",
        content: [
          "C'est là l'avantage le plus concret de la climatisation réversible. Un radiateur électrique a un rendement de 1 : 1 kWh électrique = 1 kWh de chaleur. Une climatisation réversible de classe A++ a un SCOP de 4 : 1 kWh électrique = 4 kWh de chaleur.",
          "Pour chauffer un salon de 25 m² pendant 4 mois d'hiver, un radiateur électrique consomme environ 600 kWh, contre 150 kWh pour une clim réversible. Au prix actuel de l'électricité (~0,25 €/kWh), c'est une économie de 112 € par pièce et par an.",
        ],
        highlight:
          "Pour une maison avec 4 radiateurs électriques remplacés par un multisplit réversible, les économies annuelles peuvent atteindre 400 à 600 €.",
      },
      {
        heading: "Jusqu'à quelle température fonctionne-t-elle en chauffage ?",
        content: [
          "Les modèles d'entrée de gamme fonctionnent jusqu'à -7°C de température extérieure. Les modèles Hyper Heat de Mitsubishi ou Emura de Daikin fonctionnent jusqu'à -25°C avec une puissance de chauffe maintenue. En Île-de-France, où les hivers restent doux (rarement en dessous de -5°C), n'importe quel modèle de qualité convient pour un usage principal.",
        ],
      },
      {
        heading: "Les marques les plus fiables en 2026",
        list: [
          "Daikin — leader mondial, fiabilité et SAV excellents, gamme très complète",
          "Mitsubishi Electric — innovation (technologie Hyper Heat), silencieux",
          "Panasonic — bon rapport qualité/prix, efficacité énergétique élevée",
          "Toshiba — fiable, gamme design appréciée",
          "LG — design soigné, bonne connectivité Wi-Fi",
          "Samsung — gamme Wind-Free très populaire, diffusion douce",
        ],
      },
    ],
    faq: [
      {
        question: "Une climatisation réversible peut-elle remplacer totalement mon chauffage ?",
        answer:
          "Dans la majorité des logements bien isolés en Île-de-France, oui. Pour les maisons mal isolées ou avec de grandes déperditions thermiques, elle sera un complément efficace au chauffage principal plutôt qu'un remplacement total. Une visite technique permet d'évaluer votre cas précisément.",
      },
      {
        question: "La clim réversible fonctionne-t-elle correctement quand il fait -5°C dehors ?",
        answer:
          "Oui, tous les modèles récents fonctionnent parfaitement à -5°C avec une bonne efficacité. Le rendement diminue légèrement par grand froid, mais reste supérieur à celui d'un radiateur électrique dans tous les cas.",
      },
      {
        question: "Est-ce que ça assèche l'air en hiver ?",
        answer:
          "Moins qu'un chauffage électrique classique. En mode chauffage, la climatisation réversible extrait de l'humidité de l'air extérieur. Le taux d'humidité intérieur peut baisser légèrement, mais reste dans des plages confortables. Un humidificateur peut être ajouté si besoin.",
      },
      {
        question: "Peut-on programmer la climatisation à distance ?",
        answer:
          "Oui, tous les modèles récents intègrent le Wi-Fi et sont pilotables via application smartphone (Daikin Mobile Controller, Mitsubishi MELCloud, etc.). Vous pouvez programmer des plages horaires, des températures cibles et même activer l'appareil à distance.",
      },
    ],
    relatedSlugs: [
      "choisir-climatisation-maison",
      "entretien-climatisation",
      "prix-climatisation-ile-de-france-2025",
    ],
  },

  {
    slug: "entretien-climatisation",
    title: "Entretien climatisation : pourquoi, quand et combien ça coûte ?",
    metaTitle: "Entretien Climatisation 2026 : Fréquence, Contenu & Prix | ClimExpert",
    metaDescription:
      "Tout savoir sur l'entretien d'une climatisation : fréquence recommandée, ce que comprend la visite, prix d'un contrat d'entretien, et ce que vous pouvez faire vous-même.",
    keywords:
      "entretien climatisation prix, nettoyage climatisation, contrat entretien climatisation, vidange climatisation, entretien clim annuel",
    date: "2025-04-15",
    readTime: 5,
    category: "Entretien",
    heroImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Technicien effectuant l'entretien d'une climatisation",
    intro:
      "Une climatisation non entretenue perd jusqu'à 25 % de son efficacité en 3 ans et peut voir sa durée de vie réduite de moitié. L'entretien annuel est la meilleure assurance pour préserver vos performances, votre garantie constructeur et la qualité de l'air intérieur de votre logement.",
    sections: [
      {
        heading: "Pourquoi l'entretien est indispensable",
        subsections: [
          {
            heading: "Maintenir les performances",
            content: [
              "Les filtres encrassés et les échangeurs sales obligent le compresseur à travailler plus fort pour atteindre la même puissance. Résultat : consommation électrique en hausse (jusqu'à +30 %) et confort réduit. Un entretien annuel maintient les performances à niveau et préserve votre facture d'électricité.",
            ],
          },
          {
            heading: "Éviter les pannes coûteuses",
            content: [
              "La majorité des pannes évitables de climatisation sont dues à un manque d'entretien : bac de condensats débordant (fuite au plafond), compresseur surchargé par manque de gaz, carte électronique grillée par surtension. Une intervention préventive à partir de 180 € TTC évite souvent une panne à 800-1 500 €.",
            ],
          },
          {
            heading: "Qualité de l'air intérieur",
            content: [
              "Les filtres d'une climatisation captent poussières, allergènes et bactéries. Un filtre saturé redevient une source de pollution : il libère dans l'air les particules accumulées. Le nettoyage ou le remplacement des filtres est essentiel, particulièrement pour les personnes asthmatiques ou allergiques.",
            ],
          },
        ],
      },
      {
        heading: "À quelle fréquence faire entretenir sa clim ?",
        content: [
          "La recommandation standard est un entretien annuel, idéalement au printemps (mars-mai) avant la saison de chauffe estivale. Cela permet de vérifier et corriger tout problème avant que la charge de travail ne soit maximale.",
        ],
        table: {
          headers: ["Fréquence", "Type d'usage", "Recommandation"],
          rows: [
            ["1 fois/an", "Usage résidentiel normal (mai – sept)", "Standard recommandé"],
            ["2 fois/an", "Usage intensif (toute l'année en chaud et froid)", "Printemps + automne"],
            ["Trimestriel", "Local professionnel, hôtel, ERP", "Contrat pro adapté"],
          ],
        },
      },
      {
        heading: "Ce que comprend notre entretien à partir de 180 € TTC",
        list: [
          "Nettoyage et désinfection des filtres intérieurs",
          "Nettoyage de l'évaporateur (unité intérieure)",
          "Nettoyage du condenseur (unité extérieure)",
          "Vérification et nettoyage du bac et du drain de condensats",
          "Contrôle de la charge en fluide frigorigène (détection de fuite)",
          "Vérification des connexions électriques et du câblage",
          "Test de tous les modes de fonctionnement (froid, chaud, ventilation)",
          "Mesure des températures de soufflage et de reprise",
          "Rapport d'intervention signé avec état de l'équipement",
        ],
        highlight:
          "Le tarif démarre à 180 € TTC pour la 1ère unité (Paris intramuros), puis 60 € TTC par unité supplémentaire. Pour un multisplit 3 têtes, l'entretien complet démarre à 300 € TTC.",
      },
      {
        heading: "Ce que vous pouvez faire vous-même entre deux entretiens",
        subsections: [
          {
            heading: "Nettoyage des filtres (tous les 2-3 mois)",
            content: [
              "La plupart des unités intérieures ont des filtres amovibles accessibles sans outil. Ouvrez la trappe frontale, sortez les filtres, rincez-les sous l'eau tiède (sans détergent agressif) et laissez sécher avant de les remettre en place. Cette opération simple prend 5 minutes et améliore significativement la qualité de l'air.",
            ],
          },
          {
            heading: "Vérification de l'unité extérieure",
            content: [
              "Assurez-vous que l'unité extérieure n'est pas obstruée par des végétaux, des feuilles ou un objet quelconque. Un espace libre d'au moins 30 cm tout autour est nécessaire. En hiver, vérifiez qu'elle ne s'est pas retrouvée sous une couche de neige ou de glace.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        question: "L'entretien est-il obligatoire légalement ?",
        answer:
          "En France, l'entretien annuel n'est pas une obligation légale pour les particuliers (contrairement aux chaudières). Cependant, certains contrats de garantie constructeur le rendent obligatoire pour maintenir la garantie. Pour les professionnels et les ERP, des obligations spécifiques peuvent s'appliquer.",
      },
      {
        question: "Ma garantie constructeur est-elle annulée sans entretien ?",
        answer:
          "Cela dépend du constructeur et du contrat de garantie. Daikin, Mitsubishi et la plupart des grandes marques précisent dans leurs conditions de garantie qu'un entretien régulier par un professionnel qualifié est requis pour maintenir la garantie. En cas de panne, une absence d'entretien peut être invoquée pour refuser la prise en charge.",
      },
      {
        question: "Que faire si la clim sent mauvais ?",
        answer:
          "Une odeur désagréable indique généralement des moisissures dans le bac de condensats ou sur l'évaporateur. C'est résolu lors de l'entretien annuel avec un nettoyage et une désinfection adaptés. En attendant, nettoyez vos filtres et laissez tourner la ventilation seule (sans climatisation) 15 minutes après usage.",
      },
      {
        question: "Proposez-vous des contrats d'entretien pluriannuels ?",
        answer:
          "Oui, nous proposons des contrats d'entretien annuels avec priorité d'intervention et remise sur les dépannages. Contactez-nous pour un devis adapté à votre configuration.",
      },
    ],
    relatedSlugs: [
      "climatisation-reversible-fonctionnement",
      "prix-climatisation-ile-de-france-2025",
      "climatisation-gainable",
    ],
  },

  {
    slug: "climatisation-gainable",
    title: "Climatisation gainable : guide complet pour bien choisir",
    metaTitle: "Climatisation Gainable 2026 : Fonctionnement, Prix & Installation | ClimExpert",
    metaDescription:
      "Climatisation gainable : comment ça marche, dans quels logements l'installer, prix complet en Île-de-France et alternatives si vous n'avez pas de faux-plafond.",
    keywords:
      "climatisation gainable, clim gainable prix, gainable faux plafond, climatisation invisible, gainable maison ile de france",
    date: "2025-04-10",
    readTime: 6,
    category: "Guide technique",
    heroImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Bouche de soufflage d'une climatisation gainable dans un plafond",
    intro:
      "La climatisation gainable est la solution la plus discrète du marché : totalement invisible une fois installée, elle climatise l'ensemble d'une maison depuis un seul groupe caché dans les combles ou un faux-plafond. Idéale pour les maisons individuelles en Île-de-France, elle représente un investissement plus conséquent mais offre un confort incomparable.",
    sections: [
      {
        heading: "Principe de fonctionnement",
        content: [
          "Contrairement à un système split qui dispose d'unités intérieures apparentes dans chaque pièce, la climatisation gainable centralise toute la distribution dans un réseau de gaines (conduits) dissimulées dans les combles ou dans un faux-plafond. L'air traité est soufflé via des bouches de ventilation encastrées dans chaque pièce, et repris par une bouche de retour centralisée.",
          "L'unité intérieure (caisson gainable) est posée dans les combles ou dans un espace technique. Elle n'est jamais visible. Seules les bouches de soufflage (15 × 15 cm environ) sont visibles au plafond, et peuvent être choisies en blanc ou peintes dans la couleur du plafond.",
        ],
      },
      {
        heading: "Avantages du gainable",
        list: [
          "Totalement invisible : aucune unité intérieure dans les pièces",
          "Silence optimal : le groupe est dans les combles, loin des espaces de vie",
          "Distribution homogène : chaque pièce reçoit la même température",
          "Une seule unité extérieure pour toute la maison",
          "Intégration possible d'un système de ventilation (VMC)",
          "Valeur immobilière accrue du bien",
        ],
      },
      {
        heading: "Conditions d'installation",
        subsections: [
          {
            heading: "Le faux-plafond ou les combles accessibles",
            content: [
              "C'est la condition principale. Il faut un espace technique d'au moins 35 à 40 cm de hauteur pour faire passer les gaines et placer le caisson. Dans une maison avec combles perdus, c'est en général aisé. Dans un appartement ou une maison sans hauteur disponible, il faut créer un faux-plafond (ce qui réduit la hauteur sous plafond de 30 à 40 cm).",
            ],
          },
          {
            heading: "La surface à traiter",
            content: [
              "Le gainable est rentable et cohérent à partir d'une surface de 80 à 100 m². En dessous, un multisplit sera généralement plus économique et plus simple à installer.",
            ],
          },
          {
            heading: "Peut-on installer du gainable sans faux-plafond ?",
            content: [
              "Oui, en créant un couloir technique ou en faisant passer les gaines dans les combles. Cette solution est réalisable mais nécessite une visite technique préalable pour évaluer la faisabilité. Des gaines apparentes gainées dans un habillage bois ou PVC peuvent aussi être une solution esthétique.",
            ],
          },
        ],
      },
      {
        heading: "Prix d'une climatisation gainable en Île-de-France",
        content: [
          "Le gainable est l'investissement le plus important parmi les solutions de climatisation, mais il reste compétitif rapporté au coût par m² climatisé.",
        ],
        table: {
          headers: ["Surface maison", "Configuration", "Prix TTC (pose incluse)"],
          rows: [
            ["80 – 100 m²", "Gainable monozone", "4 000 € – 6 000 €"],
            ["100 – 150 m²", "Gainable multizone (2 zones)", "6 000 € – 8 500 €"],
            ["150 – 200 m²", "Gainable multizone (3+ zones)", "8 000 € – 12 000 €"],
            ["200 m² et +", "Gainable double groupe", "12 000 € – 18 000 €"],
          ],
        },
        highlight:
          "Ces prix incluent la fourniture et la pose du caisson gainable, des gaines, des bouches de soufflage et de l'unité extérieure. La création d'un faux-plafond (si nécessaire) est à ajouter selon la surface.",
      },
      {
        heading: "Gainable vs multisplit : que choisir ?",
        table: {
          headers: ["Critère", "Gainable", "Multisplit"],
          rows: [
            ["Visibilité", "Invisible", "Unités dans chaque pièce"],
            ["Silence", "Excellent (groupe caché)", "Bon (unités silencieuses)"],
            ["Prix", "4 000 – 18 000 €", "2 800 – 8 000 €"],
            ["Surface recommandée", "100 m² et +", "20 – 150 m²"],
            ["Faux-plafond requis", "Oui (ou combles)", "Non"],
            ["Installation", "1 à 2 jours", "1 jour"],
            ["Entretien", "Annuel (accès combles)", "Annuel (facile)"],
          ],
        },
      },
    ],
    faq: [
      {
        question: "Le gainable peut-il aussi chauffer en hiver ?",
        answer:
          "Oui, les systèmes gainables réversibles fonctionnent comme n'importe quelle climatisation réversible : ils chauffent en hiver et refroidissent en été. Le SCOP d'un gainable de qualité dépasse généralement 4, ce qui en fait un système de chauffage économique.",
      },
      {
        question: "Peut-on gérer les températures pièce par pièce avec un gainable ?",
        answer:
          "Oui, avec un système multizone. Des registres motorisés dans les gaines permettent d'ouvrir ou fermer l'arrivée d'air dans chaque zone. Certains systèmes premium permettent un réglage individuel par pièce via application.",
      },
      {
        question: "Mon appartement au 4e étage peut-il avoir du gainable ?",
        answer:
          "Techniquement possible si un faux-plafond est créable (hauteur sous plafond de 2,70 m minimum pour garder 2,30 m après faux-plafond). En pratique, le gainable est rare en appartement et le multisplit lui est généralement préféré pour des raisons pratiques et de coût.",
      },
    ],
    relatedSlugs: [
      "choisir-climatisation-maison",
      "prix-climatisation-ile-de-france-2025",
      "climatisation-reversible-fonctionnement",
    ],
  },

  {
    slug: "choisir-climatisation-maison",
    title: "Quelle climatisation choisir pour sa maison en Île-de-France ?",
    metaTitle: "Quelle Climatisation Choisir pour une Maison ? Guide 2026 | ClimExpert",
    metaDescription:
      "Comment choisir la bonne climatisation pour votre maison en Île-de-France ? Monosplit, multisplit, gainable ou PAC : guide de choix complet selon votre profil.",
    keywords:
      "quelle climatisation choisir, meilleure climatisation maison, climatisation maison individuelle ile de france, choisir clim maison",
    date: "2025-05-10",
    readTime: 7,
    category: "Guide d'achat",
    heroImage:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Maison individuelle en Île-de-France avec climatisation",
    intro:
      "Il n'existe pas de « meilleure climatisation » universelle : le bon système dépend de votre maison, de votre budget, du nombre de pièces à traiter et de vos priorités (discrétion, économies, confort). Ce guide vous aide à faire le bon choix en 2026.",
    sections: [
      {
        heading: "Les 4 questions à se poser avant tout",
        subsections: [
          {
            heading: "1. Combien de pièces voulez-vous climatiser ?",
            content: [
              "C'est la première variable. Pour 1 seule pièce (chambre, bureau, salon), un monosplit suffit largement. Pour 2 à 4 pièces, le multisplit est la solution la plus économique sur la durée. Pour climatiser toute une maison de manière invisible, le gainable ou la PAC air-eau s'imposent.",
            ],
          },
          {
            heading: "2. Quelle est la surface totale à traiter ?",
            content: [
              "La puissance nécessaire dépend directement de la surface, de l'isolation et de l'exposition. En règle générale, comptez 1 kW de puissance frigorifique pour 10 m² bien isolés, et jusqu'à 1,5 kW pour des pièces mal isolées ou très ensoleillées (plein sud, sous toiture).",
            ],
          },
          {
            heading: "3. Quelle est votre priorité : discrétion ou budget ?",
            content: [
              "Le gainable est la solution la plus discrète mais la plus coûteuse. Le multisplit offre le meilleur rapport qualité/prix pour plusieurs pièces. Le monosplit est l'entrée de gamme la plus accessible. La PAC air-eau est l'investissement le plus important mais avec les meilleures performances en chauffage.",
            ],
          },
          {
            heading: "4. Avez-vous une contrainte architecturale ?",
            content: [
              "Appartement en copropriété : vérification règlement nécessaire, multisplit souvent recommandé. Immeuble haussmannien ou zone ABF : unité extérieure à positionner avec soin. Maison avec combles accessibles : gainable possible. Maison neuve : gainable ou PAC air-eau à intégrer dès la construction.",
            ],
          },
        ],
      },
      {
        heading: "Guide de choix selon votre profil",
        table: {
          headers: ["Votre situation", "Solution recommandée", "Budget estimé"],
          rows: [
            ["Studio ou T2, 1-2 pièces", "Monosplit", "1 500 – 2 500 €"],
            ["Appartement T3-T4, 3-4 pièces", "Multisplit 3 têtes", "3 500 – 5 500 €"],
            ["Maison 4-5 pièces, confort max", "Multisplit 4 têtes", "4 500 – 7 000 €"],
            ["Maison + discrétion totale", "Gainable", "5 000 – 10 000 €"],
            ["Remplacer le chauffage principal", "PAC air-eau", "8 000 – 15 000 €"],
            ["Budget serré, 1 pièce prioritaire", "Monosplit entrée de gamme", "1 500 – 2 000 €"],
          ],
        },
      },
      {
        heading: "Quelle marque choisir ?",
        content: [
          "Pour une maison en Île-de-France, nous recommandons en priorité Daikin et Mitsubishi Electric pour leur fiabilité prouvée sur 15-20 ans, leur réseau SAV solide en France et leurs garanties étendues. Samsung Wind-Free est une excellente option si le confort de diffusion sans courant d'air direct est une priorité.",
          "Évitez les marques sans-nom ou les modèles achetés en ligne sans garantie installateur : en cas de panne, vous n'aurez ni SAV réactif ni pièces détachées disponibles.",
        ],
        highlight:
          "Notre recommandation : Daikin Stylish pour les appartements (design compact), Mitsubishi MSZ-AP pour les maisons (puissance et fiabilité), Daikin Sky Air pour les professionnels.",
      },
      {
        heading: "Comment calculer la puissance nécessaire",
        content: [
          "La puissance se calcule en BTU (British Thermal Units) ou en kW. Pour une estimation rapide :",
        ],
        table: {
          headers: ["Surface de la pièce", "Isolation", "Puissance recommandée"],
          rows: [
            ["Jusqu'à 20 m²", "Bonne", "2 kW (7 000 BTU)"],
            ["20 – 30 m²", "Bonne", "2,5 – 3,5 kW"],
            ["30 – 50 m²", "Bonne", "3,5 – 5 kW"],
            ["50 – 80 m²", "Bonne", "5 – 7 kW"],
            ["Toute surface", "Mauvaise isolation", "+ 30 à 50 % de puissance"],
          ],
        },
        highlight:
          "Ne sur-dimensionnez pas : une climatisation trop puissante démarre et s'arrête trop fréquemment (court-cyclage), ce qui réduit sa durée de vie et augmente la consommation.",
      },
    ],
    faq: [
      {
        question: "Vaut-il mieux acheter le matériel soi-même et ne payer que la pose ?",
        answer:
          "C'est possible mais risqué. Si vous achetez le matériel, la garantie constructeur ne couvre pas les défauts d'installation, et en cas de panne précoce, vous n'aurez aucun recours auprès de l'installateur. En passant par ClimExpert, le matériel et la main-d'œuvre sont couverts par notre garantie globale.",
      },
      {
        question: "La climatisation fait-elle baisser la valeur de la maison ?",
        answer:
          "Au contraire. Une installation propre et de qualité est un argument de vente positif, surtout dans un contexte de réchauffement climatique. Les acheteurs apprécient particulièrement le gainable invisible ou un multisplit discret dans chaque pièce.",
      },
      {
        question: "Combien d'unités extérieures pour une maison de 5 pièces ?",
        answer:
          "Une seule. Le multisplit 4 ou 5 têtes utilise une seule unité extérieure pour desservir toutes les pièces. C'est l'un de ses grands avantages : moins d'impact visuel et une seule place à trouver pour le groupe extérieur.",
      },
      {
        question: "Quelle marque a le meilleur SAV en Île-de-France ?",
        answer:
          "Daikin et Mitsubishi Electric disposent du réseau de techniciens agréés le plus dense en Île-de-France. En cas de panne sur ces marques, les pièces sont disponibles rapidement et les techniciens sont formés. C'est l'une des raisons pour lesquelles nous les recommandons en priorité.",
      },
    ],
    relatedSlugs: [
      "prix-climatisation-ile-de-france-2025",
      "climatisation-gainable",
      "climatisation-reversible-fonctionnement",
    ],
  },
  {
    slug: "installation-climatisation-paris",
    title: "Installation climatisation à Paris : guide complet par arrondissement",
    metaTitle: "Installation Climatisation Paris — Techniciens RGE | ClimExpert",
    metaDescription:
      "Installer une climatisation à Paris : démarches syndic, contraintes haussmanniennes, prix par arrondissement. Techniciens RGE certifiés, devis gratuit 48h.",
    keywords:
      "installation climatisation paris, pose clim paris, technicien climatisation paris, clim appartement paris, syndic climatisation copropriété",
    date: "2026-05-01",
    readTime: 6,
    category: "Installation",
    heroImage:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Immeuble haussmannien Paris — installation climatisation",
    intro:
      "Installer une climatisation à Paris est tout à fait possible, mais demande de respecter quelques règles spécifiques aux immeubles parisiens : accord de syndic, contraintes de façade, passages de gaines dans les murs anciens. Voici tout ce qu'il faut savoir pour mener à bien votre projet dans la capitale.",
    sections: [
      {
        heading: "Spécificités de l'installation à Paris",
        content: [
          "Les immeubles parisiens — souvent haussmanniens ou de l'entre-deux-guerres — présentent des contraintes particulières. Les murs sont épais (30 à 60 cm), les façades sont protégées et la plupart des logements sont en copropriété. Ces facteurs influencent directement le déroulement d'une installation.",
          "La bonne nouvelle : nos techniciens interviennent chaque semaine dans Paris et maîtrisent parfaitement ces contraintes. Nous réalisons régulièrement des installations dans des appartements du 6e, 7e, 16e et 8e arrondissement, tout comme dans les arrondissements populaires du nord et de l'est parisien.",
        ],
      },
      {
        heading: "L'accord de la copropriété : ce que dit la loi",
        content: [
          "Pour poser une unité extérieure (groupe extérieur) sur une façade commune ou un toit en copropriété, une autorisation de l'assemblée générale est nécessaire. Cette obligation est issue de la loi du 10 juillet 1965 sur la copropriété.",
          "En revanche, si l'unité extérieure se trouve sur votre balcon ou terrasse privative et que les travaux ne modifient pas l'aspect extérieur de l'immeuble, une simple déclaration au syndic peut suffire. Nous vous accompagnons dans cette démarche.",
        ],
        highlight:
          "Dans les secteurs sauvegardés et les bâtiments classés (Marais, Île-de-la-Cité, etc.), des restrictions supplémentaires de l'ABF (Architecte des Bâtiments de France) peuvent s'appliquer. Nous vérifions cela lors de notre visite technique.",
      },
      {
        heading: "Prix d'une installation à Paris",
        content: [
          "Les prix à Paris sont légèrement supérieurs à ceux de la banlieue, principalement en raison de la complexité d'accès (stationnement, passages de gaines dans des murs épais, contraintes de copropriété). Comptez une majoration de 5 à 15 % par rapport aux tarifs de banlieue.",
        ],
        table: {
          headers: ["Système", "Surface", "Prix Paris (TTC)"],
          rows: [
            ["Monosplit", "15 – 30 m²", "1 700 € – 2 800 €"],
            ["Multisplit 2 têtes", "2 pièces", "3 200 € – 5 000 €"],
            ["Multisplit 3 têtes", "3 pièces", "4 500 € – 7 000 €"],
            ["Gainable", "Tout l'appartement", "5 000 € – 12 000 €"],
          ],
        },
      },
      {
        heading: "Quelle solution pour votre appartement parisien ?",
        subsections: [
          {
            heading: "Studio et 2 pièces (moins de 40 m²)",
            content: [
              "Le monosplit est la solution idéale. Une seule unité intérieure couvre l'espace principal. L'unité extérieure est posée sur le balcon, la terrasse ou la coursive. Comptez une journée d'installation.",
            ],
          },
          {
            heading: "3 à 4 pièces (40 à 80 m²)",
            content: [
              "Le multisplit 2 ou 3 têtes est la solution la plus adaptée. Une seule unité extérieure alimente 2 ou 3 unités intérieures dans les pièces principales. C'est la solution la plus répandue dans les appartements parisiens.",
            ],
          },
          {
            heading: "Appartement avec faux-plafond (hôtel particulier, duplex)",
            content: [
              "Le gainable est possible si vous disposez d'un faux-plafond d'au moins 25 cm. Invisible et silencieux, il offre un confort optimal. Cette solution est particulièrement appréciée dans les appartements haut de gamme.",
            ],
          },
        ],
      },
    ],
    faq: [
      {
        question: "Peut-on installer une climatisation dans un appartement parisien sans accord du syndic ?",
        answer:
          "Pas si l'unité extérieure est posée sur une partie commune (façade, toit, cour). En revanche, si l'unité est sur votre balcon ou terrasse privative sans modifier l'aspect extérieur, une déclaration au syndic peut suffire. Nous vous accompagnons dans ces démarches.",
      },
      {
        question: "Combien coûte l'installation d'une climatisation à Paris ?",
        answer:
          "Comptez entre 1 700 € et 2 800 € pour un monosplit (1 pièce), entre 3 200 € et 5 000 € pour un multisplit 2 têtes, et à partir de 4 500 € pour un multisplit 3 têtes. Ces prix incluent le matériel, la pose et la mise en service avec TVA à 5,5 %.",
      },
      {
        question: "Combien de temps dure une installation dans un appartement parisien ?",
        answer:
          "Un monosplit se pose en une journée. Un multisplit 2-3 têtes nécessite 1 à 2 jours. Un système gainable peut prendre 2 à 4 jours selon la configuration. Nous gérons les démarches de stationnement pour nos véhicules.",
      },
      {
        question: "Peut-on installer une climatisation dans un immeuble haussmannien ?",
        answer:
          "Oui. Les murs épais sont plus complexes à traverser mais nos techniciens sont équipés pour cela. Dans les secteurs protégés, l'unité extérieure peut être posée en cour intérieure pour préserver l'aspect de la façade côté rue.",
      },
      {
        question: "Intervenez-vous dans tous les arrondissements de Paris ?",
        answer:
          "Oui, nous intervenons dans les 20 arrondissements de Paris. Nos équipes sont basées dans le 15e arrondissement et se déploient rapidement dans tout Paris.",
      },
    ],
    relatedSlugs: [
      "prix-climatisation-ile-de-france-2025",
      "climatisation-appartement-paris",
      "choisir-climatisation-maison",
    ],
  },
  {
    slug: "climatisation-hauts-de-seine-92",
    title: "Climatisation Hauts-de-Seine (92) : installation, entretien et dépannage",
    metaTitle: "Climatisation Hauts-de-Seine 92 — Installation & Dépannage | ClimExpert",
    metaDescription:
      "Installation, entretien et dépannage de climatisation dans les Hauts-de-Seine (92). Boulogne, Neuilly, Levallois, Issy, Courbevoie. Techniciens RGE, devis gratuit.",
    keywords:
      "climatisation hauts-de-seine, installation clim 92, climatisation boulogne-billancourt, clim neuilly, technicien climatisation levallois, dépannage clim 92",
    date: "2026-05-02",
    readTime: 5,
    category: "Zone géographique",
    heroImage:
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Maison Hauts-de-Seine — installation climatisation",
    intro:
      "Les Hauts-de-Seine (92) concentrent une grande densité de logements de qualité : appartements récents, villas, locaux professionnels et résidences haut de gamme. ClimExpert intervient dans tout le département 92 pour l'installation, l'entretien et le dépannage de climatisation.",
    sections: [
      {
        heading: "Nos interventions dans le 92",
        content: [
          "Nous intervenons dans toutes les communes des Hauts-de-Seine : Boulogne-Billancourt, Neuilly-sur-Seine, Levallois-Perret, Issy-les-Moulineaux, Courbevoie, Puteaux, Nanterre, Rueil-Malmaison, Suresnes, Asnières-sur-Seine, Clichy, Antony, Châtenay-Malabry, Clamart, Meudon, Vanves, Montrouge, Malakoff, Bagneux, Fontenay-aux-Roses.",
          "Le 92 est l'un de nos secteurs les plus actifs. La forte densité d'immeubles récents et de villas facilite généralement les installations, et la clientèle professionnelle est nombreuse.",
        ],
      },
      {
        heading: "Types d'installations dans les Hauts-de-Seine",
        subsections: [
          {
            heading: "Appartements et résidences récentes",
            content: [
              "Les immeubles des années 1970–2000, très présents à Boulogne, Levallois ou Issy, disposent souvent de baies vitrées et de balcons qui facilitent la pose d'unités extérieures. Le multisplit est particulièrement adapté aux grands appartements de ces résidences.",
            ],
          },
          {
            heading: "Maisons individuelles et villas",
            content: [
              "Rueil-Malmaison, Sèvres, Meudon et la banlieue sud comptent de nombreuses maisons individuelles. Le gainable y est souvent possible, ainsi que les PAC air-eau pour les maisons disposant d'un espace technique. Nous réalisons des installations complètes en 1 à 3 jours.",
            ],
          },
          {
            heading: "Locaux professionnels et bureaux",
            content: [
              "La Défense et ses environs (Courbevoie, Puteaux, Nanterre) concentrent des milliers de m² de bureaux. Nous proposons des contrats de maintenance adaptés aux locaux professionnels, avec des interventions planifiées pour ne pas perturber l'activité.",
            ],
          },
        ],
      },
      {
        heading: "Délais et tarifs dans le 92",
        content: [
          "Notre délai d'intervention standard est de 48h dans tout le 92. Pour les installations, nous pouvons généralement planifier dans les 2 semaines suivant la validation du devis. Les tarifs sont identiques à ceux pratiqués sur Paris.",
        ],
        highlight:
          "Résidents des Hauts-de-Seine : bénéficiez des mêmes aides que les Parisiens. MaPrimeRénov' et CEE sont accessibles sur tout le département pour les travaux réalisés par un installateur RGE.",
      },
    ],
    faq: [
      {
        question: "Intervenez-vous à Boulogne-Billancourt pour installer une climatisation ?",
        answer:
          "Oui, Boulogne-Billancourt est l'une de nos zones d'intervention principales dans le 92. Nous y réalisons régulièrement des installations monosplit et multisplit dans les appartements et les maisons.",
      },
      {
        question: "Quel délai pour une installation de climatisation dans le 92 ?",
        answer:
          "Après validation du devis, nous planifions l'installation dans les 1 à 2 semaines selon notre agenda. Pour les dépannages, notre délai d'intervention est de 48h maximum.",
      },
      {
        question: "Les prix sont-ils les mêmes que dans Paris ?",
        answer:
          "Oui, nos tarifs sont uniformes sur toute l'Île-de-France. Il n'y a pas de majoration selon la commune. Comptez entre 1 500 € et 2 500 € pour un monosplit, pose et matériel inclus.",
      },
      {
        question: "Proposez-vous des contrats d'entretien pour les copropriétés des Hauts-de-Seine ?",
        answer:
          "Oui. Nous gérons plusieurs contrats de maintenance pour des syndics et gestionnaires immobiliers dans le 92. Ces contrats incluent des visites planifiées pour toutes les unités de la résidence, avec des tarifs dégressifs.",
      },
    ],
    relatedSlugs: [
      "installation-climatisation-paris",
      "prix-climatisation-ile-de-france-2025",
      "entretien-climatisation",
    ],
  },
  {
    slug: "meilleure-marque-climatisation",
    title: "Quelle est la meilleure marque de climatisation en 2025-2026 ?",
    metaTitle: "Meilleure Marque Climatisation 2026 : Daikin, Mitsubishi, Samsung | ClimExpert",
    metaDescription:
      "Comparatif des meilleures marques de climatisation : Daikin, Mitsubishi Electric, Samsung, Fujitsu, LG, Panasonic. Fiabilité, prix, SAV, efficacité énergétique.",
    keywords:
      "meilleure marque climatisation, daikin vs mitsubishi, comparatif marques clim, climatisation fiable, quelle marque clim choisir, climatisation samsung avis",
    date: "2026-05-03",
    readTime: 7,
    category: "Équipement",
    heroImage:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1200&q=85",
    heroAlt: "Unité intérieure climatisation — comparatif marques",
    intro:
      "Daikin, Mitsubishi Electric, Samsung, Fujitsu, LG, Panasonic… Choisir une marque de climatisation peut sembler complexe. Voici notre comparatif basé sur 10 ans d'installations en Île-de-France : fiabilité terrain, efficacité énergétique, facilité d'entretien et réseau SAV.",
    sections: [
      {
        heading: "Le top 3 selon nos techniciens",
        subsections: [
          {
            heading: "1. Daikin — La référence absolue",
            content: [
              "Daikin est la marque que nous recommandons le plus souvent. D'origine japonaise, elle dispose du réseau de techniciens agréés le plus dense en France. Les COP (coefficient de performance) sont parmi les meilleurs du marché (jusqu'à 5,5 pour les modèles haut de gamme). Le SAV est réactif et les pièces sont facilement disponibles.",
              "Gammes recommandées : Daikin Stylish (design), Daikin Emura (premium), Daikin Perfera (rapport qualité/prix). Prix : +15 à +25 % par rapport aux marques d'entrée de gamme, mais la durée de vie et la fiabilité justifient largement l'investissement.",
            ],
          },
          {
            heading: "2. Mitsubishi Electric — L'excellence japonaise",
            content: [
              "Mitsubishi Electric est notre deuxième recommandation. Silencieux (jusqu'à 19 dB en mode nuit), très fiables et dotés d'une excellente technologie inverter. La gamme Kirigamine est particulièrement appréciée pour son design discret.",
              "Points forts : silence de fonctionnement exceptionnel, très bonne fiabilité à long terme, filtre anti-allergènes sur certains modèles. Légèrement plus cher que Daikin sur certaines gammes.",
            ],
          },
          {
            heading: "3. Fujitsu — Le spécialiste du climatique extrême",
            content: [
              "Fujitsu est particulièrement efficace dans les conditions difficiles : fonctionne en chauffage jusqu'à -25°C, idéal pour les régions froides ou les maisons mal isolées. Moins connue du grand public mais très appréciée des professionnels.",
            ],
          },
        ],
      },
      {
        heading: "Comparatif des principales marques",
        table: {
          headers: ["Marque", "Fiabilité", "Efficacité (SEER)", "Prix moyen", "SAV France"],
          rows: [
            ["Daikin", "★★★★★", "Jusqu'à A+++", "€€€", "Excellent"],
            ["Mitsubishi Electric", "★★★★★", "Jusqu'à A+++", "€€€", "Très bon"],
            ["Fujitsu", "★★★★☆", "A++ / A+++", "€€€", "Bon"],
            ["Samsung", "★★★★☆", "A++ / A+++", "€€", "Bon"],
            ["LG", "★★★★☆", "A++ / A+++", "€€", "Bon"],
            ["Panasonic", "★★★★☆", "A++ / A+++", "€€", "Moyen"],
            ["Atlantic", "★★★☆☆", "A+ / A++", "€", "Correct"],
          ],
        },
      },
      {
        heading: "Nos conseils selon votre profil",
        list: [
          "Budget serré (moins de 1 800 € posé) : Samsung Wind-Free ou LG Artcool — bon rapport qualité/prix, design moderne.",
          "Qualité premium, logement haut de gamme : Daikin Emura ou Mitsubishi Electric Kirigamine — design, silence et fiabilité maximaux.",
          "Maison individuelle ou logement mal isolé : Fujitsu ou Daikin — performants jusqu'à -20°C en mode chauffage.",
          "Local professionnel : Mitsubishi Heavy Industries ou Daikin — robustesse et maintenabilité optimales.",
          "Appartement locatif (investissement) : Samsung ou Toshiba — bon rapport durabilité/prix pour un usage modéré.",
        ],
      },
      {
        heading: "Pourquoi ne pas choisir sur le prix seul ?",
        content: [
          "Une climatisation se garde 12 à 20 ans. Sur cette durée, la différence de prix entre une marque d'entrée de gamme et une Daikin ou Mitsubishi représente souvent moins de 10 € par mois. Mais les différences de fiabilité, de consommation électrique et de coûts de maintenance sont bien réelles.",
          "Notre expérience terrain : les marques de premier prix que nous posons représentent une part nettement supérieure de nos interventions de dépannage. C'est pourquoi nous recommandons systématiquement Daikin ou Mitsubishi Electric en premier choix.",
        ],
        highlight:
          "Quelle que soit la marque choisie, une installation par un technicien certifié et un entretien annuel régulier sont les facteurs les plus déterminants pour la durée de vie de votre équipement.",
      },
    ],
    faq: [
      {
        question: "Quelle marque de climatisation est la plus fiable ?",
        answer:
          "Daikin et Mitsubishi Electric sont les deux marques les plus fiables selon notre expérience terrain. Elles dominent largement en termes de longévité et de réseau SAV en France. Sur 10 ans d'installations en Île-de-France, ce sont de loin les marques sur lesquelles nous intervenons le moins pour des pannes.",
      },
      {
        question: "Daikin ou Mitsubishi Electric : laquelle choisir ?",
        answer:
          "Les deux sont excellentes. Daikin est généralement légèrement moins chère et dispose du réseau SAV le plus large. Mitsubishi Electric est imbattable sur le silence de fonctionnement (dès 19 dB) et la qualité de filtration de l'air. Pour un appartement parisien, Mitsubishi Electric est souvent préférable pour le confort acoustique.",
      },
      {
        question: "Samsung est-elle une bonne marque de climatisation ?",
        answer:
          "Oui, Samsung a beaucoup progressé sur sa gamme climatisation. La série Wind-Free est particulièrement appréciée pour son confort (diffusion sans courant d'air froid direct) et son design. Légèrement moins fiable sur le long terme que Daikin ou Mitsubishi Electric, mais très bon rapport qualité/prix.",
      },
      {
        question: "Peut-on faire confiance aux marques moins connues (Gree, Midea) ?",
        answer:
          "Ces marques, souvent d'origine chinoise, ont une qualité variable. Certains modèles sont tout à fait corrects, mais le SAV en France est moins développé et les pièces peuvent être difficiles à trouver. Nous ne les installons pas, car nous ne pouvons pas garantir la même qualité de service après-vente.",
      },
      {
        question: "La marque influence-t-elle le prix de l'entretien annuel ?",
        answer:
          "Non. Notre contrat d'entretien à partir de 180 € TTC/an (1 unité, Paris intramuros) s'applique à toutes les marques. L'entretien est identique quel que soit le fabricant. En revanche, le coût des réparations peut varier : les pièces Daikin et Mitsubishi sont moins chères et plus facilement disponibles.",
      },
    ],
    relatedSlugs: [
      "choisir-climatisation-maison",
      "prix-climatisation-ile-de-france-2025",
      "entretien-climatisation",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelatedArticles(slugs: string[]): Article[] {
  return slugs.map((s) => articles.find((a) => a.slug === s)).filter(Boolean) as Article[];
}
