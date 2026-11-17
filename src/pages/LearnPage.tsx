import { Link, Navigate, useParams } from "react-router";
import { BasicsLesson, BassLesson, DrumsLesson, GuitarLesson, PianoLesson } from "../components/Lessons";
import { ui } from "../components/ui";

const TOPICS = [
  { id: "basics", label: "Basics", blurb: "Basahin ang chord, capo, at Nashville numbers", Lesson: BasicsLesson },
  { id: "gitara", label: "Gitara", blurb: "Ang unang 8 chord at mga strum pattern", Lesson: GuitarLesson },
  { id: "piano", label: "Piano", blurb: "Buuin ang chord sa kahit anong key", Lesson: PianoLesson },
  { id: "bass", label: "Bass", blurb: "Hanapin ang root sa E at A string", Lesson: BassLesson },
  { id: "drums", label: "Drums", blurb: "Ang groove ng bawat bahagi ng kanta", Lesson: DrumsLesson },
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
        <h1 className={ui.title}>Matuto</h1>
        <p className={`${ui.muted} mt-1`}>{current.blurb}</p>
      </div>

      <nav aria-label="Mga aralin" className="-mx-5 flex gap-1 overflow-x-auto border-b border-stone-200 px-5 md:mx-0 md:px-0 dark:border-stone-800">
        {TOPICS.map((t) => (
          <Link
            key={t.id}
            to={t.id === "basics" ? "/matuto" : `/matuto/${t.id}`}
            aria-current={t.id === current.id ? "page" : undefined}
            className={`shrink-0 px-3 pt-2 pb-3 ${t.id === current.id ? "border-b-2 border-amber-500 font-semibold" : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <Lesson key={current.id} />
    </div>
  );
}
