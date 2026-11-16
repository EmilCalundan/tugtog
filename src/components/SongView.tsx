import { isChordLine, isSectionLine } from "../music/transpose";

type SongViewProps = {
  text: string;
  className?: string;
};

// Ipinapakita ang kanta: may kulay ang section, chords, at lyrics
export function SongView({ text, className = "" }: SongViewProps) {
  const lines = text.split("\n");

  return (
    <div className={`whitespace-pre-wrap font-mono ${className}`}>
      {lines.map((line, index) => {
        if (isSectionLine(line)) {
          return (
            <div key={index} className="mt-4 text-[0.75em] font-bold uppercase tracking-widest text-stone-500 first:mt-0">
              {line.trim().slice(1, -1)}
            </div>
          );
        }
        if (isChordLine(line)) {
          return (
            <div key={index} className="font-bold text-amber-600 dark:text-amber-400">
              {line}
            </div>
          );
        }
        // Lyrics, o blangkong linya (may espasyo para hindi mawala ang taas)
        return <div key={index}>{line || " "}</div>;
      })}
    </div>
  );
}
