import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useSession } from "../lib/useSession";
import { deleteSong, getSong, saveSong } from "../lib/songs";
import { KEYS } from "../music/transpose";
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
    setBusy(true);
    try {
      const saved = await saveSong({ title: title.trim(), artist: artist.trim(), original_key: originalKey, content }, id);
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="content" className="text-sm font-semibold text-stone-600 dark:text-stone-300">Chords at lyrics</label>
          <div className="flex gap-2">
            {["Verse", "Chorus", "Bridge"].map((name) => (
              <button key={name} type="button" onClick={() => addSection(name)} className="h-8 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900">
                + {name}
              </button>
            ))}
          </div>
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
