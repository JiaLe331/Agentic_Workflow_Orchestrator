"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLiveStatus } from "@/context/LiveStatusContext";

export default function Home() {
  const [prompt, setPrompt] = useState("");

  const {
    generateAgent,
    isGenerating,
    isOpen,
  } = useLiveStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await generateAgent(prompt);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">

      {/* Global LiveWorkflowStatus is rendered in layout */}

      {!isGenerating && !isOpen && (
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            What agent do you want to build?
          </h1>
          <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400">
            Describe your workflow in plain English, and we&apos;ll orchestrate the n8n nodes for you.
          </p>

          <form onSubmit={handleSubmit} className="relative mx-auto w-full">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 dark:border-zinc-800 dark:bg-zinc-900">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={4}
                className="block w-full resize-none border-0 bg-transparent py-4 placeholder:text-zinc-400 focus:ring-0 sm:text-sm sm:leading-6 text-zinc-900 dark:text-white px-4"
                placeholder="e.g., Create a sales agent that qualifies leads from Typeform, enriches them with Clearbit, and updates HubSpot..."
              />
              <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex gap-2 text-xs text-zinc-500">
                  <span>Smart context aware</span>
                  <span>•</span>
                  <span>n8n native</span>
                </div>
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="inline-flex items-center gap-x-2 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Agent
                  <Sparkles className="-mr-0.5 h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["Sales Outreach", "HR Onboarding", "Finance Approval"].map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(`Create a ${example} workflow...`)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {example}...
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
