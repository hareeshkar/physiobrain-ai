import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, FileText, AlertCircle, Clock, BookOpen, PenTool, X, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { generateJson } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaseConfig, BookCaseDetails } from '../types';
import { saveActiveSession, getActiveSessionById, saveSessionToHistory, deleteActiveSession } from '../lib/db';
import { ElegantSpinner } from './ui/ElegantSpinner';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { Card } from './ui/Card';
import { PrimaryButton, GhostButton } from './ui/Button';

interface BookStyleExamProps {
  config: CaseConfig;
  launchMode?: 'fresh' | 'resume';
  resumeSessionId?: string | null;
  onExit: () => void;
  onComplete?: (feedbackData: {
    type: 'exam';
    config: CaseConfig;
    caseDetails: BookCaseDetails | null;
    studentAnswers: string;
    feedback: string;
  }) => void;
}

export function BookStyleExam({
  config,
  launchMode = 'fresh',
  resumeSessionId = null,
  onExit,
  onComplete,
}: BookStyleExamProps) {
  const [examState, setExamState] = useState<'generating' | 'active' | 'error' | 'resuming'>('resuming');
  const [bookCaseDetails, setBookCaseDetails] = useState<BookCaseDetails | null>(null);
  const [studentAnswers, setStudentAnswers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [caseStudyExpanded, setCaseStudyExpanded] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const sessionIdRef = useRef<string>('');
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const resizeAnswerField = useCallback(() => {
    const field = answerRef.current;
    if (!field) return;

    field.style.height = 'auto';
    const maxHeight = window.innerWidth < 768 ? 420 : 520;
    field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`;
    field.style.overflowY = field.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

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

  useEffect(() => {
    resizeAnswerField();
  }, [studentAnswers, resizeAnswerField, bookCaseDetails, examState]);

  useEffect(() => {
    setIsExamSubmitted(false);
    setStudentAnswers('');
    setShowAnswers(false);
    setCaseStudyExpanded(true);
    setExpandedQuestions({});
    setBookCaseDetails(null);
    sessionIdRef.current = '';

    const startExam = async () => {
      if (launchMode === 'resume' && resumeSessionId) {
        try {
          const active = await getActiveSessionById(resumeSessionId);
          if (active && active.type === 'exam') {
            sessionIdRef.current = active.id;
            setBookCaseDetails(active.caseDetails as BookCaseDetails || null);
            setStudentAnswers(active.studentAnswers || '');
            setIsExamSubmitted(Boolean(active.ended));
            setShowAnswers(Boolean(active.ended));
            setExpandedQuestions({});
            setExamState('active');
            return;
          }
        } catch (e) {
          console.error('Failed to resume exam session:', e);
        }
      }

      generateExam();
    };

    startExam();
  }, [config, launchMode, resumeSessionId]);

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
Write 2-3 SHORT paragraphs ONLY.
- Keep the stem simple and student-friendly.
- Focus on the essentials a student needs to answer the questions.
- Do not overload with unnecessary details.
- Keep the case study around 250-400 words.

QUESTIONS REQUIREMENTS:
Generate exactly 5 questions that:
- Use clear, plain language.
- Ask one thing at a time.
- Avoid long, dense, multi-part stems.
- Keep question stems about 40-50 words max when possible.
- Make the questions feel appropriate for a student, not an expert paper.
- Mix marks so the paper feels balanced: a few higher-value reasoning questions and a few shorter questions.
- Total marks = 100
- Include clinical reasoning, not just factual recall.
- If a question is broader, make the marks reflect the complexity, but keep the stem readable.

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
    setIsExamSubmitted(false);
    setStudentAnswers('');
    setShowAnswers(false);
    setCaseStudyExpanded(true);
    setBookCaseDetails(null);
    sessionIdRef.current = '';

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
          const activeSession = await getActiveSessionById(sessionIdRef.current);
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

  // Inline Error Card
  const ErrorCard = () => (
    <Card className="max-w-md mx-auto p-6 text-center">
      <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="text-error w-6 h-6" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">Generation Issue</h3>
      <p className="text-muted text-sm mb-6">
        {errorMessage || "The exam generation is taking longer than expected."}
      </p>
      <div className="flex flex-col gap-3">
        <PrimaryButton onClick={handleRetry} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </PrimaryButton>
        <GhostButton onClick={handleReturnToDashboard} className="w-full">
          Return to Dashboard
        </GhostButton>
      </div>
    </Card>
  );

  // Loading State
  if (examState === 'generating') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="mb-6">
            <ElegantSpinner size="lg" className="mx-auto" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            Generating Examination...
          </h2>
          <p className="text-muted text-sm mb-4">
            Crafting clinical case study and exam questions based on your parameters.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted text-xs mb-6">
            <Clock className="w-4 h-4" />
            <span>This may take up to 5 minutes</span>
          </div>
          {/* Skeleton placeholders for questions */}
          <div className="space-y-3">
            <SkeletonLoader variant="block" height={60} />
            <SkeletonLoader variant="block" height={60} />
            <SkeletonLoader variant="block" height={60} />
          </div>
        </Card>
        {showErrorDialog && <ErrorCard />}
      </div>
    );
  }

  const totalMarks = bookCaseDetails?.questions.reduce((sum, q) => sum + q.marks, 0) || 100;

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6 overflow-hidden">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <FileText className="text-accent w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg">{config.module} Examination</h1>
            <span className="font-mono text-xs text-muted uppercase">{config.questionFocus} • {totalMarks} Marks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExamSubmitted && (
            <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full font-sans text-xs font-medium">
              <CheckCircle className="w-4 h-4" /> Submitted
            </div>
          )}
          <button onClick={handleExitExam} className="w-10 h-10 flex items-center justify-center hover:bg-subtle rounded-full transition-colors">
            <X className="w-5 h-5 text-muted hover:text-ink" />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 p-2 md:p-0">
        {/* Case Study Card - Collapsible */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface rounded-xl shadow-card overflow-hidden">
          <button
            onClick={() => setCaseStudyExpanded(!caseStudyExpanded)}
            className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-subtle/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="font-display font-semibold text-sm">Clinical Case Study</span>
            </div>
            {caseStudyExpanded ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
          </button>

          <AnimatePresence>
            {caseStudyExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 md:p-5 text-sm leading-relaxed markdown-body border-t border-subtle">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{bookCaseDetails?.caseStudy || ''}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Questions Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface rounded-xl shadow-card overflow-hidden">
          <div className="p-3 md:p-4 flex items-center gap-3 border-b border-subtle">
            <PenTool className="w-5 h-5 text-accent" />
            <span className="font-display font-semibold text-sm">Examination Questions</span>
          </div>

          {/* Questions List */}
          <div className="divide-y divide-subtle">
            {bookCaseDetails?.questions.map((q, i) => (
              <div key={q.id} className="hover:bg-subtle/30 transition-colors">
                {(() => {
                  const preview = q.text.length > 120 ? `${q.text.slice(0, 120).trim()}...` : q.text;

                  return (
                <button
                  type="button"
                  onClick={() => setExpandedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className="w-full p-4 md:p-5 flex items-start gap-4 text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-sans font-semibold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-sans text-sm md:text-base leading-relaxed pr-2">
                        {expandedQuestions[q.id] ? q.text : preview}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-accent/10 text-accent font-mono text-xs font-medium rounded-full">
                          {q.marks}
                        </span>
                        {expandedQuestions[q.id] ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                      </div>
                    </div>
                    {!expandedQuestions[q.id] && (
                      <p className="mt-2 text-xs md:text-sm text-muted">
                        Tap to expand and write your answer below.
                      </p>
                    )}
                  </div>
                </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Answer Sheet */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface rounded-xl shadow-card overflow-hidden">
          <div className="p-3 md:p-4 flex items-center justify-between border-b border-subtle gap-3">
            <div className="flex items-center gap-3">
              <PenTool className="w-5 h-5 text-accent" />
              <span className="font-display font-semibold text-sm">Your Answers</span>
            </div>
            <button
              onClick={submitAnswers}
              disabled={isLoading || !studentAnswers.trim() || isExamSubmitted}
              className="bg-accent text-white px-4 py-2 rounded-full font-sans text-sm font-medium shadow-button hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <ElegantSpinner size="sm" className="inline mr-2" />
                  Grading...
                </>
              ) : isExamSubmitted ? (
                <>
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Submitted
                </>
              ) : (
                'Submit Answers'
              )}
            </button>
          </div>
          <textarea
            ref={answerRef}
            value={studentAnswers}
            onChange={(e) => {
              setStudentAnswers(e.target.value);
              resizeAnswerField();
            }}
            placeholder="Write your answers here. Number them 1-5 to match the questions. The box will grow as you type."
            className="w-full p-4 bg-transparent resize-none font-mono text-sm md:text-base leading-relaxed min-h-[240px] md:min-h-[320px] focus:outline-none focus:ring-2 focus:ring-accent/20"
            disabled={isLoading || isExamSubmitted}
          />
        </motion.div>

        {showErrorDialog && (
          <div className="mt-4">
            <ErrorCard />
          </div>
        )}
      </div>
    </div>
  );
}