import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Tag, ArrowLeft, ArrowRight, MessageCircle, CheckCircle2, AlertTriangle, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQAccordion from "@/components/FAQAccordion";
import OpenChatButton from "@/components/OpenChatButton";
import { articles, getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import { getDynamicArticleBySlug, getDynamicArticles } from "@/lib/dynamicArticles";
import { getAuthors } from "@/lib/authors";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
  // Dynamic articles render on-demand with ISR (60s cache)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug) ?? await getDynamicArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: { canonical: `https://climexpert.fr/guide-climatisation/${article.slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: `https://climexpert.fr/guide-climatisation/${article.slug}`,
      images: [
        {
          url: article.heroImage.startsWith("http")
            ? article.heroImage
            : `https://climexpert.fr${article.heroImage}`,
          width: 1200,
          height: 630,
          alt: article.heroAlt,
        },
      ],
      type: "article",
      ...(article.author ? { authors: [article.author] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug) ?? await getDynamicArticleBySlug(slug);
  if (!article) notFound();

  const [dynamicAll, allAuthors] = await Promise.all([
    article.relatedSlugs.length > 0 ? getDynamicArticles() : Promise.resolve([]),
    getAuthors(),
  ]);
  const related = getRelatedArticles(article.relatedSlugs).length > 0
    ? getRelatedArticles(article.relatedSlugs)
    : article.relatedSlugs
        .map((s) => dynamicAll.find((a) => a.slug === s))
        .filter(Boolean) as typeof dynamicAll;
  const authorProfile = article.author
    ? allAuthors.find((a) => a.name === article.author)
    : undefined;
  const dateFormatted = new Date(article.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Person", name: article.author ?? "ClimExpert" },
    publisher: {
      "@type": "Organization",
      name: "ClimExpert",
      url: "https://climexpert.fr",
    },
    image: `https://climexpert.fr${article.heroImage}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://climexpert.fr/guide-climatisation/${article.slug}`,
    },
  };

  const faqSchema = article.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
      { "@type": "ListItem", position: 2, name: "Guide Climatisation", item: "https://climexpert.fr/guide-climatisation" },
      { "@type": "ListItem", position: 3, name: article.title, item: `https://climexpert.fr/guide-climatisation/${article.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <Header />
      <main>
        {/* Hero */}
        <section className="relative bg-[#0B1120] pt-28 pb-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
              <Link href="/" className="hover:text-slate-300 transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/guide-climatisation" className="hover:text-slate-300 transition-colors">Guide</Link>
              <span>/</span>
              <span className="text-slate-400 truncate max-w-[200px]">{article.title}</span>
            </nav>

            {/* Category + read time */}
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime} min de lecture
              </span>
              <span className="text-slate-600 text-xs">{dateFormatted}</span>
              {article.author && (
                <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <User className="w-3.5 h-3.5" />
                  {article.author}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-6">
              {article.title}
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-3xl">
              {article.intro}
            </p>
          </div>

          {/* Hero image */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-t-2xl overflow-hidden aspect-[16/7]">
              <Image
                src={article.heroImage}
                alt={article.heroAlt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/40 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        {/* Article body */}
        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose-article">
              {article.sections.map((section, si) => (
                <div key={si} className="mb-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-5 tracking-tight border-b border-slate-100 pb-3">
                    {section.heading}
                  </h2>

                  {/* Regular paragraphs */}
                  {section.content?.map((para, pi) => (
                    <p key={pi} className="text-slate-600 leading-relaxed mb-4">
                      {para}
                    </p>
                  ))}

                  {/* Highlight box */}
                  {section.highlight && (
                    <div className="my-5 flex gap-3 bg-sky-50 border border-sky-100 rounded-2xl p-4">
                      <AlertTriangle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sky-800 text-sm leading-relaxed">{section.highlight}</p>
                    </div>
                  )}

                  {/* Table */}
                  {section.table && (
                    <div className="my-6 overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#0B1120]">
                            {section.table.headers.map((h, hi) => (
                              <th
                                key={hi}
                                className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, ri) => (
                            <tr
                              key={ri}
                              className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}
                            >
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`px-4 py-3 text-slate-700 ${
                                    ci === 0 ? "font-medium text-slate-900" : ""
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* List */}
                  {section.list && (
                    <ul className="my-4 space-y-2">
                      {section.list.map((item, li) => (
                        <li key={li} className="flex items-start gap-2.5 text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Subsections */}
                  {section.subsections?.map((sub, subi) => (
                    <div key={subi} className="mt-6 mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        {sub.heading}
                      </h3>
                      {sub.content.map((para, pi) => (
                        <p key={pi} className="text-slate-600 leading-relaxed mb-3">
                          {para}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Inline CTA */}
            <div className="my-10 bg-[#0B1120] rounded-3xl p-8 text-center">
              <p className="text-white font-semibold text-lg mb-2">
                Un projet de climatisation en Île-de-France ?
              </p>
              <p className="text-slate-400 text-sm mb-6">
                Obtenez une estimation gratuite en 2 minutes avec Alex, notre assistant expert.
              </p>
              <OpenChatButton className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" />
                Obtenir une estimation gratuite
              </OpenChatButton>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQAccordion
          title={`Questions fréquentes — ${article.category}`}
          items={article.faq}
        />

        {/* Carte auteur */}
        {authorProfile && (
          <section className="py-8 bg-white border-t border-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Rédigé par</p>
              <div className="flex items-start gap-4 bg-slate-50 rounded-2xl border border-slate-100 p-5">
                {authorProfile.photo ? (
                  <Image
                    src={authorProfile.photo}
                    alt={authorProfile.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0 text-sky-400 font-bold text-lg">
                    {authorProfile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{authorProfile.name}</p>
                  <p className="text-sky-600 text-sm">{authorProfile.role}</p>
                  {authorProfile.bio && (
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{authorProfile.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Services liés */}
        <section className="py-10 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Nos services en Île-de-France</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { href: "/installation", label: "Installation", desc: "Monosplit, multisplit, gainable — à partir de 1 500 €" },
                { href: "/entretien", label: "Entretien annuel", desc: "Contrat de maintenance à partir de 150 €/unité/an" },
                { href: "/depannage", label: "Dépannage", desc: "Intervention sous 48h, toutes marques, 7j/7" },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-sky-200 hover:shadow-sm transition-all group"
                >
                  <p className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-sky-600 transition-colors">{s.label}</p>
                  <p className="text-slate-400 text-xs leading-snug">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Articles liés */}
        {related.length > 0 && (
          <section className="py-16 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-900 mb-8">Articles liés</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/guide-climatisation/${rel.slug}`}
                    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-sky-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={rel.heroImage}
                        alt={rel.heroAlt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-sky-500 font-medium">{rel.category}</span>
                      <p className="text-sm font-semibold text-slate-900 mt-1 leading-snug group-hover:text-sky-600 transition-colors">
                        {rel.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rel.readTime} min
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to guide */}
        <section className="py-8 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link
              href="/guide-climatisation"
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tous les guides
            </Link>
            <OpenChatButton className="flex items-center gap-2 text-sm text-sky-500 hover:text-sky-400 font-medium transition-colors">
              Demander un devis
              <ArrowRight className="w-4 h-4" />
            </OpenChatButton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
