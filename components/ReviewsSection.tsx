import { getGoogleData, viewReviewsUrl, writeReviewUrl } from "@/lib/google-reviews";
import { GoogleBadge } from "@/components/GoogleBadge";

export async function ReviewsSection() {
  const data = await getGoogleData();

  return (
    <section id="avis" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
            Avis clients
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
            Ils nous font confiance
          </h2>
          <div className="inline-flex items-center gap-3 bg-slate-900 rounded-2xl px-5 py-3">
            <GoogleBadge />
          </div>
        </div>

        {data && data.reviews.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.reviews.map((review, i) => (
                <article
                  key={i}
                  className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    {review.authorPhoto ? (
                      <img
                        src={review.authorPhoto}
                        alt={review.author}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center font-semibold text-white text-sm flex-shrink-0">
                        {review.author.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-tight">{review.author}</p>
                      <p className="text-xs text-slate-400">{review.relativeTime}</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#FBBC04" aria-hidden="true">
                        <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-6">
                    {review.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="text-center mt-10">
              <a
                href={viewReviewsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium hover:underline transition-colors"
              >
                Voir tous les avis sur Google
              </a>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-10 text-center max-w-lg mx-auto">
            <p className="text-slate-600 mb-5 text-sm leading-relaxed">
              Vous avez fait appel a nous recemment ? Votre retour nous aide a grandir et a mieux vous servir.
            </p>
            <a
              href={writeReviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Laisser un avis sur Google
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
