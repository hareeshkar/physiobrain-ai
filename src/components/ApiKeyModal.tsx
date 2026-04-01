import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, ArrowRight } from 'lucide-react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export function ApiKeyModal({ onSave }: ApiKeyModalProps) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      localStorage.setItem('physiobrain_api_key', key.trim());
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, skewX: -5 }}
        animate={{ opacity: 1, y: 0, skewX: 0 }}
        className="w-full max-w-md bg-surface brutal-border brutal-shadow p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-accent flex items-center justify-center brutal-border">
            <KeyRound className="text-surface w-6 h-6" />
          </div>
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Access Key</h2>
        </div>
        
        <p className="text-muted-text mb-8 font-sans">
          PhysioBrain requires a Gemini API key to power its clinical reasoning and simulation engines.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="apiKey" className="text-xs font-mono uppercase font-bold tracking-wider">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 bg-bg brutal-border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="mt-4 w-full bg-ink text-surface p-4 font-display font-bold uppercase tracking-wider flex items-center justify-between brutal-border brutal-shadow-sm hover:bg-accent transition-colors group"
          >
            <span>Initialize System</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
