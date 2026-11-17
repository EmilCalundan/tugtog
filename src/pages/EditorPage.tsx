import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useSession } from "../lib/useSession";
import { deleteSong, getSong, saveSong } from "../lib/songs";
import { KEYS } from "../music/transpose";
import { SONG_STYLES } from "../music/arrangement";
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
      })
      .catch(() => setMessage("Hindi mahanap ang kantang ito."));
  }, [id]);

  if (session === null) return <Navigate to="/ako" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setMessage("Lagyan muna ng pamagat ang kanta.");
      return;
    }
    const tempo = Number(bpm);
    if (!Number.isInteger(tempo) || tempo < 40 || tempo > 200) {
      setMessage("Ang tempo ay dapat 40 hanggang 200 BPM.");
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSong(
        { title: title.trim(), artist: artist.trim(), original_key: originalKey, content, bpm: tempo, time_signature: time, style },
        id,
      );
      navigate(`/kanta/${saved.id}`, { replace: true });
    } catch {
      setMessage("Hindi na-save. Subukan ulit.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm(`Burahin ang "${title}"? Hindi na ito maibabalik.`)) return;
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
        <Link to={id ? `/kanta/${id}` : "/"} className="font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400">
          Kanselahin
        </Link>
        <h1 className="text-lg font-bold">{id ? "I-edit ang kanta" : "Bagong kanta"}</h1>
        <button type="submit" disabled={busy} className={`${ui.primary} h-10 rounded-full`}>
          {busy ? "Sandali…" : "I-save"}
        </button>
      </header>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
        Pamagat
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={`${ui.input} w-full text-lg font-semibold`} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
          Artist
          <input placeholder="Opsyonal" value={artist} onChange={(e) => setArtist(e.target.value)} className={`${ui.input} w-full`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
          Orihinal na key
          <select value={originalKey} onChange={(e) => setOriginalKey(e.target.value)} className={`${ui.input} w-full font-mono font-bold text-amber-700 dark:text-amber-400`}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
      </div>

      {/* Paano tutugtog ang player at drums sa kantang ito */}
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
          Tempo (BPM)
          <input type="number" inputMode="numeric" min={40} max={200} value={bpm} onChange={(e) => setBpm(e.target.value)} className={`${ui.input} w-full font-mono font-bold`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
          Time
          <select value={time} onChange={(e) => setTime(e.target.value as TimeSignature)} className={`${ui.input} w-full font-mono font-bold`}>
            <option>4/4</option>
            <option>6/8</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-stone-600 dark:text-stone-300">
          Style
          <select value={style} onChange={(e) => setStyle(e.target.value as SongStyle)} disabled={time === "6/8"} className={`${ui.input} w-full disabled:opacity-50`}>
            {SONG_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <p className="-mt-2 text-xs text-stone-500">
        {time === "6/8" ? "Sa 6/8, ang tempo ay bawat 3 bilang (1 at 4). Iisang pattern lang muna ang 6/8." : "I-tap ang tempo sa player kung hindi mo alam ang BPM ng kanta."}
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-semibold text-stone-600 dark:text-stone-300">Chords at lyrics</label>
        <div role="group" aria-label="Magdagdag ng bahagi" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {["Intro", "Verse", "Pre-chorus", "Chorus", "Bridge", "Outro"].map((name) => (
            <button key={name} type="button" onClick={() => addSection(name)} className="h-8 shrink-0 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900">
              + {name}
            </button>
          ))}
        </div>
        <textarea
          id="content"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white p-4 font-mono text-sm leading-relaxed focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <p className="rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        Isulat ang chords sa sariling linya, sa itaas ng lyrics. Lalabas ang mga ito nang kulay amber kapag tama ang pagkakasulat.
      </p>

      {message && <p className="font-semibold text-red-700 dark:text-red-400">{message}</p>}

      {id && (
        <button type="button" onClick={handleDelete} className="self-start text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
          Burahin ang kantang ito
        </button>
      )}
    </form>
  );
}
