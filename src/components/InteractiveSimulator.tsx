import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Brain, Activity, AlertTriangle, RefreshCw, FileText, X, AlertCircle } from 'lucide-react';
import { generateContent, generateJson, getAIClient } from '../lib/ai';
import ReactMarkdown from 'react-markdown';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';

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
  onExit: () => void;
}

export function InteractiveSimulator({ config, onExit }: InteractiveSimulatorProps) {
  const [caseState, setCaseState] = useState<'generating' | 'active' | 'error'>('generating');
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isSimulationEnded, setIsSimulationEnded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    generateCase();
  }, [config]);

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

      setCaseDetails(data);
      setCaseState('active');
      initSimulation(data.hiddenPersona);
    } catch (error: any) {
      console.error("Failed to generate case:", error);
      setErrorMessage(error.message || "Failed to generate case. Please try again.");
      setCaseState('error');
      setShowErrorDialog(true);
    }
  };

  const initSimulation = async (persona: string) => {
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

      setMessages([
        { id: '1', role: 'system', content: 'Simulation started. You may begin the subjective assessment.' }
      ]);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'patient', content: response.text || "" }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setErrorMessage(error.message || "Connection lost. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const requestFeedback = async () => {
    setIsLoading(true);
    setIsSimulationEnded(true);
    try {
      const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      const prompt = `You are an expert, constructive Physiotherapy Clinical Educator evaluating a student's performance in a clinical simulation. Your goal is to help them learn by providing detailed explanations for scoring and improvement areas. Adapt your expectations, strictness, and the depth of your medical explanations to the specified "${config.complexity}" complexity level and "${config.terminology}" terminology level.

### SIMULATION CONTEXT
- Module: ${config.module}
- Setting: ${config.setting}
- Patient Profile: ${config.ageGroup}, ${config.severity} severity.
- ACTUAL Patient Diagnosis: ${caseDetails?.diagnosis}
- Patient Persona/Background: ${caseDetails?.hiddenPersona}

### STUDENT'S DATA
1. STUDENT'S CLINICAL NOTES (Their internal thought process, hypotheses, and planning):
"""
${clinicalNotes || "(No clinical notes provided by the student)"}
"""

2. CONVERSATION HISTORY (Transcript of their interaction with the patient):
"""
${conversationHistory}
"""

### EVALUATION TASK
Analyze the student's reasoning based heavily on their clinical notes and conversation history.

FORMAT YOUR RESPONSE IN MARKDOWN:
### Overall Performance Summary
(Provide an encouraging but honest summary. Give a qualitative "score" or rating of their clinical reasoning and data gathering.)

### Subjective & Objective Assessment
(Evaluate their questioning technique. Did they ask specific enough questions? Did they miss red flags or psychosocial factors? Detail exactly what they missed and why it was important for this specific case.)

### Clinical Reasoning Analysis
(Deeply analyze their clinical notes. How was their hypothesis generation? If they guessed wrong, was their logic sound based on the data they gathered? Provide a detailed explanation of the actual presentation and pathophysiology of ${caseDetails?.diagnosis} at the ${config.terminology} level.)

### Communication & Bedside Manner
(Evaluate how they spoke to the patient. Was it appropriate for the setting and patient persona?)

### Actionable Next Steps
(Give 2-3 highly specific, actionable tips for their next clinical encounter to improve their reasoning and assessment skills.)`;

      const feedbackResponse = await generateContent(prompt, "You are an expert Physiotherapy Clinical Educator.");
      setFeedback(feedbackResponse);
    } catch (error: any) {
      console.error("Error getting feedback:", error);
      setErrorMessage(error.message || "Failed to generate feedback.");
      setShowErrorDialog(true);
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
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Connection Issue</h2>
            </div>

            <p className="text-muted-text mb-2 font-sans">
              {errorMessage || "The case generation is taking longer than expected."}
            </p>
            <p className="text-muted-text mb-8 font-sans text-sm">
              This process may take up to 5 minutes depending on complexity.
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

  if (caseState === 'generating') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="relative mb-6">
          <RefreshCw className="w-16 h-16 text-accent animate-spin" />
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
        </div>
        <h2 className="font-display font-bold text-2xl md:text-3xl uppercase mb-2 tracking-tight">Generating Case...</h2>
        <p className="font-mono text-xs md:text-sm text-muted-text uppercase text-center max-w-md mb-4">
          Building patient profile, clinical history, and hidden diagnosis based on your parameters.
        </p>
        <div className="flex items-center gap-2 text-muted-text">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-mono text-xs uppercase">This may take up to 5 minutes</span>
        </div>
        <ErrorDialog />
      </div>
    );
  }

  if (caseState === 'error' && !showErrorDialog) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <ErrorDialog />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      <ErrorDialog />

      {/* Left Pane: Patient Chat */}
      <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow h-full overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="p-3 md:p-4 border-b-2 border-ink flex justify-between items-center bg-bg gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-full flex items-center justify-center brutal-border shrink-0">
              <User className="text-surface w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold uppercase text-sm md:text-lg leading-none truncate">Patient Simulation</h2>
              <span className="font-mono text-[10px] md:text-xs text-muted-text uppercase hidden sm:block">{config.module} - {config.setting}</span>
            </div>
          </div>
          {isSimulationEnded ? (
            <button onClick={onExit} className="text-[10px] md:text-xs font-mono uppercase hover:text-accent transition-colors shrink-0">
              [ Return ]
            </button>
          ) : (
            <button onClick={requestFeedback} className="text-[10px] md:text-xs font-mono uppercase hover:text-accent transition-colors shrink-0">
              [ End & Evaluate ]
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col gap-4 md:gap-6">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={cn(
                "max-w-[90%] md:max-w-[85%] p-3 md:p-4 brutal-border text-sm md:text-base",
                msg.role === 'user' ? "self-end bg-ink text-surface" :
                msg.role === 'system' ? "self-center bg-accent text-surface text-center text-xs md:text-sm font-mono" :
                "self-start bg-bg"
              )}
            >
              <div className="text-[10px] font-mono uppercase opacity-50 mb-1 md:mb-2 tracking-wider">
                {msg.role}
              </div>
              <div className="font-sans leading-relaxed break-words">
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="self-start bg-bg p-3 md:p-4 brutal-border max-w-[90%] md:max-w-[85%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-ink rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-ink rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-ink rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t-2 border-ink bg-bg flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the patient a question..."
            className="flex-1 p-3 bg-surface brutal-border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isLoading || isSimulationEnded}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isSimulationEnded}
            className="bg-accent text-surface p-3 brutal-border brutal-shadow-sm hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Right Pane: Clinical Notepad & Coach */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-4 lg:gap-6 h-full">
        {/* Case Brief */}
        <div className="flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden shrink-0 max-h-[150px]">
          <div className="p-2 md:p-3 border-b-2 border-ink bg-bg text-ink flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <h3 className="font-display font-bold uppercase text-xs md:text-sm tracking-widest">Case Brief</h3>
            </div>
          </div>
          <div className="p-3 md:p-4 bg-surface font-sans text-sm leading-relaxed text-muted-text overflow-y-auto">
            {caseDetails?.studentBrief}
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden min-h-[120px] lg:min-h-[150px]">
          <div className="p-2 md:p-3 border-b-2 border-ink bg-ink text-surface flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <h3 className="font-display font-bold uppercase text-xs md:text-sm tracking-widest">Clinical Notes</h3>
          </div>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Document your findings, hypotheses, and plan..."
            className="flex-1 p-3 md:p-4 bg-transparent resize-none font-mono text-sm focus:outline-none"
          />
        </div>

        {/* Reasoning Coach */}
        <div className="flex-1 flex flex-col bg-surface brutal-border brutal-shadow overflow-hidden min-h-[200px] lg:min-h-[250px]">
          <div className="p-2 md:p-3 border-b-2 border-ink bg-accent text-surface flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <h3 className="font-display font-bold uppercase text-xs md:text-sm tracking-widest">Reasoning Coach</h3>
            </div>
            <button
              onClick={requestFeedback}
              disabled={isLoading || messages.length < 3 || isSimulationEnded}
              className="text-[10px] md:text-xs font-mono uppercase bg-surface text-ink px-2 md:px-3 py-1 brutal-border hover:bg-bg transition-colors disabled:opacity-50"
            >
              Feedback
            </button>
          </div>
          <div className="flex-1 p-3 md:p-4 overflow-y-auto bg-bg">
            {feedback ? (
              <div className="markdown-body text-sm">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-text text-center p-4">
                <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-mono text-xs uppercase">Interact with the patient to gather data, then request feedback.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
