import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Clock, BookOpen, User, Brain, ArrowLeft, X, FileText, MessageSquare, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaseConfig } from '../types';
import { generateContent } from '../lib/ai';
import { getSessionById, saveSessionToHistory } from '../lib/db';

interface FeedbackViewProps {
  type: 'simulator' | 'exam';
  config: CaseConfig;
  caseDetails?: any;
  messages?: any[];
  clinicalNotes?: string;
  studentAnswers?: string;
  feedback?: string; // If provided, show immediately
  diagnosis?: string;
  sessionId?: string;
  onClose: () => void;
}

export function FeedbackView({
  type,
  config,
  caseDetails,
  messages,
  clinicalNotes,
  studentAnswers,
  feedback: initialFeedback,
  diagnosis,
  sessionId,
  onClose,
}: FeedbackViewProps) {
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [isGenerating, setIsGenerating] = useState(!initialFeedback);
  const [error, setError] = useState<string | null>(null);

  // Generate feedback if not provided
  useEffect(() => {
    if (initialFeedback) {
      setFeedback(initialFeedback);
      setIsGenerating(false);
      return;
    }

    const generateFeedback = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        let prompt = '';
        let systemInstruction = '';

        if (type === 'simulator') {
          const conversationHistory = messages?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') || '';

          prompt = `You are an expert, constructive Physiotherapy Clinical Educator evaluating a student's performance in a clinical simulation.

### SIMULATION CONTEXT
- Module: ${config.module}
- Setting: ${config.setting}
- Patient Profile: ${config.ageGroup}, ${config.severity} severity.
- ACTUAL Patient Diagnosis: ${diagnosis}
- Patient Persona/Background: ${caseDetails?.hiddenPersona || 'Not available'}

### STUDENT'S DATA
1. STUDENT'S CLINICAL NOTES:
"""
${clinicalNotes || "(No clinical notes provided)"}
"""

2. CONVERSATION HISTORY:
"""
${conversationHistory || "(No conversation yet)"}
"""

### EVALUATION TASK
Analyze the student's reasoning and provide feedback.

FORMAT YOUR RESPONSE IN MARKDOWN:
### Overall Performance Summary
[Score and summary]

### Subjective & Objective Assessment
[What they asked, what they missed]

### Clinical Reasoning Analysis
[Their hypothesis and reasoning]

### Communication & Bedside Manner
[How they spoke to patient]

### Actionable Next Steps
[2-3 tips for improvement]`;

          systemInstruction = "You are an expert Physiotherapy Clinical Educator.";
        } else {
          // Exam type
          prompt = `You are an expert Physiotherapy Professor grading a student exam.

CONTEXT:
- Module: ${config.module}
- Complexity: ${config.complexity}
- Question Focus: ${config.questionFocus || 'Comprehensive'}

CASE STUDY:
${caseDetails?.caseStudy || 'Not available'}

QUESTIONS & RUBRIC:
${JSON.stringify(caseDetails?.questions || [], null, 2)}

STUDENT ANSWERS:
"""
${studentAnswers || "(No answers provided)"}
"""

TASK: Grade the student's answers fairly and constructively.

FORMAT YOUR RESPONSE IN MARKDOWN:
### Overall Summary
**Final Grade: X/100**
[2-3 sentence encouraging summary]

### Question Feedback
For each question:
**Q{X}** [Score: X/Y]
- ✓ What they got right
- ✗ What they missed
- → Teaching point

### Priority Areas to Improve
[3 specific areas]`;

          systemInstruction = "You are an expert physiotherapy professor grading an exam.";
        }

        const response = await generateContent(prompt, systemInstruction);
        setFeedback(response);

        // Save feedback to session in history if we have a session ID
        if (sessionId) {
          try {
            const session = await getSessionById(sessionId);
            if (session) {
              await saveSessionToHistory({
                ...session,
                feedback: response,
              });
            }
          } catch (e) {
            console.error('Failed to save feedback to session:', e);
          }
        }
      } catch (e: any) {
        console.error('Failed to generate feedback:', e);
        setError(e.message || 'Failed to generate feedback');
      } finally {
        setIsGenerating(false);
      }
    };

    generateFeedback();
  }, [type, config, caseDetails, messages, clinicalNotes, studentAnswers, diagnosis, initialFeedback]);

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* Fixed Header */}
      <header className="p-4 md:p-6 border-b-2 border-ink bg-ink text-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isGenerating ? (
            <RefreshCw className="w-6 h-6 text-accent animate-spin" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-400" />
          )}
          <div>
            <h1 className="font-display font-bold uppercase text-lg">
              {isGenerating ? 'Generating Feedback...' : 'Session Complete'}
            </h1>
            <span className="font-mono text-xs opacity-70">
              {config.module} • {type === 'exam' ? 'Written Exam' : 'Patient Simulation'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-surface text-ink flex items-center justify-center hover:bg-accent hover:text-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {isGenerating ? (
            /* Loading State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-6">
                <RefreshCw className="w-16 h-16 text-accent animate-spin" />
                <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
              </div>
              <h2 className="font-display font-bold text-2xl mb-2">Analyzing Your Performance</h2>
              <p className="font-mono text-sm text-muted-text uppercase">
                This may take a few moments...
              </p>
            </motion.div>
          ) : error ? (
            /* Error State */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface brutal-border brutal-shadow p-6 text-center"
            >
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-accent text-surface px-4 py-2 font-display font-bold uppercase text-sm brutal-border"
              >
                Try Again
              </button>
            </motion.div>
          ) : (
            <>
              {/* Diagnosis Card (Simulator only) */}
              {type === 'simulator' && diagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface brutal-border brutal-shadow p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-accent" />
                    <span className="font-display font-bold uppercase text-sm">Hidden Diagnosis</span>
                  </div>
                  <p className="font-sans text-base">{diagnosis}</p>
                </motion.div>
              )}

              {/* Case Study (Exam only) */}
              {type === 'exam' && caseDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface brutal-border brutal-shadow p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-accent" />
                    <span className="font-display font-bold uppercase text-sm">Case Study</span>
                  </div>
                  <div className="markdown-body text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{caseDetails.caseStudy}</ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* Feedback Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface brutal-border brutal-shadow overflow-hidden"
              >
                <div className="p-4 bg-accent text-surface flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  <span className="font-display font-bold uppercase text-sm">Professor's Feedback</span>
                </div>
                <div className="p-5 markdown-body text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                </div>
              </motion.div>

              {/* Student Work Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface brutal-border brutal-shadow p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  {type === 'simulator' ? (
                    <><MessageSquare className="w-5 h-5 text-accent" /> <span className="font-display font-bold uppercase text-sm">Clinical Notes</span></>
                  ) : (
                    <><FileText className="w-5 h-5 text-accent" /> <span className="font-display font-bold uppercase text-sm">Your Answers</span></>
                  )}
                </div>
                <div className="bg-muted/30 p-4 font-mono text-sm whitespace-pre-wrap">
                  {type === 'simulator' ? clinicalNotes || 'No clinical notes provided' : studentAnswers || 'No answers provided'}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="p-4 border-t-2 border-ink bg-bg shrink-0">
        <div className="flex justify-end max-w-4xl mx-auto">
          <button
            onClick={onClose}
            className="bg-accent text-surface px-6 py-3 font-display font-bold uppercase text-sm brutal-border brutal-shadow hover:bg-ink transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </footer>
    </div>
  );
}