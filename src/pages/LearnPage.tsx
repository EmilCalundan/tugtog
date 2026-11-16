import { ui } from "../components/ui";

const COMING = [
  { name: "Gitara", text: "Chord shapes sa fretboard at strumming pattern bawat section" },
  { name: "Piano", text: "Voicings para sa kaliwa at kanang kamay" },
  { name: "Bass", text: "Root notes at simpleng approach notes bawat bar" },
  { name: "Drums", text: "Animated na drum kit na may groove bawat section" },
];

export function LearnPage() {
  return (
    <div className={ui.page}>
      <p className={ui.eyebrow}>Paparating</p>
      <h1 className={ui.title}>Matuto</h1>
      <p className="text-stone-600 dark:text-stone-300">Mga tutorial para sa bawat instrumento, mula sa mga kanta mo mismo.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {COMING.map((item) => (
          <li key={item.name} className={`${ui.card} p-5`}>
            <h2 className="font-display text-xl font-bold">{item.name}</h2>
            <p className={`${ui.muted} mt-1`}>{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
