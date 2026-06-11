import React from 'react';
import { AlertTriangle, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Conflict } from '../types';

interface ConflictBannerProps {
  conflicts: Conflict[];
  onSolveConflicts: () => void;
  onAutoGenerate: () => void;
  isLoading: boolean;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onSolveConflicts,
  onAutoGenerate,
  isLoading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 print:hidden transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {conflicts.length > 0 ? (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-600 dark:text-amber-400 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}

          <div>
            <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              School Schedule Status
              {conflicts.length > 0 && (
                <span className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  {conflicts.length} Warning{conflicts.length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {conflicts.length > 0
                ? 'Conflicts in teacher, room, or section schedules have been detected. Highlighted in red/yellow in the grid below.'
                : 'Pristine setup! All classes are fully synchronized without overlapping conflicts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {conflicts.length > 0 && (
            <button
              onClick={onSolveConflicts}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Resolve Warns
            </button>
          )}

          <button
            onClick={onAutoGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700/50 transition disabled:opacity-50 cursor-pointer"
            title="Generates a balanced schedule from scratch"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Auto-Generate Grid
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="text-xs p-2.5 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50/80 dark:hover:bg-amber-950/20 rounded-md border border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 flex justify-between items-start gap-4 transition"
            >
              <div className="flex gap-2">
                <span className="font-semibold text-amber-700 dark:text-amber-450 uppercase tracking-widest text-[9px] mt-0.5 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                  {conflict.type}
                </span>
                <p className="leading-relaxed font-sans">{conflict.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
