export interface CaseConfig {
  module: string;
  setting: string;
  ageGroup: string;
  severity: string;
  complexity: string;
  terminology: 'Basic' | 'Intermediate' | 'Advanced';
  specificTopic?: string;
  caseStyle: 'interactive' | 'open';
  questionFocus?: string;
  scoringParameters?: string;
}

export interface BookCaseQuestion {
  id: string;
  text: string;
  marks: number;
  expectedAnswer: string;
}

export interface BookCaseDetails {
  caseStudy: string;
  questions: BookCaseQuestion[];
}
