import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, BookOpen, Languages, LogOut, BrainCircuit, Settings2, Sparkles, ArrowRight, Layers, Zap, FileText, Microscope, Globe } from 'lucide-react';
import { Simulator } from './Simulator';
import { KnowledgeEngine } from './KnowledgeEngine';
import { Translator } from './Translator';
import { CaseGenerator } from './CaseGenerator';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';

type View = 'dashboard' | 'case-generator' | 'simulator' | 'knowledge' | 'translator';

const PREMADE_MODULES = [
  { name: "Low Back Pain", icon: "spine", color: "#FF3366" },
  { name: "ACL Rehabilitation", icon: "sports", color: "#00D4AA" },
  { name: "Stroke Gait Training", icon: "neuro", color: "#6B5CE7" },
  { name: "Rotator Cuff Tendinopathy", icon: "msk", color: "#FF8C42" },
  { name: "Pediatric CP Tone Management", icon: "peds", color: "#00B4D8" }
];

const FEATURES = [
  {
    icon: Layers,
    title: "Interactive Simulation",
    description: "Roleplay with AI patients who withhold information, require specific questioning, and exhibit realistic behaviors.",
    color: "#FF3366"
  },
  {
    icon: FileText,
    title: "Book-Style Examination",
    description: "Comprehensive written exams with dynamic question generation based on your parameters. Full rubric feedback.",
    color: "#00D4AA"
  },
  {
    icon: Microscope,
    title: "Evidence Engine",
    description: "Search and synthesize the latest physiotherapy research to support clinical decisions.",
    color: "#6B5CE7"
  },
  {
    icon: Globe,
    title: "Medical Translator",
    description: "Convert complex medical terminology into patient-friendly language instantly.",
    color: "#FF8C42"
  }
];

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeConfig, setActiveConfig] = useState<CaseConfig | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('physiobrain_api_key');
    window.location.reload();
  };

  const startQuickSimulation = (module: string) => {
    setActiveConfig({
      caseStyle: 'interactive',
      module,
      setting: 'Outpatient Clinic',
      ageGroup: 'Middle-Aged (36-64)',
      severity: 'Sub-acute / Moderate Irritability',
      complexity: 'Standard (Single Pathology)',
      terminology: 'Intermediate',
      specificTopic: ''
    });
    setCurrentView('simulator');
  };

  const handleGenerateCase = (config: CaseConfig) => {
    setActiveConfig(config);
    setCurrentView('simulator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 bg-ink text-surface p-4 md:p-6 flex justify-between items-center border-b-4 border-accent">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-surface text-ink flex items-center justify-center brutal-border relative overflow-hidden">
            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 relative z-10" />
            <motion.div
              className="absolute inset-0 bg-accent"
              initial={{ scale: 0 }}
              animate={{ scale: hoveredFeature === -1 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <h1 className="font-display font-bold text-xl md:text-2xl tracking-tighter uppercase hidden sm:block">
            Physio<span className="text-accent">Brain</span><span className="text-accent">.AI</span>
          </h1>
        </motion.div>

        <nav className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar">
          {[
            { label: 'Create Case', view: 'case-generator' as View },
            { label: 'Evidence Engine', view: 'knowledge' as View },
            { label: 'Translator', view: 'translator' as View }
          ].map((item, i) => (
            <motion.button
              key={item.view}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setCurrentView(item.view)}
              className={cn(
                "font-mono text-[10px] md:text-sm uppercase hover:text-accent transition-colors whitespace-nowrap",
                currentView === item.view && "text-accent"
              )}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleLogout}
          className="text-muted-text hover:text-accent transition-colors ml-2 md:ml-4"
          title="Clear API Key"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-full"
            >
              {/* Hero Section - Dramatic Editorial Design */}
              <section className="relative min-h-[calc(100vh-80px)] overflow-hidden">
                {/* Background Geometric Pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Accent Shapes */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute top-20 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="absolute bottom-20 left-10 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-3xl"
                />

                <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-8 md:pt-16 pb-12">
                  {/* Top Tag */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-ink text-surface px-4 py-2 mb-6 md:mb-8"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest">Clinical Reasoning Platform</span>
                  </motion.div>

                  {/* Main Hero Text */}
                  <div className="mb-8 md:mb-12">
                    <motion.h2
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="font-display font-bold leading-[0.9] tracking-tighter mb-4"
                    >
                      <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-ink">
                        MASTER
                      </span>
                      <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-accent">
                        CLINICAL
                      </span>
                      <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-ink">
                        REASONING
                      </span>
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="font-sans text-base md:text-lg lg:text-xl text-muted-text max-w-xl ml-1"
                    >
                      Immersive patient simulations and comprehensive assessments powered by advanced AI.
                    </motion.p>
                  </div>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-12 md:mb-16"
                  >
                    <motion.button
                      onClick={() => setCurrentView('case-generator')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group bg-accent text-surface px-6 md:px-8 py-4 md:py-5 brutal-border brutal-shadow flex items-center justify-between gap-4"
                    >
                      <div className="text-left">
                        <span className="block font-display font-bold text-xl md:text-2xl uppercase leading-tight">Custom Case</span>
                        <span className="block font-mono text-[10px] md:text-xs uppercase opacity-70">Build Your Scenario</span>
                      </div>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </motion.button>

                    <motion.button
                      onClick={() => startQuickSimulation('Low Back Pain')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group bg-surface text-ink px-6 md:px-8 py-4 md:py-5 brutal-border brutal-shadow flex items-center justify-between gap-4"
                    >
                      <div className="text-left">
                        <span className="block font-display font-bold text-xl md:text-2xl uppercase leading-tight">Quick Start</span>
                        <span className="block font-mono text-[10px] md:text-xs uppercase opacity-70">Jump Right In</span>
                      </div>
                      <Zap className="w-6 h-6 text-accent" />
                    </motion.button>
                  </motion.div>

                  {/* Quick Module Cards */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mb-12 md:mb-16"
                  >
                    <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-text mb-4 md:mb-6">
                      Quick Modules
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                      {PREMADE_MODULES.map((mod, i) => (
                        <motion.button
                          key={mod.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + i * 0.1 }}
                          whileHover={{ y: -4 }}
                          onClick={() => startQuickSimulation(mod.name)}
                          className="group relative bg-surface p-3 md:p-4 brutal-border brutal-shadow text-left overflow-hidden"
                        >
                          <div
                            className="absolute top-0 left-0 w-full h-1 group-hover:h-full transition-all duration-300"
                            style={{ backgroundColor: mod.color }}
                          />
                          <div className="relative">
                            <span className="block font-display font-bold text-xs md:text-sm uppercase leading-tight mb-1">{mod.name}</span>
                            <span className="font-mono text-[9px] md:text-[10px] uppercase opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Start <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Features Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-muted-text mb-4 md:mb-6">
                      Platform Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {FEATURES.map((feature, i) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.3 + i * 0.1 }}
                          onHoverStart={() => setHoveredFeature(i)}
                          onHoverEnd={() => setHoveredFeature(null)}
                          className={cn(
                            "relative bg-surface p-4 md:p-6 brutal-border brutal-shadow transition-all duration-300",
                            hoveredFeature === i && "bg-ink text-surface"
                          )}
                        >
                          <div
                            className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 flex items-center justify-center brutal-border"
                            style={{
                              backgroundColor: hoveredFeature === i ? feature.color : feature.color + '20',
                              color: hoveredFeature === i ? '#FFFFFF' : feature.color
                            }}
                          >
                            <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                          <h4 className={cn(
                            "font-display font-bold text-base md:text-lg uppercase leading-tight mb-2 transition-colors",
                            hoveredFeature === i ? "text-surface" : "text-ink"
                          )}>
                            {feature.title}
                          </h4>
                          <p className={cn(
                            "font-sans text-xs md:text-sm leading-relaxed transition-colors",
                            hoveredFeature === i ? "text-surface/80" : "text-muted-text"
                          )}>
                            {feature.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg to-transparent" />
              </section>
            </motion.div>
          )}

          {currentView === 'case-generator' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto"
            >
              <CaseGenerator onGenerate={handleGenerateCase} />
            </motion.div>
          )}

          {currentView === 'simulator' && activeConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]"
            >
              <Simulator config={activeConfig} onExit={() => setCurrentView('dashboard')} />
            </motion.div>
          )}

          {currentView === 'knowledge' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]"
            >
              <KnowledgeEngine />
            </motion.div>
          )}

          {currentView === 'translator' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]"
            >
              <Translator />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
