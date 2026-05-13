import { getGoogleData, viewReviewsUrl, writeReviewUrl } from "@/lib/google-reviews";

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span aria-label={`${rating.toFixed(1)} sur 5`} className="inline-flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < full ? "#FBBC04" : "#E5E7EB"}
          aria-hidden="true"
        >
          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193z" />
        </svg>
      ))}
    </span>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 3.4 29.6 1.5 24 1.5 11.8 1.5 2 11.3 2 23.5S11.8 45.5 24 45.5 46 35.7 46 23.5c0-1-.1-2-.4-3z" />
      <path fill="#FF3D00" d="M5.3 14.7l6.6 4.8C13.7 15 18.4 12 24 12c3.3 0 6.3 1.2 8.6 3.3l5.7-5.7C34.6 6.4 29.6 4.5 24 4.5 16.1 4.5 9.2 8.9 5.3 14.7z" />
      <path fill="#4CAF50" d="M24 45.5c5.5 0 10.4-1.8 14.1-5l-6.5-5.3C29.4 36.7 26.8 37.5 24 37.5c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.2 41 16.1 45.5 24 45.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.5 5.3c-.5.4 7.2-5.3 7.2-15.1 0-1-.1-2-.4-3z" />
    </svg>
  );
}

export async function GoogleBadge() {
  const data = await getGoogleData();

  if (!data || data.count < 5) {
    return (
      <a
        href={writeReviewUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <GoogleG />
        <span>Premiers avis en cours sur Google</span>
      </a>
    );
  }

  return (
    <a
      href={viewReviewsUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 group"
    >
      <GoogleG />
      <Stars rating={data.rating} />
      <span className="font-semibold text-white">{data.rating.toFixed(1)}/5</span>
      <span className="text-sm text-slate-400 group-hover:underline">
        sur {data.count} avis Google
      </span>
    </a>
  );
}
