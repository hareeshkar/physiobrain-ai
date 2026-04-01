import React from 'react';
import { CaseConfig } from '../types';
import { InteractiveSimulator } from './InteractiveSimulator';
import { BookStyleExam } from './BookStyleExam';

interface SimulatorProps {
  config: CaseConfig;
  onExit: () => void;
}

export function Simulator({ config, onExit }: SimulatorProps) {
  if (config.caseStyle === 'open') {
    return <BookStyleExam config={config} onExit={onExit} />;
  }

  return <InteractiveSimulator config={config} onExit={onExit} />;
}
