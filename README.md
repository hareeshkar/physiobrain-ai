<div align="center">
<img width="1200" height="475" alt="PhysioBrain AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PhysioBrain AI 🧠

An **AI-powered physiotherapy education platform** that transforms how students learn clinical decision-making through interactive simulations, intelligent case generation, and real-time feedback.

> **Beta Release** | Intelligent Medical Education for Physiotherapists in Training

---

## 🎯 Overview

PhysioBrain AI combines cutting-edge generative AI with evidence-based physiotherapy education to create an adaptive learning environment where students:

- **Engage** with realistic patient simulations powered by advanced AI
- **Practice** evidence-based decision-making in a risk-free environment  
- **Learn** through immediate, personalized feedback from clinical experts
- **Master** complex assessment and treatment scenarios through spaced repetition

---

## 🤖 Intelligent Agents

PhysioBrain AI uses specialized AI agents to deliver a cohesive learning ecosystem:

### 1. **Case Generator Agent** 🧬
Generates comprehensive physiotherapy cases with:
- Realistic patient histories and clinical presentations
- Complex medical backgrounds and comorbidities
- Tailored difficulty levels (Beginner → Exam → Clinical Expert)
- Hidden diagnoses for simulation-based learning
- **Output**: Structured case briefs, patient personas, learning objectives

### 2. **Interactive Simulator Agent** 🏥
Real-time patient interaction engine:
- Conversational AI that responds as the virtual patient
- Realistic symptom presentation and patient behavior
- Support for clinical assessment techniques (special tests, palpation descriptions)
- Dynamic case progression based on student questioning
- **Output**: Patient responses, clinical findings, follow-up prompts

### 3. **Book-Style Exam Agent** 📝
Structured examination format engine:
- Generates 5-question practical exams from clinical cases
- Student-friendly case studies (250-400 words, accessible language)
- Balanced question difficulty with proportional marks (40-50 word questions)
- Collapsible question UI for distraction-free reading
- Auto-growing textarea for comfortable answer writing
- **Output**: Graded answers, clinical feedback, learning recommendations

### 4. **Knowledge Engine Agent** 🔍
Evidence-based knowledge lookup system:
- Bidirectional search (condition ↔ treatment modalities)
- Complexity-aware explanations (Beginner / Exam / Clinical)
- Evidence synthesis from latest physiotherapy guidelines
- References and source citations
- **Output**: Clinical knowledge, treatment rationales, research insights

### 5. **Medical Translator Agent** 🔤
Bidirectional medical terminology bridge:
- Complex medical ↔ Simple patient communication
- Context-aware terminology explanations
- Patient education ready-to-use language
- Mobile-optimized, single-column interface (desktop: 3-column comparison)
- **Output**: Simplified explanations, communication templates

### 6. **Feedback Engine (Post-Session)** 💬
Intelligent learning analytics:
- Personalized feedback on clinical reasoning
- Gap identification in assessment techniques
- Evidence-based treatment recommendation analysis
- Session history tracking with progressive improvement metrics
- **Output**: Detailed feedback reports, learning dashboards

---

## ✨ Key Features

### Mobile-First UX
- **Full-screen viewport** with locked scrolling (no horizontal overflow)
- **Bottom navigation tab bar** for seamless view transitions
- **Responsive padding** (pb-10 / 40px) ensures content never hides under nav
- **Touch-optimized** inputs and interactive elements

### Smart Learning Interface
- **Collapsible questions** in exam mode (preview mode prevents scrolling fatigue)
- **Auto-expanding textarea** for answer writing (max 420px mobile / 520px desktop)
- **Session persistence** via IndexedDB (auto-save every change)
- **History tracking** with ability to resume incomplete sessions
- **"More" menu modal** for quick access to additional tools (Evidence Engine, Translator)

### Clinical Features
- **Case style selection**: Interactive simulation vs. Book-Style exam
- **Difficulty customization**: 8 complexity/severity combinations
- **Question focus** types: Assessment, Treatment Planning, Patient Education
- **Clinical setting** presets: Hospital, Clinic, Community, Telehealth
- **Real-time feedback** on clinical reasoning and technique
- **Spaced repetition** support through session history

### Performance
- **Fast builds**: Vite 6.4.1 with ~600KB bundled JS (gzipped: ~185KB)
- **Smooth animations**: Framer Motion for collapsible sections and transitions
- **Efficient state**: React hooks + IndexedDB for offline capability
- **No build errors**: Full TypeScript strict mode compliance

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or later
- **npm** 9.x or later

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hareeshkar/physiobrain-ai.git
   cd physiobrain-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Add your API keys in .env.local
   # GEMINI_API_KEY=your_gemini_key_here
   # MINIMAX_API_KEY=your_minimax_key_here
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build & Deployment

