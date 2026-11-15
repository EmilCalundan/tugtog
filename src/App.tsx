import { useState } from "react";
import { KEYS, transposeText, usesFlats, suggestCapo } from "./music/transpose";
import "./App.css";

function App() {
  const [chords, setChords] = useState("G D/F# Em C\nG D C C");
  const [fromKey, setFromKey] = useState("G");
  const [toKey, setToKey] = useState("A");

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
    </main>
  );
}

export default App;