import { useEffect, useState } from "react";
import { KEYS, transposeText, usesFlats, suggestCapo, nashvilleText } from "./music/transpose";
import "./App.css";

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

  const semitones = KEYS.indexOf(toKey) - KEYS.indexOf(fromKey);
  const result = transposeText(chords, semitones, usesFlats(toKey));

  const capo = suggestCapo(toKey);
  const shapeSemitones = KEYS.indexOf(capo.shape) - KEYS.indexOf(fromKey);
  const shapeChords = transposeText(chords, shapeSemitones);
  

  return (
    <main className="transposer">
      <h1>Tugtog</h1>
      <p>I-type ang chords, pumili ng key, at makikita agad ang bagong chords.</p>

      <div className="keys">
        <label>
          Original key
          <select value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
            {KEYS.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>

        <label>
          Bagong key
          <select value={toKey} onChange={(e) => setToKey(e.target.value)}>
            {KEYS.map((note) => (
              <option key={note} value={note}>{note}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Chords
        <textarea
          rows={6}
          value={chords}
          onChange={(e) => setChords(e.target.value)}
        />
      </label>

      <h2>Resulta</h2>
      <pre className="result">{result}</pre>

            <h2>Para sa gitara</h2>
      {capo.capo === 0 ? (
        <p>Walang capo. Tugtugin ang chords sa itaas.</p>
      ) : (
        <>
          <p>
            Capo {capo.capo}, gamitin ang {capo.shape} shapes:
          </p>
          <pre className="result">{shapeChords}</pre>
        </>
      )}

      <h2>Nashville numbers</h2>
      <p>Pareho sa kahit anong key. Gamit ito ng maraming worship team.</p>
      <pre className="result">{nashvilleText(chords, fromKey)}</pre>
    </main>
  );
}

export default App;