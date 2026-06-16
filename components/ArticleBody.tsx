import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Rendu du corps d'article en Markdown, stylé pour reprendre l'apparence
 * des anciennes sections (titres, encarts, tableaux, listes).
 */
export default function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="text-2xl font-bold text-slate-900 mb-5 mt-12 first:mt-0 tracking-tight border-b border-slate-100 pb-3">{children}</h2>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-slate-900 mb-5 mt-12 first:mt-0 tracking-tight border-b border-slate-100 pb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-slate-600 leading-relaxed mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-4 pl-5 list-disc marker:text-sky-500 space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 pl-5 list-decimal marker:text-sky-500 space-y-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-slate-600 leading-relaxed pl-1">{children}</li>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-sky-600 underline underline-offset-2 hover:text-sky-700 transition-colors">{children}</a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="my-5 bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sky-800 text-sm leading-relaxed [&>p]:mb-0 [&>p]:text-sky-800">{children}</blockquote>
        ),
        hr: () => <hr className="my-8 border-slate-100" />,
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#0B1120]">{children}</thead>,
        th: ({ children }) => (
          <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">{children}</th>
        ),
        td: ({ children }) => <td className="px-4 py-3 text-slate-700">{children}</td>,
        code: ({ children }) => (
          <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[0.9em] font-mono">{children}</code>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
