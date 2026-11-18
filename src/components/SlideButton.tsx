import type { ReactNode } from "react";
import { Link } from "react-router";

const box = "flex h-[60px] w-full items-center gap-3.5 rounded-full border border-white/10 bg-black/40 p-1.5 pr-5 text-left";
const knob = "knob flex h-12 w-[74px] shrink-0 items-center justify-center rounded-full";
const text = "min-w-0 flex-1 truncate font-digit text-[11px] tracking-[0.08em] text-stone-200";
const chevrons = <span aria-hidden="true" className="text-lg tracking-[-4px] text-stone-500">›››</span>;

export const PLAY = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5l13 7.5-13 7.5z" /></svg>
);
export const PAUSE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" /></svg>
);

type Props = { icon: ReactNode; label: string; ariaLabel?: string };

// Ang malaking "slide" na button ng v4: puting knob sa kaliwa at label sa malapad na font.
// Isang pindot lang ang kailangan (walang tunay na pag-slide), para madali habang may hawak na instrumento.
export function SlideButton({ icon, label, ariaLabel, onClick }: Props & { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={`${box} hover:bg-black/50`}>
      <span className={knob}>{icon}</span>
      <span className={text}>{label}</span>
      {chevrons}
    </button>
  );
}

export function SlideLink({ icon, label, ariaLabel, to }: Props & { to: string }) {
  return (
    <Link to={to} aria-label={ariaLabel ?? label} className={`${box} hover:bg-black/50`}>
      <span className={knob}>{icon}</span>
      <span className={text}>{label}</span>
      {chevrons}
    </Link>
  );
}
