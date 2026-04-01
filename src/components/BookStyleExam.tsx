import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, FileText, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { generateContent, generateJson } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import { CaseConfig, BookCaseDetails } from '../types';
import { cn } from '../lib/utils';

interface BookStyleExamProps {
  config: CaseConfig;
  onExit: () => void;
}

export function BookStyleExam({ config, onExit }: BookStyleExamProps) {
  const [examState, setExamState] = useState<'generating' | 'active' | 'error'>('generating');
  const [bookCaseDetails, setBookCaseDetails] = useState<BookCaseDetails | null>(null);
  const [studentAnswers, setStudentAnswers] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    generateExam();
  }, [config]);

  const generateExam = async () => {
    setExamState('generating');
    setErrorMessage(null);

    const prompt = `You are an expert Physiotherapy Professor creating a comprehensive written examination.

PARAMETERS:
- Module/Specialty: ${config.module}
- Patient Age Group: ${config.ageGroup}
- Condition Severity: ${config.severity}
- Case Complexity: ${config.complexity}
- Question Focus: ${config.questionFocus || 'Comprehensive'}
- Terminology Level: ${config.terminology}
- Scoring Parameters: ${config.scoringParameters || 'Standard (5 questions, 20 marks each)'}
${config.specificTopic ? `- Specific Topic Focus: ${config.specificTopic}` : ''}

TASK:
Create a detailed, realistic clinical case study and dynamically generate exam questions based strictly on the 'Question Focus' and 'Scoring Parameters'.

REQUIREMENTS:
1. "caseStudy": Write a rich, multi-paragraph clinical case study. Include patient demographics, mechanism of injury / onset, subjective history (aggravating/easing factors, 24-hour pattern), objective examination findings (ROM, strength, special tests, palpation), and any relevant psychosocial factors. Format beautifully with Markdown.
2. "questions": Dynamically generate questions tailored to this specific case study. The questions MUST align with the selected '${config.questionFocus}' and follow the structure dictated by '${config.scoringParameters}'.
3. "marks": Explicitly provide the marks for each question. The total marks across ALL questions MUST sum to exactly 100.
4. "expectedAnswer": Provide a highly detailed rubric/expected answer for each question to guide the grader.

Return ONLY a JSON object matching EXACTLY this structure:
{
  "caseStudy": "string (markdown formatted)",
  "questions": [
    {
      "id": "string (e.g., 'q1')",
      "text": "string (the question text)",
      "marks": number (points for this question),
      "expectedAnswer": "string (detailed rubric)"
    }
  ]
}`;

    try {
      const data = await generateJson<BookCaseDetails>(prompt, "You are an expert physiotherapy professor writing an exam.");

      // Validate the response structure
      if (!data || !data.caseStudy || !Array.isArray(data.questions)) {
        throw new Error("Invalid response structure from AI");
      }

      // Validate total marks sum to 100
      const totalMarks = data.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
      if (totalMarks !== 100) {
        console.warn(`Total marks: ${totalMarks}, expected 100. Adjusting...`);
        // Scale marks to 100 if needed
        const scale = 100 / totalMarks;
        data.questions = data.questions.map(q => ({
          ...q,
          marks: Math.round((q.marks || 0) * scale)
        }));
      }

      setBookCaseDetails(data);
      setExamState('active');
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
    setIsLoading(true);
    setIsExamSubmitted(true);
    try {
      const prompt = `You are an expert, constructive Physiotherapy Professor grading a student's written examination. Your goal is to provide thorough, educational feedback that helps the student understand their mistakes and solidify their clinical reasoning.

### EXAM CONTEXT & PARAMETERS
- Module: ${config.module}
- Case Complexity: ${config.complexity}
- Expected Terminology Level: ${config.terminology}
- Question Focus: ${config.questionFocus}
- Scoring Parameters: ${config.scoringParameters}

### CLINICAL CASE STUDY
${bookCaseDetails?.caseStudy}

### EXAM RUBRIC (Questions & Expected Answers)
${JSON.stringify(bookCaseDetails?.questions, null, 2)}

### STUDENT'S SUBMITTED ANSWERS
"""
${studentAnswers}
"""

### EVALUATION TASK
Grade the student's answers against the rubric. Be fair and constructive. Analyze their thought process based on their answers. If their answer shows good clinical reasoning but misses a minor detail, award partial marks and explain why. If they completely missed the mark, explain the correct clinical reasoning clearly.

FORMAT YOUR RESPONSE IN MARKDOWN:
### Overall Summary
Start with an encouraging overall summary of the student's performance and understanding of the case.
**Final Grade: X/100**

### Question-by-Question Feedback
For each question (e.g., **Q1**, **Q2**):
*   **Score:** X/Y Marks
*   **Strengths:** What did they correctly identify or reason through?
*   **Weaknesses:** What was partially correct, completely missed, or clinically unsafe?
*   **Rubric Comparison & Clinical Insight:** Compare their answer to the expected rubric and provide a brief clinical teaching point.

### Actionable Advice & Areas for Improvement
Conclude with 2-3 specific, actionable areas the student should focus their studying on based on this exam.`;

      const feedbackResponse = await generateContent(prompt, "You are an expert Physiotherapy Professor grading an exam.");
      setFeedback(feedbackResponse);
    } catch (error: any) {
      console.error("Error getting feedback:", error);
      setErrorMessage(error.message || "Failed to generate feedback. Please try again.");
      setShowErrorDialog(true);
      setIsExamSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Error Dialog Component
  const ErrorDialog = () => (
    <AnimatePresence>
      {showErrorDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
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

            <p className="text-muted-text mb-2 font-sans">
              {errorMessage || "The exam generation is taking longer than expected."}
            </p>
            <p className="text-muted-text mb-8 font-sans text-sm">
              This process may take up to 5 minutes depending on complexity and the case study depth.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full bg-accent text-surface p-4 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 brutal-border brutal-shadow-sm hover:bg-ink transition-colors group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                Try Again
              </button>
              <button
                onClick={handleReturnToDashboard}
                className="w-full bg-bg text-ink p-4 font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 brutal-border brutal-shadow-sm hover:bg-ink hover:text-surface transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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

  return (
    <div className="h-full flex flex-col gap-4 lg:gap-6 overflow-hidden">
      <ErrorDialog />

      {/* Exam Paper - Left/Top Pane */}
      <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden min-h-[300px] lg:min-h-0">
        <div className="p-3 md:p-4 border-b-2 border-ink flex justify-between items-center bg-bg gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent flex items-center justify-center brutal-border shrink-0">
              <FileText className="text-surface w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold uppercase text-sm md:text-lg leading-none">Written Examination</h2>
              <span className="font-mono text-[10px] md:text-xs text-muted-text uppercase hidden sm:block">{config.module} - {config.questionFocus}</span>
            </div>
          </div>
          {isExamSubmitted ? (
            <button onClick={onExit} className="text-[10px] md:text-xs font-mono uppercase hover:text-accent transition-colors shrink-0">
              [ Return ]
            </button>
          ) : (
            <button onClick={onExit} className="text-[10px] md:text-xs font-mono uppercase hover:text-accent transition-colors shrink-0">
              [ Quit Exam ]
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 font-sans">
          {/* Case Study Section */}
          <div className="mb-6 md:mb-8 p-4 md:p-6 bg-bg brutal-border brutal-shadow-sm text-sm md:text-base leading-relaxed markdown-body">
            <strong className="block mb-4 font-display uppercase tracking-widest text-accent text-sm md:text-base">Clinical Case Study:</strong>
            <ReactMarkdown>{bookCaseDetails?.caseStudy || ''}</ReactMarkdown>
          </div>

          {/* Questions Section */}
          <div className="space-y-4 md:space-y-6">
            <strong className="block font-display uppercase tracking-widest text-ink border-b-2 border-ink pb-2 text-sm md:text-base">
              Questions ({bookCaseDetails?.questions.reduce((sum, q) => sum + q.marks, 0) || 100} Marks Total):
            </strong>
            {bookCaseDetails?.questions.map((q, i) => (
              <div key={q.id} className="text-sm md:text-base p-3 md:p-4 bg-surface brutal-border flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div className="flex-1">
                    <span className="font-bold font-display text-accent mr-2">Q{i+1}.</span>
                    <span className="font-medium leading-relaxed">{q.text}</span>
                  </div>
                  <span className="font-mono text-xs bg-accent text-surface px-2 py-1 brutal-border shrink-0">
                    {q.marks} Marks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Answer Sheet & Feedback - Right/Bottom Pane */}
      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6 h-full lg:h-[400px] xl:h-[450px]">
        {/* Answer Sheet */}
        <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden">
          <div className="p-2 md:p-3 border-b-2 border-ink bg-ink text-surface flex justify-between items-center">
            <h3 className="font-display font-bold uppercase text-xs md:text-sm tracking-widest">Answer Sheet</h3>
            <button
              onClick={submitAnswers}
              disabled={isLoading || !studentAnswers.trim() || isExamSubmitted}
              className="text-[10px] md:text-xs font-mono uppercase bg-accent text-surface px-2 md:px-3 py-1 brutal-border hover:bg-surface hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Grading...' : isExamSubmitted ? 'Submitted' : 'Submit'}
            </button>
          </div>
          <textarea
            value={studentAnswers}
            onChange={(e) => setStudentAnswers(e.target.value)}
            placeholder="Type your answers here. Number them according to the questions (e.g., 1. The diagnosis is... 2. The pathophysiology involves...)"
            className="flex-1 p-3 md:p-4 bg-transparent resize-none font-mono text-sm focus:outline-none leading-relaxed"
            disabled={isLoading || isExamSubmitted}
          />
        </div>

        {/* Feedback Panel */}
        {feedback && (
          <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden max-h-[300px] lg:max-h-full">
            <div className="p-2 md:p-3 border-b-2 border-ink bg-accent text-surface">
              <h3 className="font-display font-bold uppercase text-xs md:text-sm tracking-widest">Professor's Feedback</h3>
            </div>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-bg markdown-body text-sm">
              <ReactMarkdown>{feedback}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
