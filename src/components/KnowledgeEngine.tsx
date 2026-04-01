import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, Tag } from 'lucide-react';
import { generateJson } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ElegantSpinner } from './ui/ElegantSpinner';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { PrimaryButton } from './ui/Button';
import { PillToggle } from './ui';

interface KnowledgeResponse {
  markdownContent: string;
  relatedTopics: string[];
}

export function KnowledgeEngine() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'beginner' | 'exam' | 'clinical'>('clinical');
  const [result, setResult] = useState('');
  const [related, setRelated] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setQuery(searchQuery);
    setError(null);
    setResult('');

    try {
      const prompt = `Provide structured physiotherapy knowledge about: "${searchQuery}".

Target Audience Mode: ${mode.toUpperCase()}
- BEGINNER: Use simple language, explain medical terms, focus on basic understanding.
- EXAM: Use formal academic terminology, focus on key facts, criteria, and standard definitions.
- CLINICAL: Focus on clinical reasoning, evidence-based practice, red flags, and practical application.

Structure the response with these sections (if applicable), using rich Markdown formatting (bolding, bullet points, tables if useful):
1. Overview
2. Key Anatomy / Terminology
3. Assessment Points
4. Red Flags
5. Common Interventions
6. Evidence Summary

Return a JSON object EXACTLY matching this structure:
{
  "markdownContent": "The highly formatted markdown text here...",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]
}`;

      const response = await generateJson<KnowledgeResponse>(prompt, "You are an expert Physiotherapy Knowledge Engine, similar to Physiopedia but adaptive.");
      setResult(response.markdownContent || "");
      setRelated(response.relatedTopics || []);
    } catch (error) {
      console.error("Error fetching knowledge:", error);
      setError(error instanceof Error ? error.message : "Error retrieving information");
      setRelated([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const modeOptions = [
    { value: 'beginner' as const, label: 'Beginner' },
    { value: 'exam' as const, label: 'Exam' },
    { value: 'clinical' as const, label: 'Clinical' },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 px-6 md:px-8 lg:px-12 py-6 md:py-8">
      {/* Header Card */}
      <div className="bg-surface rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="font-display font-semibold text-2xl flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent" />
            Evidence Engine
          </h2>

          {query && (
            <a
              href={`https://www.physio-pedia.com/index.php?search=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted text-sm hover:text-accent transition-colors flex items-center gap-2 font-mono"
            >
              <ExternalLink className="w-4 h-4" />
              Search Physiopedia
            </a>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics (e.g., ACL rehab, stroke gait, rotator cuff)..."
                className="w-full h-[52px] pl-12 pr-4 bg-background border border-subtle rounded-xl font-sans text-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-14 h-[52px] bg-accent text-surface rounded-xl flex items-center justify-center hover:bg-ink transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="font-mono text-xs uppercase text-muted">Complexity:</span>
            <PillToggle
              options={modeOptions}
              value={mode}
              onChange={(value) => setMode(value)}
            />
          </div>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 bg-surface rounded-xl shadow-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-subtle flex items-center gap-2">
          <Tag className="w-4 h-4 text-accent" />
          <h3 className="font-display text-sm uppercase tracking-wider">Structured Output</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-8 pb-32 md:pb-12">
          {isLoading ? (
            <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[40vh]">
              <div className="bg-surface rounded-xl shadow-card p-8 w-full">
                <SkeletonLoader variant="block" className="h-4 w-3/4 mb-4" />
                <SkeletonLoader variant="block" className="h-4 w-1/2 mb-4" />
                <SkeletonLoader variant="block" className="h-4 w-5/6 mb-4" />
                <SkeletonLoader variant="block" className="h-4 w-2/3 mb-6" />
                 <div className="flex flex-col items-center mt-8">
                  <ElegantSpinner size="md" />
                  <p className="mt-4 text-muted font-sans text-sm">
                    Generating evidence-based notes...
                  </p>
                  <p className="text-muted/60 text-xs mt-1">
                    This usually takes 10-30 seconds
                  </p>
                </div>
                <SkeletonLoader variant="text" className="h-4 w-full mb-2" />
                <SkeletonLoader variant="text" className="h-4 w-4/5 mb-2" />
                <SkeletonLoader variant="text" className="h-4 w-3/4" />
              </div>
            </div>
          ) : error ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-surface rounded-xl shadow-card p-6 text-center">
                <p className="text-error mb-4">{error}</p>
                <PrimaryButton onClick={() => executeSearch(query)}>
                  Try Again
                </PrimaryButton>
              </div>
            </div>
          ) : result ? (
            <div className="max-w-4xl mx-auto">
              <div className="markdown-body text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>

              {related.length > 0 && (
                <div className="mt-12 pt-8 border-t border-subtle">
                  <h4 className="font-display text-sm uppercase font-semibold mb-4 flex items-center gap-2 text-muted">
                    <Tag className="w-4 h-4" /> Related Topics
                  </h4>
                  <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
                    {related.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => executeSearch(topic)}
                        className="px-4 py-2 bg-subtle text-sm font-sans hover:bg-accent hover:text-surface transition-colors rounded-full whitespace-nowrap"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted">
              <p className="font-sans text-sm text-center max-w-md">
                Search for a topic to generate evidence-based notes tailored to your selected complexity level.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
