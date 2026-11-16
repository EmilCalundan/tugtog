import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addToSetlist, deleteSetlist, getSetlist, removeItem, swapItems, toSetlistSongs } from "../lib/setlists";
import type { Setlist, SetlistItem } from "../lib/setlists";
import { listSongs } from "../lib/songs";
import type { Song } from "../lib/songs";
import { setlistText } from "../lib/setlist";
import { KEYS } from "../music/transpose";
import { StageMode } from "../components/StageMode";
import { ui } from "../components/ui";
import { BackIcon, LinkIcon, PlayIcon } from "../components/Icons";

export function SetlistPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [songId, setSongId] = useState("");
  const [songKey, setSongKey] = useState("G");
  const [stage, setStage] = useState(false);
  const [message, setMessage] = useState("");

  const reload = useCallback(
    () =>
      getSetlist(id)
        .then((data) => {
          setSetlist(data.setlist);
          setItems(data.items);
        })
        .catch(() => setMessage("Hindi mahanap ang setlist.")),
    [id],
  );

  useEffect(() => {
    getSetlist(id)
      .then((data) => {
        setSetlist(data.setlist);
        setItems(data.items);
      })
      .catch(() => setMessage("Hindi mahanap ang setlist."));
    listSongs().then(setSongs).catch(() => {});
  }, [id]);

  async function add() {
    if (!songId) return;
    await addToSetlist(id, songId, songKey);
    setSongId("");
    reload();
  }

  async function move(index: number, direction: -1 | 1) {
    const a = items[index];
    const b = items[index + direction];
    if (!a || !b) return;
    await swapItems(a, b);
    reload();
  }

  async function copyLink() {
    if (!setlist) return;
    const link = `${window.location.origin}/s/${setlist.share_id}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Nakopya ang link! I-send ito sa banda mo.");
    } catch {
      setMessage(`Kopyahin ang link na ito: ${link}`);
    }
  }

  async function handleDelete() {
    if (!setlist || !window.confirm(`Burahin ang setlist na "${setlist.title}"? Hindi mabubura ang mga kanta.`)) return;
    await deleteSetlist(setlist.id);
    navigate("/setlist", { replace: true });
  }

  if (!setlist) return <div className={ui.page}><p className={ui.muted}>{message || "Kinukuha ang setlist…"}</p></div>;

  return (
    <div className={ui.page}>
      <Link to="/setlist" aria-label="Bumalik sa mga setlist" className={`${ui.iconButton} -ml-3`}>
        <BackIcon />
      </Link>

      <div>
        <p className={ui.eyebrow}>Setlist</p>
        <h1 className={`${ui.title} mt-1`}>{setlist.title}</h1>
        <p className={`${ui.muted} mt-1`}>{items.length} kanta</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setStage(true)} disabled={items.length === 0} className={ui.dark}>
          <PlayIcon /> Simulan
        </button>
        <button type="button" onClick={copyLink} className={ui.secondary}>
          <LinkIcon /> I-share
        </button>
      </div>

      {message && <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{message}</p>}

      <ol className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.id} className={`${ui.card} flex items-center gap-1.5 p-2 pl-3`}>
            <span className="w-5 text-sm font-semibold text-stone-500">{index + 1}</span>
            <Link to={`/kanta/${item.songs.id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">
              {item.songs.title}
            </Link>
            <span className={ui.keyBadge}>{item.song_key}</span>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Itaas" className={ui.smallIconButton}>↑</button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Ibaba" className={ui.smallIconButton}>↓</button>
            <button
              type="button"
              onClick={() => removeItem(item.id).then(reload)}
              aria-label={`Alisin ang ${item.songs.title}`}
              className={`${ui.smallIconButton} hover:text-red-700`}
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-stone-300 p-3 dark:border-stone-700">
        <select
          aria-label="Pumili ng kanta"
          value={songId}
          onChange={(e) => {
            setSongId(e.target.value);
            const song = songs.find((s) => s.id === e.target.value);
            if (song) setSongKey(song.original_key);
          }}
          className={`${ui.input} min-w-0 flex-1 basis-48`}
        >
          <option value="">Pumili ng kanta…</option>
          {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
        </select>
        <select aria-label="Key na tutugtugin" value={songKey} onChange={(e) => setSongKey(e.target.value)} className={`${ui.input} w-24 shrink-0 font-mono font-bold`}>
          {KEYS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <button type="button" onClick={add} disabled={!songId} className={ui.secondary}>+ Idagdag</button>
      </div>

      <button type="button" onClick={handleDelete} className="self-start text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
        Burahin ang setlist
      </button>

      {stage && <StageMode text={setlistText(toSetlistSongs(items))} title={setlist.title} onClose={() => setStage(false)} />}
    </div>
  );
}