### Local Build
```bash
npm run build      # Creates optimized dist/ folder
npm run preview    # Preview production build locally
```

### Deploy on Vercel

1. Push to GitHub:
   ```bash
   git push -u origin main
   ```

2. Import on Vercel:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Vercel automatically detects Vite configuration

3. Set environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `MINIMAX_API_KEY`: Your MiniMax API key

4. Deploy:
   ```bash
   # Vercel auto-deploys on git push, or manually trigger via dashboard
   ```

**Architecture:**
- **Frontend**: Vite SPA (React + TypeScript + Tailwind CSS)
- **Backend**: Vercel Functions (`/api/chat` endpoint for AI calls)
- **Database**: IndexedDB (client-side session persistence)
- **AI Models**: Gemini (Google), MiniMax (Anthropic API compatible)

---

## 🏗️ Project Structure

```
physiobrain-ai/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx              # Main app shell & view router
│   │   ├── Simulator.tsx              # Router between simulation modes
│   │   ├── InteractiveSimulator.tsx   # Real-time patient chat interface
│   │   ├── BookStyleExam.tsx          # Structured exam UI (collapsible Q&A)
│   │   ├── CaseGenerator.tsx          # Case param selection
│   │   ├── FeedbackView.tsx           # Post-session analytics & feedback
│   │   ├── KnowledgeEngine.tsx        # Evidence-based lookup
│   │   ├── Translator.tsx             # Medical↔Simple terminology bridge
│   │   └── ui/                        # Reusable UI components
│   ├── lib/
│   │   ├── ai.ts                      # AI client (Gemini/MiniMax)
│   │   ├── db.ts                      # IndexedDB helpers (session persistence)
│   │   ├── utils.ts                   # Utility functions
│   │   └── minimax.ts                 # MiniMax API integration
│   ├── types.ts                       # TypeScript interfaces
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles (Tailwind)
├── api/
│   └── chat.ts                        # Vercel Function: /api/chat endpoint
├── .env.example                       # Environment variable template
├── .gitignore                         # Git ignore patterns (secrets safe)
├── tsconfig.json                      # TypeScript strict mode config
├── vite.config.ts                     # Vite build configuration
├── package.json                       # Dependencies & scripts
└── README.md                          # This file
```

---

## 🔐 Security & Privacy

✅ **Security Best Practices Implemented:**

- **No hardcoded secrets**: All API keys loaded from environment variables
- **Environment isolation**: `.env` files in `.gitignore` (never committed)
- **.env.example provided**: Shows configuration format without credentials
- **Client-side session data**: Uses IndexedDB (encrypted on-device, not transmitted)
- **API calls authenticated**: All AI requests use server-side `/api/chat` with hidden credentials
- **Regular secrets scanning**: CI/CD should run secret detection on PRs

✅ **What's NOT in the repo:**
- API keys or tokens
- Cloud credentials
- Private configuration files
- Test data with sensitive information

---

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Locally preview production build
npm run typecheck    # TypeScript strict mode check
```

### Code Quality
- **TypeScript**: Strict mode enabled (no implicit any, full type safety)
- **React**: Hooks-based components with proper dependency arrays
- **Tailwind CSS**: Responsive design with mobile-first utilities
- **Linting**: Ready for ESLint integration

### Testing
```bash
npm run typecheck    # Verify TypeScript compilation (no errors in app code)
```

---

## 📊 Features Roadmap

### Current (Beta)
- ✅ Interactive patient simulations
- ✅ Book-style exams with auto-expanding textareas
- ✅ Knowledge engine with difficulty levels
- ✅ Medical translator (bidirectional)
- ✅ Session persistence & resumption
- ✅ Mobile-optimized UI with proper spacing
- ✅ History tracking & analytics

### Planned (Upcoming)
- 🔄 AI-powered spaced repetition scheduling
- 🔄 Peer comparison (anonymized performance metrics)
- 🔄 Integration with APTA/RCEP guidelines
- 🔄 Video annotation for assessment techniques
- 🔄 Multi-language support
- 🔄 Offline-first progressive web app (PWA)
- 🔄 Analytics dashboard for educators

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification is prohibited.

---

## 🤝 Contributing

This is a private repository. Contact the maintainers for contribution guidelines.

---

## 📞 Support & Feedback

- **Issues**: Report bugs via Git issues
- **Feedback**: Contact the PhysioBrain AI team
- **Documentation**: See inline code comments and this README

---

## 🎓 Educational Context

PhysioBrain AI is designed for physiotherapy students and educators who want to:
- Practice clinical decision-making without patient risk
- Access evidence-based learning resources
- Track long-term improvement in clinical reasoning
- Prepare for board exams with realistic case scenarios
- Understand complex medical terminology in simple terms

---

**Built with ❤️ for physiotherapy education**  
Commit: `prelaunch for beta` | 2026 © PhysioBrain AI Team
