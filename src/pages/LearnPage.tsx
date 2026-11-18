import { Link, Navigate, useParams } from "react-router";
import { BasicsLesson, BassLesson, DrumsLesson, GuitarLesson, PianoLesson } from "../components/Lessons";
import { ui } from "../components/ui";

const TOPICS = [
  { id: "basics", label: "Basics", blurb: "Read chords, capo, and Nashville numbers", Lesson: BasicsLesson },
  { id: "gitara", label: "Guitar", blurb: "Your first 8 chords and strum patterns", Lesson: GuitarLesson },
  { id: "piano", label: "Piano", blurb: "Build a chord in any key", Lesson: PianoLesson },
  { id: "bass", label: "Bass", blurb: "Find the root on the E and A strings", Lesson: BassLesson },
  { id: "drums", label: "Drums", blurb: "The groove for each part of a song", Lesson: DrumsLesson },
] as const;

// Ang Matuto tab: mga aralin para sa bawat instrumento (/matuto/:topic)
export function LearnPage() {
  const { topic = "basics" } = useParams();
  const current = TOPICS.find((t) => t.id === topic);
  if (!current) return <Navigate to="/matuto" replace />;
  const { Lesson } = current;

  return (
    <div className={ui.page}>
      <div>
        <h1 className={ui.title}>Learn</h1>
        <p className={`${ui.muted} mt-1`}>{current.blurb}</p>
      </div>

      <nav aria-label="Lessons" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TOPICS.map((t) => (
          <Link
            key={t.id}
            to={t.id === "basics" ? "/matuto" : `/matuto/${t.id}`}
            aria-current={t.id === current.id ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${t.id === current.id ? "knob" : "border border-white/10 bg-white/[0.05] text-stone-300 hover:bg-white/10"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <Lesson key={current.id} />
    </div>
  );
}
