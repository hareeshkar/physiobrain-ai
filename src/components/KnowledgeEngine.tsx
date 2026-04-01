import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, Layers, Zap, ExternalLink, Tag } from 'lucide-react';
import { generateJson } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

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

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    setQuery(searchQuery);
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
      setResult("Error retrieving information. Please check your connection and API key.");
      setRelated([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="bg-surface brutal-border brutal-shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="font-display font-bold text-2xl uppercase flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent" />
            Evidence Engine
          </h2>
          
          {query && (
            <a 
              href={`https://www.physio-pedia.com/index.php?search=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-bg text-ink px-4 py-2 brutal-border brutal-shadow-sm hover:bg-accent hover:text-surface transition-colors flex items-center gap-2 font-mono text-xs uppercase w-fit"
            >
              <ExternalLink className="w-4 h-4" />
              Search Physiopedia
            </a>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics (e.g., ACL rehab, stroke gait, rotator cuff)..."
              className="flex-1 p-4 bg-bg brutal-border font-sans text-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-ink text-surface px-8 brutal-border brutal-shadow-sm hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? <Zap className="w-6 h-6 animate-pulse" /> : <Search className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex gap-4 mt-2">
            <span className="font-mono text-xs uppercase text-muted-text flex items-center">Complexity:</span>
            {(['beginner', 'exam', 'clinical'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1 text-xs font-mono uppercase brutal-border transition-colors",
                  mode === m ? "bg-accent text-surface" : "bg-surface text-ink hover:bg-bg"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </form>
      </div>

      <div className="flex-1 bg-surface brutal-border brutal-shadow overflow-hidden flex flex-col">
        <div className="p-4 border-b-2 border-ink bg-bg flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h3 className="font-mono text-xs uppercase tracking-widest">Structured Output</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {result ? (
            <div className="max-w-4xl mx-auto">
              <div className="markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
              
              {related.length > 0 && (
                <div className="mt-12 pt-8 border-t-2 border-ink border-dashed">
                  <h4 className="font-mono text-xs uppercase font-bold mb-4 flex items-center gap-2 text-muted-text">
                    <Tag className="w-4 h-4" /> Related Topics
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {related.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => executeSearch(topic)}
                        className="px-4 py-2 bg-bg brutal-border text-sm font-sans hover:bg-ink hover:text-surface transition-colors brutal-shadow-sm"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-text">
              <p className="font-mono text-sm uppercase text-center max-w-md">
                Search for a topic to generate evidence-based notes tailored to your selected complexity level.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
