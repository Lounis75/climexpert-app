export type GoogleReview = {
  author: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
};

export type GoogleData = {
  rating: number;
  count: number;
  reviews: GoogleReview[];
} | null;

export async function getGoogleData(): Promise<GoogleData> {
  const placeId = process.env.GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placeId || !apiKey) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      rating: data.rating ?? 0,
      count: data.userRatingCount ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviews: (data.reviews ?? []).map((r: any): GoogleReview => ({
        author: r.authorAttribution?.displayName ?? "Client Google",
        authorPhoto: r.authorAttribution?.photoUri,
        rating: r.rating ?? 5,
        text: r.text?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
        publishTime: r.publishTime ?? "",
      })),
    };
  } catch {
    return null;
  }
}

export function writeReviewUrl(placeId?: string): string {
  const id = placeId ?? process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ?? "";
  return `https://search.google.com/local/writereview?placeid=${id}`;
}

export function viewReviewsUrl(placeId?: string): string {
  const id = placeId ?? process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ?? "";
  return `https://search.google.com/local/reviews?placeid=${id}`;
}
