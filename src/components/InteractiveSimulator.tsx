import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Brain, Activity, AlertTriangle, RefreshCw, FileText, X, AlertCircle } from 'lucide-react';
import { generateJson, getAIClient } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';
import { saveActiveSession, getActiveSessionById, saveSessionToHistory, deleteActiveSession, ActiveSession } from '../lib/db';
import { ElegantSpinner } from './ui/ElegantSpinner';
import { Card } from './ui/Card';
import { PrimaryButton, GhostButton } from './ui/Button';

interface Message {
  id: string;
  role: 'user' | 'patient' | 'system';
  content: string;
}

export interface CaseDetails {
  studentBrief: string;
  hiddenPersona: string;
  diagnosis: string;
}

interface InteractiveSimulatorProps {
  config: CaseConfig;
  launchMode?: 'fresh' | 'resume';
  resumeSessionId?: string | null;
  onExit: () => void;
  onComplete?: (feedbackData: {
    type: 'simulator';
    config: CaseConfig;
    caseDetails: CaseDetails | null;
    messages: Message[];
    clinicalNotes: string;
    feedback: string;
    diagnosis?: string;
  }) => void;
}

export function InteractiveSimulator({
  config,
  launchMode = 'fresh',
  resumeSessionId = null,
  onExit,
  onComplete,
}: InteractiveSimulatorProps) {
  const [caseState, setCaseState] = useState<'generating' | 'active' | 'error' | 'resuming'>('resuming');
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isSimulationEnded, setIsSimulationEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Track failed message for retry
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const startSimulation = async () => {
      setCaseState('resuming');
      setMessages([]);
      setClinicalNotes('');
      setCaseDetails(null);
      setInput('');
      setIsSimulationEnded(false);
      setShowErrorDialog(false);
      setErrorMessage(null);
      setFailedMessage(null);
      chatSessionRef.current = null;
      sessionIdRef.current = '';

      if (launchMode === 'resume' && resumeSessionId) {
        try {
          const active = await getActiveSessionById(resumeSessionId);
          if (active && active.type === 'simulator') {
            sessionIdRef.current = active.id;
            setCaseDetails(active.caseDetails as CaseDetails || null);
            setMessages(active.messages || []);
            setClinicalNotes(active.clinicalNotes || '');
            setIsSimulationEnded(Boolean(active.ended));
            setCaseState('active');
            if (active.caseDetails?.hiddenPersona) {
              await initSimulation(active.caseDetails.hiddenPersona, true);
            }
            return;
          }
        } catch (e) {
          console.error('Failed to resume simulator session:', e);
        }
      }

      generateCase();
    };

    startSimulation();
  }, [config, launchMode, resumeSessionId]);

  // Auto-save session to IndexedDB
  const saveSession = useCallback(async () => {
    if (caseState !== 'active') return;
    if (!sessionIdRef.current) {
      sessionIdRef.current = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    const session: ActiveSession = {
      id: sessionIdRef.current,
      type: 'simulator',
      config,
      caseDetails: caseDetails || undefined,
      messages,
      clinicalNotes,
      studentAnswers: '',
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      ended: false,
    };
    try {
      await saveActiveSession(session);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, [caseState, config, caseDetails, messages, clinicalNotes]);

  // Auto-save on changes
  useEffect(() => {
    const timeoutId = setTimeout(saveSession, 1000);
    return () => clearTimeout(timeoutId);
  }, [saveSession]);

  const getDifficultyLevel = () => {
    // Determine difficulty based on complexity and severity settings
    if (config.complexity.includes('Highly Complex') || config.severity.includes('Critical')) {
      return 'high';
    } else if (config.complexity.includes('Complex') || config.severity.includes('Acute')) {
      return 'medium';
    }
    return 'low';
  };

  const generatePatientInstructions = (persona: string, difficulty: string) => {
    const baseInstructions = `
You are an AI Physiotherapy Patient Simulator.
Here is your persona and hidden medical information:
${persona}

CRITICAL INSTRUCTIONS FOR ROLEPLAY:
1. You are the patient, NOT a doctor or physiotherapist. Do not use medical jargon unless it makes sense for your background.
2. Answer questions naturally based on your persona.
3. DO NOT VOLUNTEER INFORMATION. You must explicitly wait for the student to ask specific questions to elicit information. NEVER reveal all your details or symptoms at once.
4. If the student asks a broad question (e.g., "Tell me about your pain"), give a general answer. Force them to ask follow-up questions (e.g., "What makes it worse?", "Does it travel anywhere?").
5. If they ask a poor or vague question, give a vague answer.
6. If they ask you to perform a physical movement (e.g., "lift your arm"), describe what you feel and how far you can move it based on your condition.
7. Keep your responses concise and conversational.`;

    const difficultyInstructions = {
      low: `
DIFFICULTY: LOW - This is a teaching case. Be cooperative but still do not volunteer information.
- You may show mild frustration if medical terms are used without explanation.
- Provide clear but not overly detailed responses.
- If asked about symptoms, give enough to prompt follow-up questions.`,
      medium: `
DIFFICULTY: MEDIUM - This is a standard clinical case. Maintain realism.
- Show realistic patient behaviors (hesitancy, fear avoidance, some denial).
- You may express concern about your condition.
- Use the "stool shuffle" technique - give incomplete answers that require specific follow-up.
- You might downplay symptoms or exaggerate them depending on your personality.
- Medical jargon confusion should be moderate.`,
      high: `
DIFFICULTY: HIGH - This is a complex case. Be challenging and realistic.
- You may exhibit significant fear avoidance behaviors or pain catastrophizing.
- You might become defensive or emotional when questioned about sensitive topics.
- Use denial, minimization, or redirection as real patients do.
- "Stool shuffle" aggressively - always give the minimum information needed.
- You may use medical terms incorrectly or misunderstand complex instructions.
- Show realistic psychosocial flags (work stress, family concerns, etc.).
- Pain behaviors should be consistent with your condition but may fluctuate based on how questions are asked.
- If the student uses medical jargon without explaining, you may say "I don't understand what that means" or misinterpret it based on your personality.`
    };

    return baseInstructions + difficultyInstructions[difficulty as keyof typeof difficultyInstructions];
  };

  const generateCase = async () => {
    setCaseState('generating');
    setErrorMessage(null);

    const prompt = `You are an expert Physiotherapy Case Creator designing a highly realistic patient simulation.

PARAMETERS:
- Module: ${config.module}
- Setting: ${config.setting}
- Patient Age Group: ${config.ageGroup}
- Condition Severity: ${config.severity}
- Case Complexity: ${config.complexity}
${config.specificTopic ? `- Specific Topic Focus: ${config.specificTopic}` : ''}

TASK:
Create a patient case with a hidden diagnosis that the student must uncover through subjective and objective assessment.

REQUIREMENTS:
1. "studentBrief": What the student sees on the intake form (e.g., "45yo male complaining of shoulder pain"). DO NOT reveal the diagnosis here.
2. "hiddenPersona": A comprehensive system prompt for the AI roleplaying as the patient. Include:
   - Actual medical diagnosis.
   - Mechanism of injury / history of present illness.
   - Specific symptoms (SINSS - Severity, Irritability, Nature, Stage, Stability).
   - Aggravating and easing factors.
   - 24-hour symptom behavior.
   - Past medical history, medications, social history.
   - Personality traits (e.g., anxious, stoic, talkative) based on age and severity.
   - INSTRUCTIONS: Tell the AI to act like a real patient, NOT a medical professional. It should only reveal information when specifically asked. It should express pain or confusion if the student uses overly complex medical jargon without explaining it.
3. "diagnosis": The exact medical diagnosis for the supervisor's reference.

Return ONLY a JSON object matching EXACTLY this structure:
{
  "studentBrief": "string",
  "hiddenPersona": "string",
  "diagnosis": "string"
}`;

    try {
      const data = await generateJson<CaseDetails>(prompt, "You are an expert physiotherapy case creator.");

      if (!data || !data.studentBrief || !data.hiddenPersona || !data.diagnosis) {
        throw new Error("Invalid response structure from AI");
      }

      // Save case to IndexedDB immediately
      if (!sessionIdRef.current) {
        sessionIdRef.current = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      const session: ActiveSession = {
        id: sessionIdRef.current,
        type: 'simulator',
        config,
        caseDetails: data,
        messages: [],
        clinicalNotes: '',
        studentAnswers: '',
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
        ended: false,
      };
      await saveActiveSession(session);

      setCaseDetails(data);
      setCaseState('active');
      initSimulation(data.hiddenPersona, false);
    } catch (error: any) {
      console.error("Failed to generate case:", error);
      setErrorMessage(error.message || "Failed to generate case. Please try again.");
      setCaseState('error');
      setShowErrorDialog(true);
    }
  };

  const initSimulation = async (persona: string, isResume: boolean) => {
    setIsLoading(true);
    try {
      const ai = getAIClient();
      const difficulty = getDifficultyLevel();
      const systemInstruction = generatePatientInstructions(persona, difficulty);

      const chat = ai.chats.create({
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      chatSessionRef.current = chat;

      // Only add system message if not resuming (when resuming, messages already exist)
      if (!isResume) {
        setMessages([
          { id: '1', role: 'system', content: 'Simulation started. You may begin the subjective assessment.' }
        ]);
      }
    } catch (error: any) {
      console.error("Failed to initialize simulation:", error);
      setErrorMessage(error.message || "Failed to initialize simulation.");
      setCaseState('error');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setShowErrorDialog(false);
    setErrorMessage(null);
    generateCase();
  };

  const handleReturnToDashboard = () => {
    setShowErrorDialog(false);
    onExit();
  };

  const handleSendMessage = async (e?: React.FormEvent, retryMsg?: string) => {
    if (e) e.preventDefault();

    const userMsg = retryMsg || input.trim();
    if (!userMsg || isLoading || !chatSessionRef.current) return;

    // If this is a retry, remove the failed message from UI first
    if (retryMsg) {
      setMessages(prev => prev.filter(m => m.id !== 'pending'));
      setFailedMessage(null);
    } else {
      setInput('');
    }

    const tempId = `pending-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      // Replace pending message with confirmed
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: Date.now().toString() } : m));
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'patient', content: response.text || "" }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Mark message as failed (change id so it can be retried)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: 'failed' } : m));
      setFailedMessage(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const retryFailedMessage = () => {
    if (failedMessage) {
      handleSendMessage(undefined, failedMessage);
    }
  };

  const requestFeedback = async () => {
    setIsLoading(true);
    try {
      // Move session from active to history as "ended" (FeedbackView will generate feedback)
      if (sessionIdRef.current) {
        try {
          const activeSession = await getActiveSessionById(sessionIdRef.current);
          if (activeSession && activeSession.id === sessionIdRef.current) {
            const duration = Math.floor((Date.now() - activeSession.startedAt) / 1000);
            await saveSessionToHistory({
              id: activeSession.id,
              type: 'simulator',
              config: activeSession.config,
              caseDetails: activeSession.caseDetails,
              messages: messages,
              clinicalNotes: clinicalNotes,
              studentAnswers: '',
              feedback: undefined, // FeedbackView will generate
              diagnosis: caseDetails?.diagnosis,
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
          type: 'simulator',
          config,
          caseDetails: caseDetails,
          messages,
          clinicalNotes,
          feedback: undefined, // Let FeedbackView generate
          diagnosis: caseDetails?.diagnosis,
        });
      }
    } catch (error: any) {
      console.error("Error getting feedback:", error);
      setErrorMessage(error.message || "Failed to generate feedback.");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Inline Error Card Component
  const ErrorCard = () => (
    <Card className="max-w-md mx-auto p-6 text-center">
      <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="text-error w-6 h-6" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">Connection Issue</h3>
      <p className="text-muted text-sm mb-6">
        {errorMessage || "The case generation is taking longer than expected."}
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

  if (caseState === 'generating') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="mb-6">
            <ElegantSpinner size="lg" className="mx-auto" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            Generating Case...
          </h2>
          <p className="text-muted text-sm mb-4">
            Building patient profile, clinical history, and hidden diagnosis based on your parameters.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>This may take up to 5 minutes</span>
          </div>
        </Card>
        {showErrorDialog && <ErrorCard />}
      </div>
    );
  }

  if (caseState === 'error' && !showErrorDialog) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <ErrorCard />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6 pb-24 md:pb-10 overflow-y-auto overflow-x-hidden">
      {/* Left Pane: Patient Chat */}
      <div className="flex-1 flex flex-col bg-surface rounded-xl shadow-card h-full overflow-hidden min-h-[400px] lg:min-h-0">
        {/* Chat Header */}
        <div className="p-3 md:p-4 border-b border-subtle flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <User className="text-accent w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-sans font-medium text-sm md:text-base leading-none truncate">{config.module} - Patient Simulation</h2>
              <span className="font-mono text-[10px] md:text-xs text-muted uppercase hidden sm:block">{config.setting}</span>
            </div>
          </div>
          <button
            onClick={requestFeedback}
            disabled={isLoading || messages.length < 1}
            className="text-xs font-sans text-accent hover:text-accent/80 transition-colors shrink-0 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'End & Evaluate'}
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col gap-4 md:gap-6">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={cn(
                "max-w-[85%] p-3 md:p-4 text-sm md:text-base",
                msg.role === 'user' && "self-end bg-accent text-white rounded-tl-4xl rounded-tr-4xl rounded-bl-4xl rounded-br-sm",
                msg.role === 'system' && "self-center bg-accent/10 text-accent text-center text-xs md:text-sm rounded-2xl px-4 py-2",
                msg.role === 'patient' && "self-start bg-surface text-ink rounded-tl-4xl rounded-tr-4xl rounded-bl-sm rounded-br-4xl shadow-card"
              )}
            >
              <div className="text-[10px] font-mono uppercase opacity-60 mb-1 md:mb-2 tracking-wider flex justify-between items-center">
                <span>{msg.role}</span>
                {msg.id === 'failed' && (
                  <button
                    onClick={retryFailedMessage}
                    className="text-[10px] bg-error text-white px-2 py-0.5 rounded-full uppercase hover:bg-error/80"
                  >
                    Retry
                  </button>
                )}
              </div>
              <div className="font-sans leading-relaxed break-words">
                {msg.content}
              </div>
              {msg.id === 'failed' && (
                <div className="mt-2 text-[10px] text-error font-mono">
                  Failed to send. Click retry to try again.
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="self-start bg-surface p-3 md:p-4 rounded-tl-4xl rounded-tr-4xl rounded-bl-sm rounded-br-4xl shadow-card max-w-[85%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-subtle bg-surface flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={failedMessage ? "Retry your message..." : "Ask the patient a question..."}
            className="flex-1 p-3 bg-background rounded-full border border-subtle font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            disabled={isLoading || isSimulationEnded}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !failedMessage) || isSimulationEnded}
            className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-button hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right Pane: Clinical Notes */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-4 lg:gap-6 h-full pb-12 lg:pb-0">
        {/* Case Brief - Main reference (bigger) */}
        <Card className="flex-1 overflow-hidden min-h-[250px] flex flex-col">
          <div className="p-3 md:p-4 border-b border-subtle flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-sm md:text-base">Case Brief</h3>
          </div>
          <div className="flex-1 p-4 bg-surface font-sans text-sm leading-relaxed text-muted overflow-y-auto">
            {caseDetails?.studentBrief}
          </div>
        </Card>

        {/* Clinical Notes - Smaller workspace */}
        <Card className="flex-shrink-0 overflow-hidden max-h-[200px] flex flex-col">
          <div className="p-3 md:p-4 border-b border-subtle bg-surface flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-sm">Clinical Notes</h3>
          </div>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Document your findings, hypotheses, and plan..."
            className="p-4 bg-transparent resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 h-[100px]"
          />
        </Card>
      </div>
    </div>
  );
}
