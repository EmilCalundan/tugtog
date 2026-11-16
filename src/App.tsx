import { useEffect, useState } from "react";
import { KEYS, transposeText, usesFlats, suggestCapo, nashvilleText } from "./music/transpose";
import { Account } from "./components/Account";
import { Library } from "./components/Library";

// Kunin ang naka-save na value sa browser, o ang default kung wala
function load(name: string, fallback: string): string {
  try {
    return localStorage.getItem(name) ?? fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [chords, setChords] = useState(() => load("tugtog-chords", "G D/F# Em C\nG D C C"));
  const [fromKey, setFromKey] = useState(() => load("tugtog-from", "G"));
  const [toKey, setToKey] = useState(() => load("tugtog-to", "A"));
  const [theme, setTheme] = useState(() => load("tugtog-theme", "light"));

  // I-save sa browser tuwing may nagbabago
  useEffect(() => {
    try {
      localStorage.setItem("tugtog-chords", chords);
      localStorage.setItem("tugtog-from", fromKey);
      localStorage.setItem("tugtog-to", toKey);
    } catch {
      // Walang problema kung hindi makapag-save, gaya ng sa private mode
    }
  }, [chords, fromKey, toKey]);

  // Ilagay o tanggalin ang class na "dark", at tandaan ang napili
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("tugtog-theme", theme);
    } catch {
      // Walang problema kung hindi makapag-save
    }
  }, [theme]);

  const semitones = KEYS.indexOf(toKey) - KEYS.indexOf(fromKey);
  const result = transposeText(chords, semitones, usesFlats(toKey));

  const capo = suggestCapo(toKey);
  const shapeSemitones = KEYS.indexOf(capo.shape) - KEYS.indexOf(fromKey);
  const shapeChords = transposeText(chords, shapeSemitones);

  const selectClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-lg font-bold text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Tugtog<span className="text-amber-500">.</span>
            </h1>
            <p className="mt-1 text-stone-600 dark:text-stone-400">
              I-type ang chords, pumili ng key, at makikita agad ang bagong chords.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Gawing light mode" : "Gawing dark mode"}
            className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-2 text-lg hover:border-amber-500 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>

        <Account />

        <Library
          chords={chords}
          fromKey={fromKey}
          onLoad={(song) => {
            setChords(song.content);
            setFromKey(song.original_key);
          }}
        />

        <section className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
            Original key
            <select className={selectClass} value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
              {KEYS.map((note) => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </label>

          <span className="pb-2 text-2xl text-stone-400" aria-hidden="true">→</span>

          <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
            Bagong key
            <select className={selectClass} value={toKey} onChange={(e) => setToKey(e.target.value)}>
              {KEYS.map((note) => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </label>
        </section>

        <label className="flex flex-col gap-1 text-sm font-semibold text-stone-600 dark:text-stone-400">
          Chords
          <textarea
            rows={5}
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white p-3 font-mono text-base text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>

        <section className="rounded-xl border-2 border-amber-500 bg-white p-5 dark:bg-stone-900">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Resulta · key ng {toKey}
          </h2>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-2xl font-bold">{result}</pre>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl bg-white p-4 dark:bg-stone-900">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Para sa gitara</h2>
            {capo.capo === 0 ? (
              <p className="mt-2 text-sm">Walang capo. Tugtugin ang resulta sa itaas.</p>
            ) : (
              <>
                <p className="mt-2 text-sm">
                  <strong>Capo {capo.capo}</strong>, gamitin ang {capo.shape} shapes:
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-mono text-lg font-bold">{shapeChords}</pre>
              </>
            )}
          </section>

          <section className="rounded-xl bg-white p-4 dark:bg-stone-900">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Nashville numbers</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Pareho sa kahit anong key.</p>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-lg font-bold">{nashvilleText(chords, fromKey)}</pre>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;