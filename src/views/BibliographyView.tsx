import React, { useState } from 'react';
import { Search, Copy, Check, ExternalLink } from 'lucide-react';
import { Card } from '../components/UI';
import { cn } from '../lib/utils';

interface Props {
  bibData: any[];
}

export const BibliographyView = ({ bibData }: Props) => {
  const [query, setQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filtered = bibData.filter((entry) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const tags = entry.entryTags || {};
    return (
      (tags.title || '').toLowerCase().includes(q) ||
      (tags.author || '').toLowerCase().includes(q) ||
      (tags.year || '').includes(q) ||
      (tags.journal || '').toLowerCase().includes(q) ||
      (tags.publisher || '').toLowerCase().includes(q) ||
      (entry.citationKey || '').toLowerCase().includes(q)
    );
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(`@${key}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openInZotero = (key: string) => {
    window.location.href = `zotero://select/items/bbt:${key}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif italic">Bibliography</h1>
          <p className="text-zinc-500">
            {bibData.length} entr{bibData.length === 1 ? 'y' : 'ies'} — parsed from{' '}
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">bibliography.bib</code>
          </p>
        </div>
        <div className="relative shrink-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={14}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, year…"
            className="pl-9 pr-4 py-2 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 w-64"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {query && (
        <p className="text-sm text-zinc-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((entry, i) => {
          const key = entry.citationKey;
          const tags = entry.entryTags || {};
          return (
            <Card key={i} className="group hover:border-zinc-300 transition-colors">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 font-mono text-[10px] uppercase shrink-0 tracking-wider">
                  {(entry.entryType || 'ref').slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-zinc-900 leading-snug">
                    {tags.title || 'Untitled'}
                  </h4>
                  <p className="text-sm text-zinc-500 mt-0.5 italic truncate">{tags.author}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold items-center">
                    {tags.year && <span>{tags.year}</span>}
                    {(tags.journal || tags.publisher) && (
                      <span className="truncate max-w-[200px]">
                        {tags.journal || tags.publisher}
                      </span>
                    )}
                    {tags.volume && <span>Vol. {tags.volume}</span>}
                    <code className="text-[9px] normal-case font-mono text-zinc-300">{key}</code>
                    <div className="ml-auto flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(key)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        {copiedKey === key ? (
                          <><Check size={12} /> Copied</>
                        ) : (
                          <><Copy size={12} /> Cite</>
                        )}
                      </button>
                      <button
                        onClick={() => openInZotero(key)}
                        className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        <ExternalLink size={12} /> Zotero
                      </button>
                    </div>
                  </div>
                  {tags.annote && (
                    <p className="text-xs text-zinc-500 mt-2 italic border-l-2 border-zinc-100 pl-3">
                      {tags.annote}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-400 italic">
            {bibData.length === 0
              ? 'No bibliography.bib found in your project folder.'
              : 'No entries match your search.'}
          </div>
        )}
      </div>
    </div>
  );
};
