// Mga icon na ginagamit sa buong app (stroke style, sumusunod sa kulay ng text)
type IconProps = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const MusicIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
);
export const ListIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
);
export const LearnIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></svg>
);
export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const BackIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M15 6l-6 6 6 6" /></svg>
);
export const ChevronIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M9 6l6 6-6 6" /></svg>
);
export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const PlayIcon = ({ className }: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" className={className}><path d="M7 5v14l12-7z" /></svg>
);
export const ExpandIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const LinkIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
);
export const EditIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
);
