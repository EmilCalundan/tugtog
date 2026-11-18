import { isChordLine, isSectionLine } from "../music/transpose";

type SongViewProps = {
  text: string;
  className?: string;
};

// Ipinapakita ang kanta: abo ang section, puti ang chords, at bahagyang malabo ang lyrics
export function SongView({ text, className = "" }: SongViewProps) {
  const lines = text.split("\n");

  return (
    <div className={`whitespace-pre-wrap font-mono ${className}`}>
      {lines.map((line, index) => {
        if (isSectionLine(line)) {
          return (
            <div key={index} className="mt-5 font-sans text-[0.62em] font-medium uppercase tracking-[0.2em] text-stone-500 first:mt-0">
              {line.trim().slice(1, -1)}
            </div>
          );
        }
        if (isChordLine(line)) {
          return (
            <div key={index} className="font-bold text-stone-50">
              {line}
            </div>
          );
        }
        // Lyrics, o blangkong linya (may espasyo para hindi mawala ang taas)
        return <div key={index} className="text-stone-300">{line || " "}</div>;
      })}
    </div>
  );
}
