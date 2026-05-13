import { put, list } from "@vercel/blob";

export interface Author {
  id: string;
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  createdAt: string;
}

const BLOB_PATH = "admin/authors.json";

export async function getAuthors(): Promise<Author[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return [];
    const { blobs } = await list({ prefix: BLOB_PATH, token });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function saveAuthors(authors: Author[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN non configuré");
  await put(BLOB_PATH, JSON.stringify(authors), {
    access: "public",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });
}

export async function createAuthor(data: Omit<Author, "id" | "createdAt">): Promise<Author> {
  const authors = await getAuthors();
  const author: Author = {
    ...data,
    id: `author_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await saveAuthors([...authors, author]);
  return author;
}

export async function updateAuthor(
  id: string,
  data: Partial<Omit<Author, "id" | "createdAt">>
): Promise<Author | null> {
  const authors = await getAuthors();
  const idx = authors.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  authors[idx] = { ...authors[idx], ...data };
  await saveAuthors(authors);
  return authors[idx];
}

export async function deleteAuthor(id: string): Promise<void> {
  const authors = await getAuthors();
  await saveAuthors(authors.filter((a) => a.id !== id));
}
