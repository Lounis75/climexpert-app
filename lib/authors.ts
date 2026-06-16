import { r2GetJSON, r2PutJSON } from "@/lib/r2";

export interface Author {
  id: string;
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  createdAt: string;
}

const R2_KEY = "admin/authors.json";

export async function getAuthors(): Promise<Author[]> {
  const data = await r2GetJSON(R2_KEY);
  if (!Array.isArray(data)) return [];
  return data as Author[];
}

async function saveAuthors(authors: Author[]): Promise<void> {
  await r2PutJSON(R2_KEY, authors);
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
