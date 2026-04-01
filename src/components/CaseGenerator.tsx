import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings2, Shuffle, Play } from 'lucide-react';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';
import { PrimaryButton, SecondaryButton, PillToggle } from './ui';

const MODULES = [
  "Musculoskeletal (Spine)",
  "Musculoskeletal (Peripheral Joints)",
  "Neurology (Acquired Brain Injury / Stroke)",
  "Neurology (Progressive / Degenerative)",
  "Cardiopulmonary Rehabilitation",
  "Pediatrics",
  "Geriatrics & Falls Prevention",
  "Sports Rehabilitation",
  "Pelvic & Women's Health",
  "Orthopedics (Post-operative)",
  "Amputee Rehabilitation"
];

const SETTINGS = [
  "Outpatient Clinic",
  "Inpatient Acute Care",
  "Inpatient Rehab Facility (IRF)",
  "Intensive Care Unit (ICU)",
  "Community / Home Health",
  "Sports Field / Sideline",
  "Skilled Nursing Facility (SNF)",
  "Pediatric School-Based"
];

const AGE_GROUPS = [
  "Infant (0-2 years)",
  "Child (3-12 years)",
  "Adolescent (13-18 years)",
  "Young Adult (19-35 years)",
  "Middle-Aged (36-64 years)",
  "Older Adult (65-79 years)",
  "Frail Elderly (80+ years)"
];

const SEVERITIES = [
  "Acute / High Irritability",
  "Sub-acute / Moderate Irritability",
  "Chronic / Low Irritability",
  "Critical / Medically Unstable"
];

const COMPLEXITIES = [
  "Standard (Single Pathology)",
  "Complex (1-2 Comorbidities)",
  "Highly Complex (Multi-system / Psychosocial flags)",
  "Post-Surgical with Complications"
];

const QUESTION_FOCUSES = [
  "Comprehensive Exam (Mixed)",
  "Diagnosis & Differential Diagnosis",
  "Pathophysiology & Mechanisms",
  "Assessment & Objective Testing",
  "Treatment & Management Plan"
];

const SCORING_PARAMETERS = [
  "Standard (5 questions, 20 marks each)",
  "Progressive (Increasing difficulty, 10 to 30 marks)",
  "Clinical Reasoning Heavy (Fewer questions, higher marks)",
  "Rapid Fire (10 questions, 10 marks each)"
];

const PREDEFINED_TEMPLATES: Record<string, CaseConfig> = {
  "Post-op ACL Knee": {
    module: "Sports Rehabilitation",
    setting: "Outpatient Clinic",
    ageGroup: "Young Adult (19-35 years)",
    severity: "Sub-acute / Moderate Irritability",
    complexity: "Standard (Single Pathology)",
    terminology: "Intermediate",
    specificTopic: "6 weeks post-op right ACL reconstruction (bone-patellar tendon-bone graft). Struggling with terminal extension and quad activation. Wants to return to soccer.",
    caseStyle: "interactive",
    questionFocus: QUESTION_FOCUSES[0]
  },
  "Acute LBP with Sciatica": {
    module: "Musculoskeletal (Spine)",
    setting: "Outpatient Clinic",
    ageGroup: "Middle-Aged (36-64 years)",
    severity: "Acute / High Irritability",
    complexity: "Complex (1-2 Comorbidities)",
    terminology: "Intermediate",
    specificTopic: "Acute onset low back pain radiating down right leg to calf. Positive straight leg raise. Patient has comorbid type 2 diabetes.",
    caseStyle: "interactive",
    questionFocus: QUESTION_FOCUSES[0]
  },
  "Stroke Gait Training": {
    module: "Neurology (Acquired Brain Injury / Stroke)",
    setting: "Inpatient Rehab Facility (IRF)",
    ageGroup: "Older Adult (65-79 years)",
    severity: "Sub-acute / Moderate Irritability",
    complexity: "Highly Complex (Multi-system / Psychosocial flags)",
    terminology: "Advanced",
    specificTopic: "Right MCA infarct 3 weeks ago. Left hemiparesis, left-sided neglect. Focus on gait training, balance, and transfer safety.",
    caseStyle: "interactive",
    questionFocus: QUESTION_FOCUSES[0]
  },
  "Pediatric CP Tone": {
    module: "Pediatrics",
    setting: "Pediatric School-Based",
    ageGroup: "Child (3-12 years)",
    severity: "Chronic / Low Irritability",
    complexity: "Complex (1-2 Comorbidities)",
    terminology: "Basic",
    specificTopic: "7-year-old with spastic diplegic cerebral palsy, GMFCS Level III. Focus on tone management and maximizing independent mobility in the classroom.",
    caseStyle: "interactive",
    questionFocus: QUESTION_FOCUSES[0]
  }
};

