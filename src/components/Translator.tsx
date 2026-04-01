import React, { useState } from 'react';
import { Languages, ArrowRightLeft } from 'lucide-react';
import { generateContent } from '../lib/ai';
import { ElegantSpinner } from './ui/ElegantSpinner';
import { PillToggle } from './ui';

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

  const directionOptions = [
    { value: 'to_medical' as const, label: 'Simple → Medical' },
    { value: 'to_simple' as const, label: 'Medical → Simple' },
  ];

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 px-6 md:px-8 lg:px-12 py-6 md:py-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display font-semibold text-2xl md:text-4xl mb-3 md:mb-4 flex items-center justify-center gap-2 md:gap-4">
            <Languages className="w-8 h-8 md:w-10 md:h-10 text-accent flex-shrink-0" />
            <span>Terminology Translator</span>
          </h2>
          <p className="font-mono text-xs md:text-sm text-muted uppercase tracking-widest">
            Bridge the gap between patient language and clinical documentation
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-2">
          <PillToggle
            options={directionOptions}
            value={direction}
            onChange={(value) => setDirection(value)}
          />
        </div>

        {/* Layout: Vertical on mobile, 3-column on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
          {/* Input Section */}
          <div className="flex flex-col gap-2 min-h-[200px] md:min-h-[300px]">
            <label className="font-mono text-xs uppercase font-medium text-muted">Input Text</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={direction === 'to_medical' ? "e.g., pain when lifting arm..." : "e.g., Pain during active shoulder abduction, likely involving supraspinatus..."}
              className="flex-1 p-3 md:p-4 bg-surface border border-subtle rounded-lg md:rounded-xl font-sans text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          {/* Translate Button - Hidden on mobile, visible in grid on desktop */}
          <div className="hidden md:flex justify-center items-center">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 rounded-full bg-accent text-surface flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? <ElegantSpinner size="sm" /> : <ArrowRightLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-2 min-h-[200px] md:min-h-[300px]">
            <label className="font-mono text-xs uppercase font-medium text-muted">Translated Output</label>
            <div className="flex-1 p-3 md:p-4 bg-surface border border-subtle rounded-lg md:rounded-xl font-sans text-sm md:text-base overflow-y-auto relative">
              {output ? (
                <p className="text-base md:text-lg leading-relaxed">{output}</p>
              ) : (
                <p className="text-muted/60 italic text-center">
                  Translation will appear here...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Translate Button for Mobile */}
        <div className="md:hidden">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !input.trim()}
            className="w-full px-4 py-3 bg-accent text-surface rounded-lg font-sans font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <ElegantSpinner size="sm" /> : <ArrowRightLeft className="w-5 h-5" />}
            <span>{isLoading ? 'Translating...' : 'Translate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
