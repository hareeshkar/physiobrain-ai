import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit, Sparkles, ArrowRight, Layers, FileText, Microscope, Globe,
  History, Clock, PlayCircle, RefreshCw, CheckCircle, Plus, Menu, Home, X
} from 'lucide-react';
import { Simulator } from './Simulator';
import { KnowledgeEngine } from './KnowledgeEngine';
import { Translator } from './Translator';
import { CaseGenerator } from './CaseGenerator';
import { FeedbackView } from './FeedbackView';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';
import {
  getSessionHistory, getActiveSessions, deleteActiveSession, deleteSession,
  SessionHistory, ActiveSession, initDB
} from '../lib/db';
import { Card, FeatureCard, PrimaryButton, SecondaryButton, BottomTabBar } from './ui';

type View = 'dashboard' | 'case-generator' | 'simulator' | 'knowledge' | 'translator' | 'feedback' | 'history';
type MobileTab = 'home' | 'create' | 'history' | 'more';

const PREMADE_MODULES = [
  { name: "Low Back Pain", color: "#C45D3E" },
  { name: "ACL Rehabilitation", color: "#C45D3E" },
  { name: "Stroke Gait Training", color: "#C45D3E" },
  { name: "Rotator Cuff Tendinopathy", color: "#C45D3E" },
  { name: "Pediatric CP Tone Management", color: "#C45D3E" }
];

const FEATURES = [
  {
    icon: Layers,
    title: "Interactive Simulation",
    description: "Roleplay with AI patients who withhold information, require specific questioning, and exhibit realistic behaviors.",
    color: "#C45D3E"
  },
  {
    icon: FileText,
    title: "Book-Style Examination",
    description: "Comprehensive written exams with dynamic question generation based on your parameters. Full rubric feedback.",
    color: "#C45D3E"
  },
  {
    icon: Microscope,
    title: "Evidence Engine",
    description: "Search and synthesize the latest physiotherapy research to support clinical decisions.",
    color: "#C45D3E"
  },
  {
    icon: Globe,
    title: "Medical Translator",
    description: "Convert complex medical terminology into patient-friendly language instantly.",
    color: "#C45D3E"
  }
];

