/**
 * POST /api/analyze
 * Receives a company name, runs the LangGraph pipeline, returns AnalysisResult JSON.
 *
 * Design decisions:
 * - Uses Next.js Route Handlers (App Router) for cleaner server-side logic
 * - Sets maxDuration to 60s (Vercel Hobby limit) — LLM calls can be slow
 * - Returns structured errors with appropriate HTTP status codes
 */

import { NextRequest, NextResponse } from "next/server";
import { runInvestmentResearch } from "@/lib/agents/graph";

// Tell Vercel this is a long-running function (max 60s on Hobby, 300s on Pro)
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName } = body;

    // Input validation
    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json(
        { error: "companyName is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmed = companyName.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      return NextResponse.json(
        { error: "Company name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Check required env vars
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: GOOGLE_API_KEY is not set" },
        { status: 500 }
      );
    }

    // Run the LangGraph pipeline
    const result = await runInvestmentResearch(trimmed);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Investment research error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