interface SelectOrCustomFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

function SelectOrCustomField({ label, options, value, onChange }: SelectOrCustomFieldProps) {
  const isCustom = !options.includes(value) && value !== '';
  const [selectMode, setSelectMode] = useState(isCustom ? 'Other (Type manually)' : (value || options[0]));

  useEffect(() => {
    if (options.includes(value)) {
      setSelectMode(value);
    } else if (value !== '') {
      setSelectMode('Other (Type manually)');
    }
  }, [value, options]);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-xs uppercase font-medium tracking-wider text-muted">{label}</label>
      <select
        value={selectMode}
        onChange={(e) => {
          const val = e.target.value;
          setSelectMode(val);
          if (val !== 'Other (Type manually)') {
            onChange(val);
          } else {
            onChange('');
          }
        }}
        className="w-full h-[52px] px-4 bg-surface border border-subtle rounded-lg font-sans text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer appearance-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="Other (Type manually)">Other (Type manually)...</option>
      </select>

      {selectMode === 'Other (Type manually)' && (
        <motion.input
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          type="text"
          value={!options.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Specify custom ${label.toLowerCase()}...`}
          className="w-full h-[52px] px-4 bg-surface border border-subtle rounded-lg font-sans text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          autoFocus
        />
      )}
    </div>
  );
}

interface CaseGeneratorProps {
  onGenerate: (config: CaseConfig) => void;
}

export function CaseGenerator({ onGenerate }: CaseGeneratorProps) {
  const [config, setConfig] = useState<CaseConfig>({
    module: MODULES[0],
    setting: SETTINGS[0],
    ageGroup: AGE_GROUPS[4],
    severity: SEVERITIES[1],
    complexity: COMPLEXITIES[0],
    terminology: 'Intermediate',
    specificTopic: '',
    caseStyle: 'interactive',
    questionFocus: QUESTION_FOCUSES[0],
    scoringParameters: SCORING_PARAMETERS[0]
  });

  const handleRandomize = () => {
    setConfig({
      module: MODULES[Math.floor(Math.random() * MODULES.length)],
      setting: SETTINGS[Math.floor(Math.random() * SETTINGS.length)],
      ageGroup: AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)],
      severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
      complexity: COMPLEXITIES[Math.floor(Math.random() * COMPLEXITIES.length)],
      terminology: ['Basic', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)] as 'Basic' | 'Intermediate' | 'Advanced',
      specificTopic: '',
      caseStyle: Math.random() > 0.5 ? 'interactive' : 'open',
      questionFocus: QUESTION_FOCUSES[Math.floor(Math.random() * QUESTION_FOCUSES.length)],
      scoringParameters: SCORING_PARAMETERS[Math.floor(Math.random() * SCORING_PARAMETERS.length)]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(config);
  };

  const caseStyleOptions = [
    { value: 'interactive' as const, label: 'Interactive Simulation' },
    { value: 'open' as const, label: 'Book-Style Exam' },
  ];

  const terminologyOptions = [
    { value: 'Basic' as const, label: 'Basic', description: 'Simple language, guided prompts' },
    { value: 'Intermediate' as const, label: 'Intermediate', description: 'Clinical terminology' },
    { value: 'Advanced' as const, label: 'Advanced', description: 'Complex, minimal guidance' },
  ];

  return (
    <div className="max-w-2xl mx-auto h-full py-6 px-4 pb-28 md:pb-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl p-6 md:p-8 shadow-elevated"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-accent" />
            </div>
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink">Case Setup</h2>
          </div>

          <SecondaryButton
            onClick={handleRandomize}
            size="sm"
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Randomize
          </SecondaryButton>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Case Style Toggle */}
          <div className="flex flex-col gap-3">
            <label className="font-mono text-xs uppercase font-medium tracking-wider text-muted">Case Style</label>
            <div className="flex justify-start">
              <PillToggle
                options={caseStyleOptions}
                value={config.caseStyle}
                onChange={(val) => setConfig({...config, caseStyle: val})}
              />
            </div>
          </div>

          {/* Quick Templates */}
          {config.caseStyle === 'interactive' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-3"
            >
              <label className="font-mono text-xs uppercase font-medium tracking-wider text-muted">Quick Templates</label>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                {Object.keys(PREDEFINED_TEMPLATES).map((templateName) => (
                  <button
                    key={templateName}
                    type="button"
                    onClick={() => setConfig(PREDEFINED_TEMPLATES[templateName])}
                    className="flex-shrink-0 px-4 py-2 bg-subtle rounded-full text-sm font-sans text-ink hover:bg-accent hover:text-white transition-all"
                  >
                    {templateName}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Form Fields - 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectOrCustomField
              label="Module"
              options={MODULES}
              value={config.module}
              onChange={(v) => setConfig({...config, module: v})}
            />
            {config.caseStyle === 'interactive' ? (
              <SelectOrCustomField
                label="Setting"
                options={SETTINGS}
                value={config.setting}
                onChange={(v) => setConfig({...config, setting: v})}
              />
            ) : (
              <SelectOrCustomField
                label="Question Focus"
                options={QUESTION_FOCUSES}
                value={config.questionFocus || QUESTION_FOCUSES[0]}
                onChange={(v) => setConfig({...config, questionFocus: v})}
              />
            )}
            <SelectOrCustomField
              label="Age Group"
              options={AGE_GROUPS}
              value={config.ageGroup}
              onChange={(v) => setConfig({...config, ageGroup: v})}
            />
            <SelectOrCustomField
              label="Severity"
              options={SEVERITIES}
              value={config.severity}
              onChange={(v) => setConfig({...config, severity: v})}
            />
            <div className={config.caseStyle === 'open' ? "" : "md:col-span-2"}>
              <SelectOrCustomField
                label="Complexity"
                options={COMPLEXITIES}
                value={config.complexity}
                onChange={(v) => setConfig({...config, complexity: v})}
              />
            </div>
            {config.caseStyle === 'open' && (
              <div>
                <SelectOrCustomField
                  label="Scoring Parameters"
                  options={SCORING_PARAMETERS}
                  value={config.scoringParameters || SCORING_PARAMETERS[0]}
                  onChange={(v) => setConfig({...config, scoringParameters: v})}
                />
              </div>
            )}

            {/* Custom Case Description */}
            <div className="md:col-span-2">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase font-medium tracking-wider text-muted">
                  Custom Case Description / Specific Topic (Optional)
                </label>
                <textarea
                  value={config.specificTopic}
                  onChange={(e) => setConfig({...config, specificTopic: e.target.value})}
                  placeholder="Manually type a specific topic or a detailed custom case description to override or supplement the options above..."
                  className="w-full p-4 bg-surface border border-subtle rounded-lg font-sans text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[120px] resize-y"
                />
              </div>
            </div>
          </div>

          {/* Terminology Level */}
          <div className="flex flex-col gap-3">
            <label className="font-mono text-xs uppercase font-medium tracking-wider text-muted">Terminology Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {terminologyOptions.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setConfig({...config, terminology: t.value})}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all border",
                    config.terminology === t.value
                      ? "bg-accent text-white border-accent shadow-md"
                      : "bg-surface text-ink border-subtle hover:border-accent/30"
                  )}
                >
                  <span className="block font-display font-semibold text-lg mb-1">{t.label}</span>
                  <span className={cn(
                    "text-sm",
                    config.terminology === t.value ? "text-white/80" : "text-muted"
                  )}>{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <PrimaryButton
            type="submit"
            size="lg"
            className="w-full gap-3 mt-4"
          >
            Generate Case
            <Play className="w-5 h-5" />
          </PrimaryButton>
        </form>
      </motion.div>
    </div>
  );
}