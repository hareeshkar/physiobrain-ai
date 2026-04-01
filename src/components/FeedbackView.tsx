import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, X, FileText, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CaseConfig } from '../types';
import { generateContent } from '../lib/ai';
import { getSessionById, saveSessionToHistory } from '../lib/db';
import { ElegantSpinner } from './ui/ElegantSpinner';
import { PrimaryButton } from './ui/Button';
import { Card } from './ui';

interface FeedbackViewProps {
  type: 'simulator' | 'exam';
  config: CaseConfig;
  caseDetails?: any;
  messages?: any[];
  clinicalNotes?: string;
  studentAnswers?: string;
  feedback?: string;
  diagnosis?: string;
  sessionId?: string;
  onClose: () => void;
  onViewHistory?: () => void;
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
  onViewHistory,
}: FeedbackViewProps) {
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [isGenerating, setIsGenerating] = useState(!initialFeedback);
  const [error, setError] = useState<string | null>(null);

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
  }, [type, config, caseDetails, messages, clinicalNotes, studentAnswers, diagnosis, initialFeedback, sessionId]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <header className="p-4 md:p-6 border-b border-subtle bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isGenerating ? (
            <ElegantSpinner size="sm" />
          ) : (
            <CheckCircle className="w-6 h-6 text-accent" />
          )}
          <div>
            <h1 className="font-sans font-semibold text-lg">
              {isGenerating ? 'Generating Feedback...' : 'Session Complete'}
            </h1>
            <span className="font-mono text-xs text-muted">
              {config.module} • {type === 'exam' ? 'Written Exam' : 'Patient Simulation'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="px-3 py-2 rounded-lg bg-subtle text-muted hover:bg-accent/10 hover:text-ink transition-colors text-xs"
            >
              View History
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 bg-subtle text-ink rounded-full flex items-center justify-center hover:bg-accent hover:text-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ElegantSpinner size="lg" />
              <h2 className="font-display text-2xl mt-6 mb-2">Analyzing Your Performance</h2>
              <p className="font-mono text-sm text-muted uppercase tracking-wider">
                This may take a moment...
              </p>
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <p className="text-error mb-4">{error}</p>
              <PrimaryButton onClick={() => window.location.reload()}>
                Try Again
              </PrimaryButton>
            </Card>
          ) : (
            <>
              {/* Diagnosis Card (Simulator only) */}
              {type === 'simulator' && diagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface rounded-xl shadow-card overflow-hidden"
                >
                  <div className="h-1 bg-accent" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-display font-semibold uppercase text-sm">Hidden Diagnosis</span>
                    </div>
                    <p className="font-sans text-base leading-relaxed">{diagnosis}</p>
                  </div>
                </motion.div>
              )}

              {/* Case Study (Exam only) */}
              {type === 'exam' && caseDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface rounded-xl shadow-card overflow-hidden"
                >
                  <div className="h-1 bg-ink" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-ink/10 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-ink" />
                      </div>
                      <span className="font-display font-semibold uppercase text-sm">Case Study</span>
                    </div>
                    <div className="markdown-body text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{caseDetails.caseStudy}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feedback Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface rounded-xl shadow-card overflow-hidden"
              >
                <div className="h-1 bg-accent" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-display font-semibold uppercase text-sm">Professor's Feedback</span>
                  </div>
                  <div className="markdown-body text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>

              {/* Student Work Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface rounded-xl shadow-card overflow-hidden"
              >
                <div className="h-1 bg-subtle" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    {type === 'simulator' ? (
                      <>
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-accent" />
                        </div>
                        <span className="font-display font-semibold uppercase text-sm">Clinical Notes</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-accent" />
                        </div>
                        <span className="font-display font-semibold uppercase text-sm">Your Answers</span>
                      </>
                    )}
                  </div>
                  <div className="bg-subtle/50 p-4 font-mono text-sm whitespace-pre-wrap rounded-lg leading-relaxed">
                    {type === 'simulator' ? clinicalNotes || 'No clinical notes provided' : studentAnswers || 'No answers provided'}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="p-4 border-t border-subtle bg-surface shrink-0">
        <div className="flex justify-end max-w-4xl mx-auto">
          <PrimaryButton onClick={onClose}>
            Back to Dashboard
          </PrimaryButton>
        </div>
      </footer>
    </div>
  );
}
