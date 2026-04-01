import React from 'react';
import { CaseConfig } from '../types';
import { InteractiveSimulator } from './InteractiveSimulator';
import { BookStyleExam } from './BookStyleExam';

interface SimulatorProps {
  config: CaseConfig;
  onExit: () => void;
  onComplete: (feedbackData: {
    type: 'simulator' | 'exam';
    config: CaseConfig;
    caseDetails?: any;
    messages?: any[];
    clinicalNotes?: string;
    studentAnswers?: string;
    feedback: string;
    diagnosis?: string;
  }) => void;
}

export function Simulator({ config, onExit, onComplete }: SimulatorProps) {
  if (config.caseStyle === 'open') {
    return <BookStyleExam config={config} onExit={onExit} onComplete={onComplete} />;
  }

  return <InteractiveSimulator config={config} onExit={onExit} onComplete={onComplete} />;
}