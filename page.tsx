"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResultsSection from "@/components/ResultsSection";
import { downloadReport } from "@/lib/utils/downloadReport";

const EXAMPLE_COMPANIES = ["Apple", "Tesla", "Microsoft", "Nvidia", "Amazon"];

const STEPS = [
  { id: 1, label: "Company Research", icon: "🔍" },
  { id: 2, label: "Financial Analysis", icon: "📊" },
  { id: 3, label: "Competitive Analysis", icon: "🏆" },
  { id: 4, label: "Risk Assessment", icon: "⚠️" },
  { id: 5, label: "Investment Decision", icon: "🎯" },
];

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (name?: string) => {
    const target = name ?? companyName;
    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep(1);

    // Simulate step progression for UX (actual steps happen server-side)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: target }),
      });

      clearInterval(stepInterval);
      setCurrentStep(STEPS.length);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") analyze();
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center text-lg">
              📈
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              AI Research Agent
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Investment Research{" "}
            <span className="gradient-text">Agent</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Powered by LangGraph · Gemini 2.0 Flash · Tavily Search
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Search box */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-400 mb-3">
            Enter a company name to analyze
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Apple, Tesla, Microsoft..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => analyze()}
              disabled={loading || !companyName.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? "Analyzing..." : "Analyze →"}
            </button>
          </div>

          {/* Example companies */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-600">Try:</span>
            {EXAMPLE_COMPANIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCompanyName(c);
                  analyze(c);
                }}
                disabled={loading}
                className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full border border-gray-700 transition-colors disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state with step tracker */}
        {loading && (
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-medium">
                Running LangGraph analysis pipeline...
              </span>
            </div>
            <div className="space-y-3">
              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : isDone
                        ? "bg-emerald-500/5 border border-emerald-500/20"
                        : "bg-gray-800/30 border border-gray-800"
                    }`}
                  >
                    <span className="text-lg">
                      {isDone ? "✅" : isActive ? "⏳" : step.icon}
                    </span>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-blue-400"
                            : isDone
                            ? "text-emerald-400"
                            : "text-gray-500"
                        }`}
                      >
                        Node {step.id}: {step.label}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="card border-red-500/30 bg-red-500/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-red-400 font-medium">Analysis Failed</div>
                <div className="text-sm text-gray-400 mt-1">{error}</div>
                <div className="text-xs text-gray-600 mt-2">
                  Make sure GOOGLE_API_KEY and TAVILY_API_KEY are set in your .env.local
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <ResultsSection
            result={result}
            onDownload={() => downloadReport(result)}
          />
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔭</div>
            <h2 className="text-xl font-semibold text-gray-400">
              Research any public company
            </h2>
            <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto">
              The agent runs 5 specialized LangGraph nodes — company research,
              financial analysis, competitive positioning, risk assessment, and
              investment decision.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
