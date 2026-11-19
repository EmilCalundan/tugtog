import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useSession } from "../lib/useSession";
import { deleteSong, getSong, saveSong } from "../lib/songs";
import { KEYS } from "../music/transpose";
import { SONG_STYLES, STRUM_PRESETS, normalizeStrum, parseStrum, strumLength } from "../music/arrangement";
import { strumSlots } from "../music/lessons";
import { StrumView, strumWords } from "../components/StrumView";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import { ui } from "../components/ui";

const TEMPLATE = "[Verse]\n\n\n[Chorus]\n";

// Gumawa ng bagong kanta, o i-edit ang isang naka-save
export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [originalKey, setOriginalKey] = useState("G");
  const [content, setContent] = useState(id ? "" : TEMPLATE);
  const [bpm, setBpm] = useState("72");
  const [time, setTime] = useState<TimeSignature>("4/4");
  const [style, setStyle] = useState<SongStyle>("ballad");
  const [strum, setStrum] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    getSong(id)
      .then((song) => {
        setTitle(song.title);
        setArtist(song.artist);
        setOriginalKey(song.original_key);
        setContent(song.content);
        setBpm(String(song.bpm));
        setTime(song.time_signature);
        setStyle(song.style);
        setStrum(song.strum ?? "");
      })
      .catch(() => setMessage("This song was not found."));
  }, [id]);

  if (session === null) return <Navigate to="/ako" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setMessage("Give the song a title first.");
      return;
    }
    const tempo = Number(bpm);
    if (!Number.isInteger(tempo) || tempo < 40 || tempo > 200) {
      setMessage("Tempo must be 40 to 200 BPM.");
      return;
    }
    const pattern = normalizeStrum(strum);
    if (pattern && !parseStrum(pattern, time)) {
      setMessage(`The strum pattern needs ${strumLength(time)} letters for ${time}: D, U, x or -.`);
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSong(
        { title: title.trim(), artist: artist.trim(), original_key: originalKey, content, bpm: tempo, time_signature: time, style, strum: pattern || null },
        id,
      );
      navigate(`/kanta/${saved.id}`, { replace: true });
    } catch {
      setMessage("Not saved. Try again.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteSong(id);
    navigate("/", { replace: true });
  }

  function addSection(name: string) {
    const gap = content === "" || content.endsWith("\n\n") ? "" : content.endsWith("\n") ? "\n" : "\n\n";
    setContent(`${content}${gap}[${name}]\n`);
  }

  return (
    <form onSubmit={handleSubmit} className={ui.page}>
      <header className="flex items-center justify-between gap-3">
        <Link to={id ? `/kanta/${id}` : "/"} className="font-medium text-stone-400 hover:text-stone-100">
          Cancel
        </Link>
        <h1 className="text-lg font-medium">{id ? "Edit song" : "New song"}</h1>
        <button type="submit" disabled={busy} className={`${ui.primary} h-10 rounded-full`}>
          {busy ? "One moment…" : "Save"}
        </button>
      </header>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
        Title
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`${ui.input} w-full text-lg font-medium`} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Artist
          <input placeholder="Optional" value={artist} onChange={(e) => setArtist(e.target.value)} className={`${ui.input} w-full`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Original key
          <select value={originalKey} onChange={(e) => setOriginalKey(e.target.value)} className={`${ui.input} w-full font-digit text-sm`}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </div>

      {/* Paano tutugtog ang player at drums sa kantang ito */}
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Tempo (BPM)
          <input type="number" inputMode="numeric" min={40} max={200} value={bpm} onChange={(e) => setBpm(e.target.value)} className={`${ui.input} w-full font-digit text-sm`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Time
          <select value={time} onChange={(e) => setTime(e.target.value as TimeSignature)} className={`${ui.input} w-full font-digit text-sm`}>
            <option>4/4</option>
            <option>6/8</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Style
          <select value={style} onChange={(e) => setStyle(e.target.value as SongStyle)} disabled={time === "6/8"} className={`${ui.input} w-full disabled:opacity-50`}>
            {SONG_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <p className="-mt-2 text-xs text-stone-400">
        {time === "6/8" ? "In 6/8, the tempo counts every 3 eighths (beats 1 and 4)." : "Tap the tempo in the player if you don't know the song's BPM."}
      </p>

      {/* Sariling strum pattern: walang laman = ayon sa style */}
      <div className={`${ui.card} flex flex-col gap-3 p-4`}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-stone-300">
          Strum pattern
          <input
            value={strum}
            onChange={(e) => setStrum(e.target.value)}
            placeholder={`e.g. D-DU-UDU (empty = ${time === "6/8" ? "6/8" : SONG_STYLES.find((s) => s.id === style)?.label})`}
            maxLength={24}
            autoCapitalize="characters"
            spellCheck={false}
            className={`${ui.input} w-full font-mono tracking-[0.3em] placeholder:font-sans placeholder:tracking-normal`}
          />
        </label>
        <div role="group" aria-label="Strum presets" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {STRUM_PRESETS[time].map((p) => (
            <button
              key={p.pattern}
              type="button"
              onClick={() => setStrum(p.pattern)}
              aria-pressed={normalizeStrum(strum) === p.pattern}
              className="h-9 shrink-0 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.06] px-3.5 text-sm font-medium hover:bg-white/[0.12] aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-stone-950"
            >
              {p.label}
            </button>
          ))}
          {strum && (
            <button type="button" onClick={() => setStrum("")} className="h-9 shrink-0 whitespace-nowrap px-2 text-sm font-medium text-stone-400 hover:text-stone-100">
              Use style
            </button>
          )}
        </div>
        {(() => {
          const pattern = normalizeStrum(strum);
          const ok = !pattern || parseStrum(pattern, time);
          if (!ok) {
            return (
              <p className="text-xs text-stone-300">
                {pattern.length}/{strumLength(time)} letters. Use <b>D</b> down, <b>U</b> up, <b>x</b> chuck, <b>-</b> rest
                {time === "4/4" ? " (one letter per eighth note: 1 & 2 & 3 & 4 &)." : " (one letter per 16th note: 1 & 2 & 3 & 4 & 5 & 6 &)."}
              </p>
            );
          }
          const slots = strumSlots(style, time, pattern || null);
          return <StrumView slots={slots} label={`Strum: ${strumWords(slots)}`} />;
        })()}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-stone-300">Chords and lyrics</label>
        <div role="group" aria-label="Add a section" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {["Intro", "Verse", "Pre-chorus", "Chorus", "Bridge", "Outro"].map((name) => (
            <button key={name} type="button" onClick={() => addSection(name)} className="h-9 shrink-0 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.06] px-3.5 text-sm font-medium hover:bg-white/[0.12]">
              + {name}
            </button>
          ))}
        </div>
        <textarea
          id="content"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="glass rounded-[24px] p-4 font-mono text-sm leading-relaxed text-stone-100 focus:border-white/40 focus:outline-none"
        />
      </div>

      <p className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-300">
        Write chords on their own line, above the lyrics. They show up bright white when written correctly.
        <br />
        Chords written close together share a bar; a chord with lots of space after it gets a whole bar. For exact timing, use <code className="font-mono font-bold text-stone-50">|</code>, e.g.{" "}
        <code className="font-mono font-bold text-stone-50">| G  D | Em  C |</code>
      </p>

      {message && <p className="font-medium text-red-400">{message}</p>}

      {id && (
        <button type="button" onClick={handleDelete} className="self-start text-sm font-medium text-red-400 hover:underline">
          Delete this song
        </button>
      )}
    </form>
  );
}
