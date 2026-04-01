import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, FileText, AlertCircle, Clock, BookOpen, PenTool, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { generateJson } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaseConfig, BookCaseDetails } from '../types';
import { saveActiveSession, getActiveSession, saveSessionToHistory, deleteActiveSession } from '../lib/db';

interface BookStyleExamProps {
  config: CaseConfig;
  onExit: () => void;
  onComplete?: (feedbackData: {
    type: 'exam';
    config: CaseConfig;
    caseDetails: BookCaseDetails | null;
    studentAnswers: string;
    feedback: string;
  }) => void;
}

export function BookStyleExam({ config, onExit, onComplete }: BookStyleExamProps) {
  const [examState, setExamState] = useState<'generating' | 'active' | 'error' | 'resuming'>('resuming');
  const [bookCaseDetails, setBookCaseDetails] = useState<BookCaseDetails | null>(null);
  const [studentAnswers, setStudentAnswers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [caseStudyExpanded, setCaseStudyExpanded] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  const sessionIdRef = useRef<string>('');
  const initializedRef = useRef(false);

  // Auto-save session to IndexedDB
  const saveSession = useCallback(async () => {
    if (examState !== 'active') return;
    if (!sessionIdRef.current) {
      sessionIdRef.current = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    const session = {
      id: sessionIdRef.current,
      type: 'exam' as const,
      config,
      caseDetails: bookCaseDetails || undefined,
      messages: [],
      clinicalNotes: '',
      studentAnswers,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      ended: false,
    };
    try {
      await saveActiveSession(session);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, [examState, config, bookCaseDetails, studentAnswers]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(saveSession, 1500);
    return () => clearTimeout(timeoutId);
  }, [saveSession]);

  // Check for existing session on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const checkExistingSession = async () => {
      try {
        const existing = await getActiveSession('exam');
        if (existing && existing.config.module === config.module) {
          // Resume existing session
          sessionIdRef.current = existing.id;
          setBookCaseDetails(existing.caseDetails || null);
          setStudentAnswers(existing.studentAnswers || '');
          setExamState('active');

          // If session was ended, go to feedback view instead
          if (existing.ended) {
            if (onComplete) {
              onComplete({
                type: 'exam',
                config: existing.config,
                caseDetails: existing.caseDetails || null,
                studentAnswers: existing.studentAnswers || '',
                feedback: undefined, // FeedbackView will generate
              });
            }
            return;
          }

          // Explicitly save after resuming to update lastUpdatedAt
          saveActiveSession({
            id: existing.id,
            type: 'exam',
            config,
            caseDetails: existing.caseDetails,
            messages: [],
            clinicalNotes: '',
            studentAnswers: existing.studentAnswers || '',
            startedAt: existing.startedAt,
            lastUpdatedAt: Date.now(),
            ended: false,
          });
          return;
        }
      } catch (e) {
        console.error('Failed to check existing session:', e);
      }
      // No existing session - generate new
      generateExam();
    };

    checkExistingSession();
  }, [config]);

  // Generate prompt - more concise case study
  const generatePrompt = useCallback(() => {
    return `You are an expert Physiotherapy Professor creating a written examination.

CASE PARAMETERS:
- Module: ${config.module}
- Patient Age: ${config.ageGroup}
- Severity: ${config.severity}
- Complexity: ${config.complexity}
- Question Focus: ${config.questionFocus || 'Comprehensive'}
- Terminology: ${config.terminology}
${config.specificTopic ? `- Topic: ${config.specificTopic}` : ''}

TASK: Create a concise clinical case study and 5 exam questions totaling exactly 100 marks.

CASE STUDY REQUIREMENTS:
Write 3-4 SHORT paragraphs ONLY:
1. Patient demographics + chief complaint (1 short paragraph)
2. Subjective history - onset, mechanism, symptoms, aggravating/easing factors (1-2 paragraphs)
3. Objective findings - key ROM, strength, special tests, palpation (1 short paragraph)

Keep it BREIF - this is for an exam, not a textbook. 400-600 words MAX.

QUESTIONS REQUIREMENTS:
Generate exactly 5 questions that:
- Align with "${config.questionFocus}" focus
- Total marks = 100
- Include clinical reasoning, not just factual recall

Return valid JSON only:
{
  "caseStudy": "string (markdown, 3-4 short paragraphs, use **bold** for key clinical terms)",
  "questions": [
    {"id": "q1", "text": "string", "marks": number, "expectedAnswer": "string (brief rubric)"}
  ]
}`;
  }, [config]);

  const generateExam = async () => {
    setExamState('generating');
    setErrorMessage(null);

    try {
      const data = await generateJson<BookCaseDetails>(generatePrompt(), "You are an expert physiotherapy professor. Write CONCISE exam cases. 3-4 short paragraphs max. Do not be verbose.");

      if (!data || !data.caseStudy || !Array.isArray(data.questions)) {
        throw new Error("Invalid response structure from AI");
      }

      // Validate total marks sum to 100
      const totalMarks = data.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      if (totalMarks !== 100) {
        const scale = 100 / totalMarks;
        data.questions = data.questions.map(q => ({
          ...q,
          marks: Math.round((q.marks || 0) * scale)
        }));
      }

      setBookCaseDetails(data);
      setExamState('active');

      // Explicitly save to activeSessions immediately after generating
      if (!sessionIdRef.current) {
        sessionIdRef.current = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      await saveActiveSession({
        id: sessionIdRef.current,
        type: 'exam',
        config,
        caseDetails: data,
        messages: [],
        clinicalNotes: '',
        studentAnswers: '',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        ended: false,
      });
    } catch (error: any) {
      console.error("Failed to generate exam:", error);
      setErrorMessage(error.message || "Failed to generate exam. Please try again.");
      setExamState('error');
      setShowErrorDialog(true);
    }
  };

  const handleRetry = () => {
    setShowErrorDialog(false);
    setErrorMessage(null);
    generateExam();
  };

  const handleReturnToDashboard = () => {
    setShowErrorDialog(false);
    onExit();
  };

  const submitAnswers = async () => {
    if (!studentAnswers.trim()) return;
    setIsLoading(true);
    setIsExamSubmitted(true);
    setShowAnswers(true);

    try {
      // Move session from active to history as "ended" (FeedbackView will generate feedback)
      if (sessionIdRef.current) {
        try {
          const activeSession = await getActiveSession('exam');
          if (activeSession && activeSession.id === sessionIdRef.current) {
            const duration = Math.floor((Date.now() - activeSession.startedAt) / 1000);
            await saveSessionToHistory({
              id: activeSession.id,
              type: 'exam',
              config: activeSession.config,
              caseDetails: activeSession.caseDetails,
              messages: [],
              clinicalNotes: '',
              studentAnswers: studentAnswers,
              feedback: undefined, // FeedbackView will generate
              diagnosis: undefined,
              completedAt: Date.now(),
              duration,
              ended: true,
            });
            await deleteActiveSession(sessionIdRef.current);
          }
        } catch (e) {
          console.error('Failed to move session to history:', e);
        }
      }

      // Trigger completion - FeedbackView will generate its own feedback
      if (onComplete) {
        onComplete({
          type: 'exam',
          config,
          caseDetails: bookCaseDetails,
          studentAnswers,
          feedback: undefined, // Let FeedbackView generate
        });
      }
    } catch (error: any) {
      console.error("Error submitting answers:", error);
      setErrorMessage(error.message || "Failed to submit answers. Please try again.");
      setShowErrorDialog(true);
      setIsExamSubmitted(false);
      setShowAnswers(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitExam = () => {
    if (studentAnswers.trim() && !isExamSubmitted) {
      if (confirm('You have unsaved answers. Submit before leaving?')) {
        submitAnswers();
        return;
      }
    }
    onExit();
  };

  // Error Dialog
  const ErrorDialog = () => (
    <AnimatePresence>
      {showErrorDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-surface brutal-border brutal-shadow p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-accent flex items-center justify-center brutal-border">
                <AlertCircle className="text-surface w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Generation Issue</h2>
            </div>
            <p className="text-muted-text mb-2 font-sans">{errorMessage || "The exam generation is taking longer than expected."}</p>
            <p className="text-muted-text mb-8 font-sans text-sm">This process may take up to 5 minutes depending on complexity.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleRetry} className="w-full bg-accent text-surface p-4 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 brutal-border brutal-shadow-sm hover:bg-ink transition-colors group">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" />Try Again
              </button>
              <button onClick={handleReturnToDashboard} className="w-full bg-bg text-ink p-4 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 brutal-border brutal-shadow-sm hover:bg-ink hover:text-surface transition-colors">
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Loading State
  if (examState === 'generating') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="relative mb-6">
          <RefreshCw className="w-16 h-16 text-accent animate-spin" />
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl uppercase mb-2 tracking-tight">Generating Examination...</h2>
        <p className="font-mono text-xs md:text-sm text-muted-text uppercase text-center max-w-md mb-4">
          Crafting clinical case study and exam questions based on your parameters.
        </p>
        <div className="flex items-center gap-2 text-muted-text">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-xs uppercase">This may take up to 5 minutes</span>
        </div>
        <ErrorDialog />
      </div>
    );
  }

  const totalMarks = bookCaseDetails?.questions.reduce((sum, q) => sum + q.marks, 0) || 100;

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6 overflow-hidden">
      <ErrorDialog />

      {/* Header Bar */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent flex items-center justify-center brutal-border">
            <FileText className="text-surface w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold uppercase text-lg tracking-tight">{config.module} Examination</h1>
            <span className="font-mono text-xs text-muted-text uppercase">{config.questionFocus} • {totalMarks} Marks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExamSubmitted && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 brutal-border font-mono text-xs uppercase">
              <CheckCircle className="w-4 h-4" /> Submitted
            </div>
          )}
          <button onClick={handleExitExam} className="w-10 h-10 bg-surface brutal-border flex items-center justify-center hover:bg-ink hover:text-surface transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2 md:p-0">
        {/* Case Study Card - Collapsible */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface brutal-border brutal-shadow">
          <button
            onClick={() => setCaseStudyExpanded(!caseStudyExpanded)}
            className="w-full p-3 md:p-4 flex items-center justify-between bg-bg border-b-2 border-ink hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="font-display font-bold uppercase text-sm tracking-wide">Clinical Case Study</span>
            </div>
            {caseStudyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {caseStudyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-5 text-sm leading-relaxed markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{bookCaseDetails?.caseStudy || ''}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Questions Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface brutal-border brutal-shadow overflow-hidden">
          <div className="p-3 md:p-4 bg-ink text-surface flex items-center gap-3">
            <PenTool className="w-5 h-5 text-accent" />
            <span className="font-display font-bold uppercase text-sm tracking-wide">Examination Questions</span>
          </div>

          {/* Questions Grid */}
          <div className="divide-y divide-muted">
            {bookCaseDetails?.questions.map((q, i) => (
              <div key={q.id} className="p-4 md:p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent text-surface flex items-center justify-center font-display font-bold brutal-border">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm md:text-base leading-relaxed mb-3">{q.text}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase text-muted-text">Marks:</span>
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-accent text-surface font-mono text-xs font-bold brutal-border">
                        {q.marks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Answer Sheet */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface brutal-border brutal-shadow overflow-hidden">
          <div className="p-3 md:p-4 bg-ink text-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool className="w-5 h-5 text-accent" />
              <span className="font-display font-bold uppercase text-sm tracking-wide">Your Answers</span>
            </div>
            <button
              onClick={submitAnswers}
              disabled={isLoading || !studentAnswers.trim() || isExamSubmitted}
              className="bg-accent text-surface px-4 py-2 font-display font-bold uppercase text-xs brutal-border brutal-shadow-sm hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Grading...' : isExamSubmitted ? 'Submitted' : 'Submit Answers'}
            </button>
          </div>
          <textarea
            value={studentAnswers}
            onChange={(e) => setStudentAnswers(e.target.value)}
            placeholder="Write your answers here. Number them 1-5 to match the questions. Be concise but thorough."
            className="w-full p-4 bg-transparent resize-none font-mono text-sm leading-relaxed min-h-[200px] focus:outline-none"
            disabled={isLoading || isExamSubmitted}
          />
        </motion.div>

              </div>
    </div>
  );
}