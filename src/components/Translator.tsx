import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Languages, ArrowRightLeft, Sparkles } from 'lucide-react';
import { generateContent } from '../lib/ai';
import { cn } from '../lib/utils';

export function Translator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'to_medical' | 'to_simple'>('to_medical');
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const prompt = direction === 'to_medical' 
        ? `Translate this simple/student description into professional, academic physiotherapy terminology suitable for clinical documentation (SOAP notes) or exams.
        
Input: "${input}"
        
Output only the translated text, nothing else.`
        : `Translate this complex medical/physiotherapy terminology into simple, plain language suitable for explaining to a patient with no medical background.
        
Input: "${input}"
        
Output only the translated text, nothing else.`;

      const response = await generateContent(prompt, "You are an expert Physiotherapy Terminology Translator.");
      setOutput(response || "");
    } catch (error) {
      console.error("Translation error:", error);
      setOutput("Error translating text.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-8 py-8">
      <div className="text-center">
        <h2 className="font-display font-bold text-4xl uppercase mb-4 flex items-center justify-center gap-4">
          <Languages className="w-10 h-10 text-accent" />
          Terminology Translator
        </h2>
        <p className="font-mono text-sm text-muted-text uppercase tracking-widest">
          Bridge the gap between patient language and clinical documentation
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-surface brutal-border p-1">
          <button
            onClick={() => setDirection('to_medical')}
            className={cn(
              "px-6 py-2 font-mono text-sm uppercase transition-colors",
              direction === 'to_medical' ? "bg-ink text-surface" : "hover:bg-bg"
            )}
          >
            Simple → Medical
          </button>
          <button
            onClick={() => setDirection('to_simple')}
            className={cn(
              "px-6 py-2 font-mono text-sm uppercase transition-colors",
              direction === 'to_simple' ? "bg-ink text-surface" : "hover:bg-bg"
            )}
          >
            Medical → Simple
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <div className="flex flex-col gap-2 h-64">
          <label className="font-mono text-xs uppercase font-bold">Input Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'to_medical' ? "e.g., pain when lifting arm..." : "e.g., Pain during active shoulder abduction, likely involving supraspinatus..."}
            className="flex-1 p-4 bg-surface brutal-border brutal-shadow-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !input.trim()}
            className="w-16 h-16 rounded-full bg-accent text-surface flex items-center justify-center brutal-border brutal-shadow hover:bg-ink transition-colors disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? <Sparkles className="w-6 h-6 animate-spin" /> : <ArrowRightLeft className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex flex-col gap-2 h-64">
          <label className="font-mono text-xs uppercase font-bold">Translated Output</label>
          <div className="flex-1 p-4 bg-bg brutal-border font-sans overflow-y-auto relative">
            {output ? (
              <p className="text-lg">{output}</p>
            ) : (
              <p className="text-muted-text italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center px-4">
                Translation will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
