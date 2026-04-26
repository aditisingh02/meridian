"use client";

import { useState, useRef, useEffect } from "react";
import { api, AgentRun, AgentStep } from "@/lib/api";
import {
  Brain,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Wrench,
} from "lucide-react";

const SUGGESTED_GOALS = [
  "What is the current sprint health?",
  "Are there any critical Sentry errors related to data pipelines?",
  "Check dbt pipeline health and GitHub PR velocity",
  "Investigate if our on-call team needs to be paged",
];

function StepCard({ step }: { step: AgentStep }) {
  const [expanded, setExpanded] = useState(false);

  const icon =
    step.type === "conclusion" ? (
      <CheckCircle2 className="w-4 h-4 text-green-400" />
    ) : step.type === "action" ? (
      <Zap className="w-4 h-4 text-yellow-400" />
    ) : (
      <Eye className="w-4 h-4 text-blue-400" />
    );

  const label =
    step.type === "conclusion"
      ? "Conclusion"
      : step.type === "action"
      ? `Action${step.dry_run ? " (dry run)" : ""}: ${step.tool}`
      : `Observed: ${step.tool}`;

  const borderColor =
    step.type === "conclusion"
      ? "border-green-500/30"
      : step.type === "action"
      ? "border-yellow-500/30"
      : "border-blue-500/20";

  return (
    <div className={`border ${borderColor} rounded-lg bg-[#0d0d0d] overflow-hidden`}>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-gray-400">
          {step.step}
        </span>
        {icon}
        <span className="text-sm text-gray-300 flex-1 truncate">{label}</span>
        {step.type !== "conclusion" &&
          (expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
          ))}
      </button>

      {step.type === "conclusion" && (
        <div className="px-4 pb-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {step.content}
        </div>
      )}

      {step.type !== "conclusion" && expanded && (
        <div className="px-4 pb-3 space-y-2">
          {step.args && Object.keys(step.args).length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Args</div>
              <pre className="text-xs text-gray-400 bg-black/30 rounded p-2 overflow-x-auto">
                {JSON.stringify(step.args, null, 2)}
              </pre>
            </div>
          )}
          {step.result !== undefined && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Result</div>
              <pre className="text-xs text-gray-400 bg-black/30 rounded p-2 overflow-x-auto max-h-40">
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunResult({ run }: { run: AgentRun }) {
  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Wrench className="w-3.5 h-3.5" />
        <span>{run.steps_taken} steps · {run.duration_s}s</span>
        {run.dry_run && (
          <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] border border-yellow-500/20">
            DRY RUN
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {run.steps.map((step, i) => (
          <StepCard key={i} step={step} />
        ))}
      </div>
      {run.actions_taken.length > 0 && (
        <div className="mt-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
          <div className="text-xs text-yellow-400 font-medium mb-1">Actions taken</div>
          {run.actions_taken.map((a, i) => (
            <div key={i} className="text-xs text-gray-400 font-mono">{a}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentChat() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (goalText?: string) => {
    const g = (goalText ?? goal).trim();
    if (!g || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const run = await api.runAgent(g, dryRun);
      setResult(run);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Agent failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vercel-card rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Agent</div>
            <div className="text-xs text-gray-500">ReAct · Groq Llama 3.3 70B</div>
          </div>
        </div>
        <button
          onClick={() => setDryRun((p) => !p)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            dryRun
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          {dryRun ? "Dry Run" : "Live Mode"}
        </button>
      </div>

      {/* Suggested goals */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => submit(g)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask the agent anything about your stack…"
          className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          onClick={() => submit()}
          disabled={loading || !goal.trim()}
          className="px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Agent is reasoning…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && <RunResult run={result} />}
    </div>
  );
}