export function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeConfig, setActiveConfig] = useState<CaseConfig | null>(null);
  const [simLaunchMode, setSimLaunchMode] = useState<'fresh' | 'resume'>('fresh');
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [feedbackSession, setFeedbackSession] = useState<{
    id?: string;
    type: 'simulator' | 'exam';
    config: CaseConfig;
    caseDetails?: any;
    messages?: any[];
    clinicalNotes?: string;
    studentAnswers?: string;
    feedback: string;
    diagnosis?: string;
  } | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    initDB().catch(console.error);
    loadHistory();
  }, []);

  // Auto-refresh history when navigating to history tab
  useEffect(() => {
    if (currentView === 'history') {
      loadHistory();
    }
  }, [currentView]);

  const loadHistory = async () => {
    try {
      const [completedSessions, activeSessions] = await Promise.all([
        getSessionHistory(20),
        getActiveSessions(20)
      ]);

      const activeAsHistory = activeSessions.map((s: ActiveSession) => ({
        id: s.id,
        type: s.type,
        config: s.config,
        caseDetails: s.caseDetails,
        messages: s.messages,
        clinicalNotes: s.clinicalNotes,
        studentAnswers: s.studentAnswers,
        feedback: undefined as string | undefined,
        diagnosis: (s.caseDetails as any)?.diagnosis,
        completedAt: s.lastUpdatedAt,
        duration: Math.floor((Date.now() - s.startedAt) / 1000),
        ended: s.ended,
      }));

      const sessionMap = new Map<string, any>();
      activeAsHistory.forEach(s => sessionMap.set(s.id, s));
      completedSessions.forEach(s => sessionMap.set(s.id, s));

      const allSessions = Array.from(sessionMap.values())
        .sort((a, b) => b.completedAt - a.completedAt);

      setHistory(allSessions);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const getSessionStatus = (session: any) => {
    if (!session.ended) return { status: 'ongoing' as const, label: 'Ongoing', color: 'bg-green-100 text-green-700' };
    if (session.ended && !session.feedback) return { status: 'awaiting' as const, label: 'Awaiting', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'completed' as const, label: 'Completed', color: 'bg-accent/10 text-accent' };
  };

  const handleSessionAction = (session: any) => {
    const status = getSessionStatus(session);

    if (status.status === 'ongoing') {
      setSimLaunchMode('resume');
      setResumeSessionId(session.id);
      setActiveConfig(session.config);
      setCurrentView('simulator');
    } else {
      setFeedbackSession({
        id: session.id,
        type: session.type,
        config: session.config,
        caseDetails: session.caseDetails,
        messages: session.messages,
        clinicalNotes: session.clinicalNotes,
        studentAnswers: session.studentAnswers,
        feedback: session.feedback,
        diagnosis: session.diagnosis,
      });
      setCurrentView('feedback');
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  const startQuickSimulation = (module: string) => {
    setSimLaunchMode('fresh');
    setResumeSessionId(null);
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
    setSimLaunchMode('fresh');
    setResumeSessionId(null);
    setActiveConfig(config);
    setCurrentView('simulator');
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === 'home') setCurrentView('dashboard');
    if (tab === 'create') setCurrentView('case-generator');
    if (tab === 'history') setCurrentView('history');
    if (tab === 'more') setShowMoreMenu(true); // Show menu instead of navigating directly
  };

  const renderDesktopNav = () => (
    <header className="hidden lg:block bg-background border-b border-subtle sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentView('dashboard')}
        >
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-accent" />
          </div>
          <h1 className="font-display font-semibold text-2xl text-ink tracking-tight">
            PhysioBrain
          </h1>
        </motion.div>

        <nav className="flex gap-2">
          {[
            { label: 'Create Case', view: 'case-generator' as View },
            { label: 'History', view: 'history' as View },
            { label: 'Evidence Engine', view: 'knowledge' as View },
            { label: 'Translator', view: 'translator' as View }
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-sans transition-all",
                currentView === item.view
                  ? "bg-accent text-white"
                  : "text-muted hover:text-ink hover:bg-subtle"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );

  const renderMobileHeader = () => (
    <header className="lg:hidden bg-background border-b border-subtle sticky top-0 z-40">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-semibold text-lg text-ink">PhysioBrain</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-muted hover:text-ink transition-colors"
          title="Settings"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  // Session Card for history lists
  const SessionCard = ({ session, onAction }: { session: any; onAction: () => void }) => {
    const status = getSessionStatus(session);
    return (
      <div
        className="bg-surface rounded-xl overflow-hidden shadow-card flex cursor-pointer hover:shadow-elevated transition-all"
        onClick={onAction}
      >
        {/* Left accent bar */}
        <div
          className="w-1 flex-shrink-0"
          style={{ backgroundColor: session.type === 'exam' ? '#C45D3E' : '#1A1A1A' }}
        />

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                "inline-block px-2 py-0.5 text-xs font-mono uppercase rounded",
                session.type === 'exam' ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink"
              )}
            >
              {session.type}
            </span>
            <span
              className={cn(
                "inline-block px-2 py-0.5 text-xs font-mono uppercase rounded",
                status.color
              )}
            >
              {status.label}
            </span>
          </div>

          <h4 className="font-display font-semibold text-base text-ink mb-1">{session.config.module}</h4>
          <p className="text-sm text-muted mb-3">
            {session.config.ageGroup} - {session.config.complexity}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            <span className="text-xs text-muted font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(session.duration / 60)}m {session.duration % 60}s
            </span>
            <span className="text-xs text-accent font-mono uppercase flex items-center gap-1">
              {status.status === 'ongoing' && <><PlayCircle className="w-3 h-3" /> Continue</>}
              {status.status === 'awaiting' && <><RefreshCw className="w-3 h-3" /> Generate</>}
              {status.status === 'completed' && <><CheckCircle className="w-3 h-3" /> View</>}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-background h-screen w-full overflow-hidden lg:w-auto">
      {/* Desktop Header */}
      {renderDesktopNav()}

      {/* Mobile Header */}
      {renderMobileHeader()}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden pb-0 lg:pb-0">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10 lg:overflow-visible"
            >
              {/* Hero Section - Editorial Masthead */}
              <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
                {/* Subtle grain texture overlay */}
                <div
                  className="absolute inset-0 opacity-[0.015] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Decorative accent line - vertical bar */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-4 md:left-8 top-20 bottom-20 w-[2px] origin-top"
                  style={{ backgroundColor: '#C45D3E' }}
                />

                {/* Large decorative number */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="absolute right-4 md:right-12 top-24 font-display text-[12rem] md:text-[18rem] leading-none text-subtle/30 font-bold select-none"
                >
                  01
                </motion.div>

                <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 relative z-10">
                  {/* Platform label */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 mb-8 md:mb-12"
                  >
                    <div className="w-8 h-[2px] bg-accent" />
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
                      PhysioBrain.AI
                    </span>
                  </motion.div>

                  {/* Main headline - Editorial masthead style */}
                  <div className="mb-10 md:mb-12">
                    {/* Primary word - massive typography */}
                    <motion.h1
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="font-display font-bold tracking-tight leading-[0.85]"
                    >
                      <span className="block text-[3.75rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[8rem] text-ink">
                        Clinical
                      </span>
                    </motion.h1>

                    {/* Secondary word - terracotta subscript style */}
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-baseline gap-4 mt-2"
                    >
                      <span
                        className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-display font-bold text-accent tracking-tight"
                        style={{ fontStyle: 'italic' }}
                      >
                        Reasoning
                      </span>
                      {/* Decorative dot */}
                      <span className="w-2 h-2 rounded-full bg-accent hidden sm:block" />
                      <span className="text-sm sm:text-base font-mono text-muted uppercase tracking-wider hidden sm:block">
                        Master your diagnostic skills
                      </span>
                    </motion.div>
                  </div>

                  {/* Tagline - only visible on mobile */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-muted mb-8 md:hidden"
                  >
                    Immersive patient simulations powered by advanced AI
                  </motion.p>

                  {/* CTA Buttons - Editorial style */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <PrimaryButton
                      onClick={() => setCurrentView('case-generator')}
                      size="lg"
                      className="gap-2 sm:gap-3"
                    >
                      <span>Begin Session</span>
                      <ArrowRight className="w-5 h-5" />
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => startQuickSimulation('Low Back Pain')}
                      size="lg"
                      className="gap-2 sm:gap-3"
                    >
                      <PlayCircle className="w-5 h-5 text-accent" />
                      <span>Quick Start</span>
                    </SecondaryButton>
                  </motion.div>

                  {/* Bottom accent bar */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-[3px] bg-gradient-to-r from-accent via-accent/50 to-transparent mt-16 md:mt-20"
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              </section>

                  {/* Quick Modules - Horizontal Scroll */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-10"
                  >
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">
                      Quick Modules
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                      {PREMADE_MODULES.map((mod, i) => (
                        <motion.button
                          key={mod.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + i * 0.05 }}
                          onClick={() => startQuickSimulation(mod.name)}
                          className="flex-shrink-0 px-4 py-2.5 bg-surface rounded-full text-sm font-sans text-ink shadow-sm border border-subtle hover:border-accent/30 hover:shadow-md transition-all"
                        >
                          {mod.name}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Platform Features */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mb-10"
                  >
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-4">
                      Platform Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {FEATURES.map((feature, i) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + i * 0.05 }}
                        >
                          <FeatureCard
                            icon={<feature.icon className="w-6 h-6" />}
                            title={feature.title}
                            description={feature.description}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

              {/* Recent Sessions Section */}
              {history.length > 0 && (
                <section className="bg-background py-8">
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-mono uppercase tracking-widest text-muted flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Recent Sessions
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.slice(0, 6).map((session, i) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                        >
                          <SessionCard
                            session={session}
                            onAction={() => handleSessionAction(session)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {currentView === 'case-generator' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10 lg:overflow-visible"
            >
              <CaseGenerator onGenerate={handleGenerateCase} />
            </motion.div>
          )}

          {currentView === 'simulator' && activeConfig && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10"
            >
              <Simulator
                config={activeConfig}
                launchMode={simLaunchMode}
                resumeSessionId={resumeSessionId}
                onExit={() => setCurrentView('dashboard')}
                onComplete={(feedbackSessionData) => {
                  setFeedbackSession(feedbackSessionData);
                  setCurrentView('feedback');
                }}
              />
            </motion.div>
          )}

          {currentView === 'feedback' && feedbackSession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10"
            >
              <FeedbackView
                type={feedbackSession.type}
                config={feedbackSession.config}
                caseDetails={feedbackSession.caseDetails}
                messages={feedbackSession.messages}
                clinicalNotes={feedbackSession.clinicalNotes}
                studentAnswers={feedbackSession.studentAnswers}
                feedback={feedbackSession.feedback}
                diagnosis={feedbackSession.diagnosis}
                sessionId={feedbackSession.id}
                onClose={() => {
                  setFeedbackSession(null);
                  loadHistory();
                  setCurrentView('dashboard');
                }}
                onViewHistory={() => setCurrentView('dashboard')}
              />
            </motion.div>
          )}

          {currentView === 'knowledge' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10"
            >
              <KnowledgeEngine />
            </motion.div>
          )}

          {currentView === 'translator' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10"
            >
              <Translator />
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto overflow-x-hidden pb-10"
            >
              <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <History className="w-5 h-5 text-accent" />
                  </div>
                  <h1 className="font-display font-bold text-3xl text-ink">Session History</h1>
                </div>

                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted">
                    <Clock className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-mono text-lg uppercase">No sessions yet</p>
                    <p className="font-mono text-sm mt-2">Complete a simulation or exam to see it here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <SessionCard
                          session={session}
                          onAction={() => handleSessionAction(session)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        className="lg:hidden flex-shrink-0"
      />

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-surface rounded-t-2xl p-6 space-y-3"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-semibold text-lg text-ink">More Options</h2>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="text-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setCurrentView('knowledge');
                setShowMoreMenu(false);
              }}
              className="w-full px-4 py-3 bg-subtle rounded-lg hover:bg-subtle/80 transition-colors text-left font-sans flex items-center gap-3"
            >
              <Microscope className="w-5 h-5 text-accent" />
              <span>Evidence Engine</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('translator');
                setShowMoreMenu(false);
              }}
              className="w-full px-4 py-3 bg-subtle rounded-lg hover:bg-subtle/80 transition-colors text-left font-sans flex items-center gap-3"
            >
              <Globe className="w-5 h-5 text-accent" />
              <span>Medical Translator</span>
            </button>
            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full px-4 py-3 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors font-sans font-medium mt-4"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}