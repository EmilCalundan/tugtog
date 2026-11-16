import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { setlistText } from "../lib/setlist";
import type { SetlistSong } from "../lib/setlist";
import { KEYS } from "../music/transpose";
import { StageMode } from "./StageMode";

type Setlist = { id: string; title: string; share_id: string };
type SongOption = { id: string; title: string; original_key: string };
type Item = {
  id: string;
  position: number;
  song_key: string;
  songs: { title: string; artist: string; original_key: string; content: string };
};

export function Setlists() {
  const session = useSession();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [current, setCurrent] = useState<Setlist | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [songId, setSongId] = useState("");
  const [songKey, setSongKey] = useState("G");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState(false);

  function fetchSetlists() {
    return supabase.from("setlists").select("id, title, share_id").order("created_at", { ascending: false });
  }
  function fetchSongs() {
    return supabase.from("songs").select("id, title, original_key").order("title");
  }
  function fetchItems(setlistId: string) {
    return supabase
      .from("setlist_items")
      .select("id, position, song_key, songs(title, artist, original_key, content)")
      .eq("setlist_id", setlistId)
      .order("position");
  }

  // Kunin ang mga setlist at kanta tuwing may bagong login
  useEffect(() => {
    if (!session) return;
    fetchSetlists().then(({ data }) => setSetlists(data ?? []));
    fetchSongs().then(({ data }) => setSongs(data ?? []));
  }, [session]);

  async function reloadItems(setlistId: string) {
    const { data, error } = await fetchItems(setlistId);
    if (error) setMessage(error.message);
    else setItems((data ?? []) as unknown as Item[]);
  }

  async function openSetlist(setlist: Setlist) {
    setCurrent(setlist);
    setMessage("");
    // Kunin ulit ang mga kanta, para kasama ang mga bagong na-save
    fetchSongs().then(({ data }) => setSongs(data ?? []));
    await reloadItems(setlist.id);
  }

  async function createSetlist() {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("setlists")
      .insert({ title: newTitle.trim() })
      .select("id, title, share_id")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewTitle("");
    setSetlists([data, ...setlists]);
    openSetlist(data);
  }

  async function addSong() {
    if (!current || !songId) return;
    const position = items.length === 0 ? 0 : Math.max(...items.map((i) => i.position)) + 1;
    const { error } = await supabase
      .from("setlist_items")
      .insert({ setlist_id: current.id, song_id: songId, song_key: songKey, position });
    if (error) setMessage(error.message);
    else reloadItems(current.id);
  }

  // Ipagpalit ang puwesto ng dalawang kanta
  async function move(index: number, direction: -1 | 1) {
    const a = items[index];
    const b = items[index + direction];
    if (!current || !a || !b) return;
    await supabase.from("setlist_items").update({ position: b.position }).eq("id", a.id);
    await supabase.from("setlist_items").update({ position: a.position }).eq("id", b.id);
    reloadItems(current.id);
  }

  async function removeItem(item: Item) {
    if (!current) return;
    await supabase.from("setlist_items").delete().eq("id", item.id);
    reloadItems(current.id);
  }

  async function deleteSetlist(setlist: Setlist) {
    if (!window.confirm(`Burahin ang setlist na "${setlist.title}"? Hindi mabubura ang mga kanta.`)) return;
    await supabase.from("setlists").delete().eq("id", setlist.id);
    setSetlists(setlists.filter((s) => s.id !== setlist.id));
    if (current?.id === setlist.id) setCurrent(null);
  }

  async function copyShareLink() {
    if (!current) return;
    const link = `${window.location.origin}/?setlist=${current.share_id}`;
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Nakopya ang link! I-send ito sa banda mo.");
    } catch {
      setMessage(`Kopyahin ang link na ito: ${link}`);
    }
  }

  if (!session) return null;

  const fieldClass =
    "min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-2 focus:outline-amber-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
  const smallButton = "rounded px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800";

  const stageSongs: SetlistSong[] = items.map((item) => ({ ...item.songs, song_key: item.song_key }));

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-white p-4 dark:bg-stone-900">
      <h2 className="text-lg font-bold">Mga setlist ko</h2>

      {/* Gumawa ng bagong setlist */}
      <div className="flex gap-2">
        <input
          placeholder="Bagong setlist, hal. Linggo, Nob 23"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={`${fieldClass} flex-1`}
        />
        <button type="button" onClick={createSetlist} className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400">
          Gumawa
        </button>
      </div>

      {/* Listahan ng mga setlist */}
      {setlists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {setlists.map((setlist) => (
            <button
              key={setlist.id}
              type="button"
              onClick={() => openSetlist(setlist)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                current?.id === setlist.id
                  ? "border-amber-500 bg-amber-500 text-stone-950"
                  : "border-stone-300 hover:border-amber-500 dark:border-stone-700"
              }`}
            >
              {setlist.title}
            </button>
          ))}
        </div>
      )}

      {/* Ang bukas na setlist */}
      {current && (
        <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-bold">{current.title}</h3>
            <button
              type="button"
              onClick={() => setStage(true)}
              disabled={items.length === 0}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
            >
              🎤 Stage mode
            </button>
            <button type="button" onClick={copyShareLink} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-bold hover:border-amber-500 dark:border-stone-700">
              🔗 I-share
            </button>
            <button type="button" onClick={() => deleteSetlist(current)} className="text-sm text-stone-500 hover:text-red-600">
              Burahin
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-stone-500">Wala pang kanta. Pumili sa ibaba.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-stone-200 dark:divide-stone-800">
              {items.map((item, index) => (
                <li key={item.id} className="flex items-center gap-2 py-2">
                  <span className="w-6 text-sm text-stone-500">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{item.songs.title}</span>
                  <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{item.song_key}</span>
                  <button type="button" className={smallButton} onClick={() => move(index, -1)} disabled={index === 0} aria-label="Itaas">↑</button>
                  <button type="button" className={smallButton} onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Ibaba">↓</button>
                  <button type="button" className={`${smallButton} text-stone-500 hover:text-red-600`} onClick={() => removeItem(item)} aria-label="Alisin">✕</button>
                </li>
              ))}
            </ol>
          )}

          {/* Magdagdag ng kanta */}
          <div className="flex flex-wrap gap-2">
            <select
              value={songId}
              onChange={(e) => {
                setSongId(e.target.value);
                const song = songs.find((s) => s.id === e.target.value);
                if (song) setSongKey(song.original_key);
              }}
              className={`${fieldClass} flex-1`}
            >
              <option value="">Pumili ng kanta…</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>{song.title}</option>
              ))}
            </select>
            <select value={songKey} onChange={(e) => setSongKey(e.target.value)} className={fieldClass} aria-label="Key na tutugtugin">
              {KEYS.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <button type="button" onClick={addSong} disabled={!songId} className="rounded-lg border border-stone-300 px-4 py-2 font-bold hover:border-amber-500 disabled:opacity-40 dark:border-stone-700">
              + Idagdag
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-stone-600 dark:text-stone-400">{message}</p>}

      {stage && current && (
        <StageMode text={setlistText(stageSongs)} title={current.title} onClose={() => setStage(false)} />
      )}
    </section>
  );
}
