export const btnBase =
  "inline-flex items-center justify-center min-h-11 px-5 rounded-[10px] border border-transparent font-semibold cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed";

export const btnPrimary = `${btnBase} bg-brand text-white hover:bg-brand-deep`;

export const btnOutline = `${btnBase} bg-surface text-brand border-brand hover:bg-brand-soft`;

export const btnGhost = `${btnBase} bg-transparent text-white border-white/55 hover:bg-white/10`;

export const inputClass =
  "w-full min-h-11 px-3 rounded-[10px] border border-line bg-white text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft";
