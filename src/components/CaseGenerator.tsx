import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shuffle, Play, Settings2 } from 'lucide-react';
import { CaseConfig } from '../types';
import { cn } from '../lib/utils';

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
      <label className="font-mono text-xs uppercase font-bold tracking-widest text-muted-text">{label}</label>
      <select 
        value={selectMode}
        onChange={(e) => {
          const val = e.target.value;
          setSelectMode(val);
          if (val !== 'Other (Type manually)') {
            onChange(val);
          } else {
            onChange(''); // Clear value so user can type
          }
        }}
        className="appearance-none w-full p-4 bg-bg brutal-border font-sans text-lg focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="Other (Type manually)">Other (Type manually)...</option>
      </select>
      
      {selectMode === 'Other (Type manually)' && (
        <motion.input
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
          type="text"
          value={!options.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Specify custom ${label.toLowerCase()}...`}
          className="w-full p-4 bg-surface brutal-border font-sans text-lg focus:outline-none focus:ring-2 focus:ring-accent"
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
    ageGroup: AGE_GROUPS[4], // Middle-Aged default
    severity: SEVERITIES[1], // Sub-acute default
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
      terminology: ['Basic', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)] as any,
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

  return (
    <div className="max-w-3xl mx-auto h-full py-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface brutal-border brutal-shadow p-6 md:p-10"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b-4 border-ink">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent flex items-center justify-center brutal-border">
              <Settings2 className="w-6 h-6 text-surface" />
            </div>
            <h2 className="font-display font-bold text-3xl uppercase tracking-tight">Case Setup</h2>
          </div>
          
          <button 
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-2 font-mono text-sm uppercase bg-bg px-4 py-2 brutal-border brutal-shadow-sm hover:bg-ink hover:text-surface transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Randomize
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col gap-4">
            <label className="font-mono text-xs uppercase font-bold tracking-widest text-muted-text">Case Style</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setConfig({...config, caseStyle: 'interactive'})}
                className={cn(
                  "p-4 brutal-border text-left transition-all flex flex-col gap-2",
                  config.caseStyle === 'interactive' 
                    ? "bg-ink text-surface brutal-shadow-sm translate-x-[2px] translate-y-[2px]" 
                    : "bg-surface hover:bg-bg brutal-shadow"
                )}
              >
                <span className="font-display font-bold uppercase text-lg">Interactive Simulation</span>
                <span className={cn(
                  "font-sans text-sm",
                  config.caseStyle === 'interactive' ? "text-muted" : "text-muted-text"
                )}>Blind assessment. Interview the patient to discover their history.</span>
              </button>
              <button
                type="button"
                onClick={() => setConfig({...config, caseStyle: 'open'})}
                className={cn(
                  "p-4 brutal-border text-left transition-all flex flex-col gap-2",
                  config.caseStyle === 'open' 
                    ? "bg-ink text-surface brutal-shadow-sm translate-x-[2px] translate-y-[2px]" 
                    : "bg-surface hover:bg-bg brutal-shadow"
                )}
              >
                <span className="font-display font-bold uppercase text-lg">Book-Style Exam</span>
                <span className={cn(
                  "font-sans text-sm",
                  config.caseStyle === 'open' ? "text-muted" : "text-muted-text"
                )}>Written clinical vignette followed by specific exam questions to answer.</span>
              </button>
            </div>
          </div>

          {/* Quick Templates */}
          {config.caseStyle === 'interactive' && (
            <div className="flex flex-col gap-3 bg-bg p-4 brutal-border">
              <label className="font-mono text-xs uppercase font-bold tracking-widest text-muted-text">Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PREDEFINED_TEMPLATES).map((templateName) => (
                  <button
                    key={templateName}
                    type="button"
                    onClick={() => setConfig(PREDEFINED_TEMPLATES[templateName])}
                    className="text-xs font-mono uppercase bg-surface px-3 py-2 brutal-border hover:bg-accent hover:text-surface transition-colors"
                  >
                    {templateName}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <div className={config.caseStyle === 'open' ? "md:col-span-1" : "md:col-span-2"}>
              <SelectOrCustomField 
                label="Complexity" 
                options={COMPLEXITIES} 
                value={config.complexity} 
                onChange={(v) => setConfig({...config, complexity: v})} 
              />
            </div>
            {config.caseStyle === 'open' && (
              <div className="md:col-span-1">
                <SelectOrCustomField 
                  label="Scoring Parameters" 
                  options={SCORING_PARAMETERS} 
                  value={config.scoringParameters || SCORING_PARAMETERS[0]} 
                  onChange={(v) => setConfig({...config, scoringParameters: v})} 
                />
              </div>
            )}
            
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-mono text-xs uppercase font-bold tracking-widest text-muted-text">Custom Case Description / Specific Topic (Optional)</label>
              <textarea 
                value={config.specificTopic}
                onChange={(e) => setConfig({...config, specificTopic: e.target.value})}
                placeholder="Manually type a specific topic or a detailed custom case description to override or supplement the options above (e.g., '6 weeks post-op ACL reconstruction, struggling with terminal extension...')"
                className="w-full p-4 bg-bg brutal-border font-sans text-lg focus:outline-none focus:ring-2 focus:ring-accent min-h-[120px] resize-y"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="font-mono text-xs uppercase font-bold tracking-widest text-muted-text">Terminology Level</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { level: 'Basic', desc: 'Simple language, guided prompts' },
                { level: 'Intermediate', desc: 'Clinical terminology' },
                { level: 'Advanced', desc: 'Complex, minimal guidance' }
              ].map((t) => (
                <button
                  key={t.level}
                  type="button"
                  onClick={() => setConfig({...config, terminology: t.level as any})}
                  className={cn(
                    "p-4 brutal-border text-left transition-all flex flex-col gap-2",
                    config.terminology === t.level 
                      ? "bg-ink text-surface brutal-shadow-sm translate-x-[2px] translate-y-[2px]" 
                      : "bg-surface hover:bg-bg brutal-shadow"
                  )}
                >
                  <span className="font-display font-bold uppercase text-lg">{t.level}</span>
                  <span className={cn(
                    "font-sans text-sm",
                    config.terminology === t.level ? "text-muted" : "text-muted-text"
                  )}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="mt-4 w-full bg-accent text-surface p-6 font-display font-bold text-2xl uppercase tracking-wider flex items-center justify-center gap-3 brutal-border brutal-shadow hover:bg-ink transition-colors group"
          >
            <Play className="w-8 h-8 group-hover:scale-110 transition-transform" />
            Generate Case
          </button>
        </form>
      </motion.div>
    </div>
  );
}
