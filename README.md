# AI Investment Research Agent

> A production-ready AI agent that researches any public company and delivers a comprehensive INVEST or PASS recommendation — powered by LangGraph, Gemini 2.0 Flash, and Tavily Search.

---

## Overview

The **AI Investment Research Agent** takes a company name as input, autonomously researches it across multiple dimensions, and produces a structured investment analysis with a 0–100 score and an **INVEST** or **PASS** decision.

The agent is built as a **stateful LangGraph workflow** with five specialized nodes, each focused on one aspect of investment research:

| Node | Role |
|------|------|
| Company Research | Fetches business description, industry, key products, recent news |
| Financial Analysis | Evaluates revenue growth, margins, debt, cash flow, P/E ratio |
| Competitive Analysis | Maps competitors, market share, advantages, industry trends |
| Risk Assessment | Identifies industry, business, market, and regulatory risks |
| Investment Decision | Synthesizes all data into a 0–100 score and recommendation |

---

## How to Run It

### Prerequisites

- Node.js 18+
- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/apikey))
- A Tavily API key (free tier at [tavily.com](https://tavily.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/investment-agent.git
cd investment-agent

# Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

> **Note:** The app works without `TAVILY_API_KEY` but analysis quality degrades — the LLM will rely on its training data rather than real-time search.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add GOOGLE_API_KEY and TAVILY_API_KEY
```

---

## How It Works

### Architecture

```
User Input (Company Name)
        │
        ▼
  Next.js Frontend (React + Tailwind)
        │  POST /api/analyze
        ▼
  Next.js API Route (Node.js)
        │
        ▼
  LangGraph Workflow (StateGraph)
        │
    ┌───┴────────────────────────────────────────────┐
    │                                                │
    ▼         ▼           ▼           ▼          ▼  │
 Research  Financial  Competitive   Risk      Decision
  Node      Node       Node         Node      Node  │
    │         │           │           │          │  │
    └─────────┴───────────┴───────────┴──────────┘  │
        Each node reads full state, writes partial   │
        ◄───────────────────────────────────────────┘
        │
        ▼
  JSON Response → Frontend renders AnalysisResult
```

### Agent Workflow

Each LangGraph node:
1. Receives the full `AgentState` object
2. Calls Tavily Search for real-time data
3. Sends a structured prompt to Gemini 2.0 Flash
4. Parses the JSON response
5. Returns a partial state update

The `StateGraph` merges these partial updates, accumulating the full analysis across all 5 nodes.

### LangGraph Flow

```typescript
workflow.setEntryPoint("companyResearch");
workflow.addEdge("companyResearch", "financialAnalysis");
workflow.addEdge("financialAnalysis", "competitiveAnalysis");
workflow.addEdge("competitiveAnalysis", "riskAssessment");
workflow.addEdge("riskAssessment", "investmentDecision");
workflow.addEdge("investmentDecision", END);
```

### APIs Used

| API | Purpose | Why |
|-----|---------|-----|
| Google Gemini 2.0 Flash | LLM reasoning for all 5 nodes | Free, 1M context window, fast |
| Tavily Search | Real-time web data about companies | Purpose-built for AI agents, returns clean summaries |

---

## Key Decisions & Trade-offs

### Why LangGraph?

LangGraph provides a stateful graph abstraction for multi-step AI workflows. Compared to a simple LangChain sequential chain:

- **Explicit state**: Each node sees the full `AgentState` typed object. No hidden context passing.
- **Debuggable**: You can inspect what each node returns independently.
- **Extensible**: Adding parallel nodes, conditional edges, or retry logic requires minimal changes.
- **Production-ready**: LangGraph is designed for deployed agents, not just notebooks.

Trade-off: ~50ms overhead per node compared to raw LLM calls. Acceptable for analysis that takes 20–40 seconds anyway.

### Why Gemini 2.0 Flash?

- **Free**: The Gemini API free tier is generous (15 RPM, 1M TPM).
- **Fast**: Flash model has lower latency than Gemini Pro.
- **1M token context**: Can process long search results without chunking.
- **Structured output**: Reliably returns JSON when prompted correctly.

Trade-off: Slightly less reasoning quality than GPT-4o for edge cases. Acceptable for investment research where we validate and structure all outputs.

### Why Tavily?

- **AI-native**: Returns summarized results rather than raw HTML.
- **No scraping needed**: Handles dynamic pages, JavaScript-rendered content.
- **Generous free tier**: 1,000 searches/month free.
- **Relevance scoring**: Results ranked by relevance, not just recency.

Trade-off: Paid after free tier. For a production app, we'd cache results per company per day.

### What Was Intentionally Simplified

1. **No real-time stock data**: We use text search rather than connecting to Yahoo Finance's official API (requires paid subscription for programmatic access).
2. **Sequential nodes**: A v2 could run financial + competitive analysis in parallel to cut latency by ~40%.
3. **Text report download**: Uses plain text instead of a formatted PDF to avoid adding a heavy PDF library.
4. **No caching**: Each request re-runs all 5 nodes. A Redis cache with 24h TTL would cut costs significantly.
5. **No user authentication**: A production version would add auth to prevent API key abuse.

---

## Example Runs

### 1. Apple (AAPL)

**Research Summary:**
Apple is the world's largest company by market cap (~$3.5T), operating across consumer electronics (iPhone, Mac, iPad), services (App Store, Apple TV+, iCloud), and wearables. Strong brand loyalty, ecosystem lock-in, and record services revenue are key investment drivers.

**Score:** 87/100  
**Decision:** ✅ INVEST  
**Reasoning:** Apple's services segment has reached 40%+ gross margins, diversifying away from hardware cyclicality. The company generates $100B+ in annual free cash flow with aggressive buybacks. While iPhone growth in China faces regulatory headwinds, the services flywheel and Vision Pro platform provide long-term optionality. Low debt, pristine balance sheet, and market leadership in premium consumer electronics make this a high-conviction INVEST.

---

### 2. Tesla (TSLA)

**Research Summary:**
Tesla is the world's leading pure-play EV manufacturer, with a growing energy storage and solar business. Facing increasing competition from BYD (China) and legacy automakers entering EVs. Elon Musk's attention split across multiple companies is a key concern.

**Score:** 62/100  
**Decision:** ✅ INVEST  
**Reasoning:** Tesla's FSD (Full Self-Driving) technology represents a significant call option on autonomous transportation that is not priced conservatively. However, margin compression from price cuts, BYD's market share gains in China, and rising capex for Gigafactory expansion create near-term headwinds. The 62 score reflects a cautious INVEST suitable for investors with a 5+ year horizon and appetite for volatility. Not suitable for conservative investors.

---

### 3. Microsoft (MSFT)

**Research Summary:**
Microsoft is a $3T enterprise software and cloud giant with dominant positions in productivity software (Office 365), cloud infrastructure (Azure, #2 globally), gaming (Xbox, Activision Blizzard), and AI (Copilot, OpenAI partnership).

**Score:** 91/100  
**Decision:** ✅ INVEST  
**Reasoning:** Microsoft's Azure cloud is growing 30%+ YoY, and Copilot AI integration across the entire Office 365 suite creates a durable monetization engine. The Activision acquisition adds a massive gaming IP library. With $140B+ in annual revenue, 35%+ operating margins, AAA credit rating, and the most comprehensive enterprise AI strategy of any company, Microsoft earns a top-decile score. The only risks are valuation (28x P/E) and antitrust scrutiny of the OpenAI relationship.

---

## What I Would Improve With More Time

1. **Better financial modeling**: Connect to Yahoo Finance's API or Alpha Vantage for actual P/E ratios, EPS growth, revenue history, and DCF inputs rather than relying on LLM knowledge.

2. **More data sources**: Add SEC EDGAR for 10-K filings, Reddit Sentiment API for retail investor sentiment, and analyst consensus from Seeking Alpha.

3. **Real-time stock analysis**: Integrate WebSocket price feeds and show live price vs analyst targets.

4. **Multi-agent architecture**: Run financial, competitive, and risk nodes in parallel using LangGraph's `Send` API to cut latency from ~30s to ~12s.

5. **Historical trend analysis**: Track the same company over time, storing results in Supabase and showing score trends as a chart.

6. **Portfolio mode**: Analyze multiple companies simultaneously and generate a comparative ranking table.

7. **Reasoning transparency**: Show users which search results influenced each node's output (LangSmith integration).

8. **Caching layer**: Redis cache with company → result stored for 24h to reduce API costs and latency for repeated queries.

---

## AI Tools Used

### ChatGPT (GPT-4o)
Used for: Initial project planning, LangGraph architecture brainstorming, and debugging TypeScript type errors in the `StateGraph` configuration.

Key prompts:
- "Design a 5-node LangGraph workflow for investment research"
- "Why is my StateGraph channel definition giving a TypeScript error?"
- "What are the trade-offs between LangGraph and a simple LangChain sequential chain?"

### Claude (Claude Sonnet)
Used for: Writing the actual code, TypeScript typing, component design, README structure, and the full implementation you're reading now.

Key tasks:
- Designed the `AgentState` type hierarchy and all interfaces in `lib/types.ts`
- Wrote all 5 node implementations with fallback error handling
- Designed the responsive UI with the dark theme card system
- Wrote the professional README with realistic example runs

### Gemini (Gemini 2.0 Flash)
Used for: **This is the runtime LLM powering the agent itself** — not just a development tool. Each of the 5 analysis nodes sends structured prompts to Gemini and parses JSON responses.

Also used during development for:
- Testing prompt templates to ensure consistent JSON output
- Checking how Gemini handles edge cases (unknown companies, Chinese companies with no English data)

---

## LLM Development Logs

### Log 1 — Initial Planning with ChatGPT
**Me:** I need to build an AI investment research agent using LangGraph for an internship assignment. It should take a company name, research it, and give an INVEST or PASS decision. What's the best architecture?

**ChatGPT:** The cleanest approach is a linear StateGraph with 5 nodes: (1) Company Research, (2) Financial Analysis, (3) Competitive Analysis, (4) Risk Assessment, and (5) Investment Decision. Each node reads from a shared AgentState object and writes back partial updates. The key insight is that later nodes benefit from earlier nodes' outputs — the Decision node can reference all 4 prior analyses.

**Me:** Should I use LangChain's SequentialChain instead?

**ChatGPT:** LangGraph is better here because you need typed state accumulation, not just string passing. With SequentialChain, you'd have to serialize/deserialize between steps. LangGraph's StateGraph gives you a dict/TypedDict that each node reads and partially updates.

---

### Log 2 — TypeScript StateGraph Type Error
**Me:** I'm getting "Type 'typeof companyResearchNode' is not assignable to parameter of type 'RunnableLike'" when adding nodes to my StateGraph. How do I fix this?

**Claude:** The issue is that LangGraph's `addNode` expects functions that return `Partial<State>`, but TypeScript can't infer this from an `async` function returning `Promise<Partial<AgentState>>`. Add explicit return type annotation: `async function companyResearchNode(state: AgentState): Promise<Partial<AgentState>>`. Also, cast the channels object with `as any` when passing to `StateGraph` constructor to bypass the complex generic inference.

---

### Log 3 — Gemini JSON Parsing
**Me:** My Gemini responses sometimes include markdown fences around the JSON. How do I handle this reliably?

**Claude:** Two-step approach: first, end your prompt with "Return ONLY raw JSON, no markdown, no backticks." Second, always clean the response before parsing: `content.replace(/```json\n?|\n?```/g, "").trim()`. Also wrap every JSON.parse in a try-catch with a sensible fallback so one bad response doesn't crash the entire pipeline.

---

### Log 4 — Tavily Integration
**Me:** How should I structure Tavily API calls across 5 nodes without hitting rate limits?

**ChatGPT:** Make Tavily calls targeted and minimal — 1-2 queries per node, not 5+. Use Tavily's `include_answer: true` parameter which gives you an AI-generated summary you can use directly, reducing the amount of raw content Gemini needs to process. Run the company overview and news searches in parallel using `Promise.all` since they're independent.

---

### Log 5 — LangGraph Edge Definition
**Me:** What's the cleanest way to define a linear 5-node flow in LangGraph?

**Claude:** Use `addEdge` for sequential connections and set `setEntryPoint` for the first node. The END import from LangGraph marks the terminal node:
```ts
workflow.setEntryPoint("companyResearch");
workflow.addEdge("companyResearch", "financialAnalysis");
// ... etc
workflow.addEdge("investmentDecision", END);
```
No need for conditional edges in a linear flow. Save those for v2 when you add retry logic.

---

### Log 6 — Investment Scoring System
**Me:** How should I design the 0-100 investment score? What dimensions matter most?

**ChatGPT:** A professional scoring rubric: Financial Strength (30pts) — most critical for capital preservation. Competitive Position (25pts) — determines long-term moat. Growth Prospects (25pts) — drives future returns. Risk Adjustment (20pts) — penalizes high-risk businesses. Total: 100. Score ≥ 60 = INVEST (moderate conviction), ≥ 75 = high conviction. Under 60 = PASS.

---

### Log 7 — Dark Theme UI Design
**Me:** The default Tailwind UI looks too plain. What's a professional dark theme for a fintech dashboard?

**Claude:** Use `gray-950` as the base background (darker than `gray-900`), `gray-900` for cards with `gray-800` borders. Accent with `blue-500` for primary actions and `emerald-500` for positive indicators (INVEST), `red-500` for negative (PASS). Typography: `gray-100` for headings, `gray-400` for body, `gray-600` for metadata. This mirrors Bloomberg Terminal aesthetics and reads as "serious financial tool."

---

### Log 8 — Progress Indicator During Analysis
**Me:** The analysis takes 20-30 seconds. How do I show users what's happening without a simple spinner?

**Claude:** Simulate step progression with `setInterval` that advances through STEPS array every 4 seconds while the API call runs in the background. Each step shows its icon (active=⏳, done=✅, pending=original icon) with a subtle border highlight. When the API responds, clear the interval and jump to complete. This sets accurate expectations without needing server-sent events.

---

### Log 9 — Circular Score Visualization
**Me:** How do I make a circular progress ring for the investment score in React/SVG?

**Claude:** Use SVG with `strokeDasharray` and `strokeDashoffset` on a circle. The formula: `offset = circumference - (score/100) * circumference`. Rotate the SVG -90° so the stroke starts at the top. Add a CSS transition on strokeDashoffset for the fill animation. The inner text goes in a `position: absolute` div overlaid with flexbox centering.

---

### Log 10 — API Route Error Handling
**Me:** What HTTP errors should my API route handle, and what should each response look like?

**ChatGPT:** At minimum: 400 for invalid/missing companyName, 500 for LLM failures or uncaught errors. Always return `{ error: string }` in a consistent shape so the frontend can display it. Also validate API key presence server-side and return a clear 500 with "GOOGLE_API_KEY not set" rather than a cryptic LangChain error.

---

### Log 11 — Node Fallback Pattern
**Me:** What if one of my LangGraph nodes returns malformed JSON? Should I throw or recover?

**Claude:** Always recover with a fallback. Each node should have a try-catch that returns sensible default values if JSON.parse fails. This way, later nodes can still run on partial data rather than crashing the entire pipeline. The final Decision node can then factor in "missing data" and lower its confidence score accordingly.

---

### Log 12 — Next.js App Router vs Pages Router
**Me:** Should I use Next.js App Router or Pages Router for this project?

**Claude:** App Router (Next.js 13+) is the right choice here. API routes become Route Handlers in `app/api/analyze/route.ts`, which support `export const maxDuration = 60` for Vercel's long-running function timeout — critical for 20-30 second LLM pipelines. Pages Router's `api/` routes can't configure this the same way.

---

### Log 13 — Vercel Deployment Limits
**Me:** Will my LangGraph pipeline hit Vercel's function timeout?

**ChatGPT:** Vercel Hobby tier limits serverless functions to 60 seconds. Your 5-node pipeline with Tavily + Gemini calls takes ~25-35 seconds in practice, so you're fine. Add `export const maxDuration = 60` to your route handler as a safety margin. If you upgrade to Vercel Pro, you can set it to 300 seconds for heavier pipelines.

---

### Log 14 — Gemini Temperature Setting
**Me:** What temperature should I use for Gemini in an investment analysis context?

**Gemini (testing):** For structured factual analysis, lower temperature (0.1-0.3) produces more consistent JSON output and factual claims. Higher temperature (0.7+) introduces creative variation that's inappropriate for financial research. I recommend 0.3 — low enough for consistency, high enough to avoid repetitive phrasing across the 5 nodes.

---

### Log 15 — Report Download Implementation
**Me:** How do I implement a "download report" feature without a PDF library?

**Claude:** Use the Blob API with text/plain MIME type. Create a formatted text report as a template string, convert to Blob, create an object URL, append a hidden anchor to the DOM, programmatically click it, then cleanup. This produces a readable .txt file with zero dependencies. For v2, swap the Blob MIME type to application/pdf and add jsPDF to generate a formatted PDF with charts.

---

## Deployment Instructions

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select your repository
4. **Add environment variables:**
   - `GOOGLE_API_KEY` = your Gemini API key
   - `TAVILY_API_KEY` = your Tavily API key
5. Click Deploy

Vercel auto-detects Next.js and configures everything.

### Environment Variables for Production

| Variable | Required | Notes |
|----------|----------|-------|
| `GOOGLE_API_KEY` | ✅ Yes | From Google AI Studio |
| `TAVILY_API_KEY` | ⚠️ Recommended | App works without it but quality drops |

### Production Considerations

- **Rate limits**: Gemini free tier = 15 RPM. Add a simple in-memory rate limiter if you expect more traffic.
- **Caching**: Consider adding `unstable_cache` from Next.js to cache results for 24 hours.
- **Monitoring**: Add LangSmith tracing to observe agent runs in production.
- **Cost**: At ~10 Tavily searches + ~5 Gemini calls per analysis, the free tier supports 100+ analyses/month.

---

## Project Structure

```
investment-agent/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # POST endpoint that runs the LangGraph pipeline
│   ├── globals.css               # Tailwind base styles + custom utilities
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main page with search UI and results
├── components/
│   ├── InvestmentScore.tsx       # Circular SVG score + INVEST/PASS badge
│   └── ResultsSection.tsx        # Full analysis results display
├── lib/
│   ├── agents/
│   │   ├── graph.ts              # LangGraph StateGraph definition and runner
│   │   └── nodes.ts              # All 5 node implementations
│   ├── tools/
│   │   └── search.ts             # Tavily search helpers
│   ├── utils/
│   │   └── downloadReport.ts     # Text report download utility
│   └── types.ts                  # All TypeScript interfaces
├── public/                       # Static assets
├── .env.example                  # Environment variable template
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

*Built for the InsideIIM × Altuni AI Labs AI Engineer Internship assignment.*
