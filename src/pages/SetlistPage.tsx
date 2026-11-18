import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { addToSetlist, deleteSetlist, getSetlist, myInstrument, removeItem, setSetlistTeam, swapItems, toSetlistSongs } from "../lib/setlists";
import { listTeams } from "../lib/teams";
import type { Team } from "../lib/teams";
import { useSession } from "../lib/useSession";
import { instrumentLabel, songLink } from "../lib/team";
import type { Instrument } from "../lib/team";
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
  const session = useSession();
  const myId = session?.user.id;
  const [teams, setTeams] = useState<Team[]>([]);
  const [instrument, setInstrument] = useState<Instrument | null>(null);

  const reload = useCallback(
    () =>
      getSetlist(id)
        .then((data) => {
          setSetlist(data.setlist);
          setItems(data.items);
        })
        .catch(() => setMessage("Setlist not found.")),
    [id],
  );

  useEffect(() => {
    getSetlist(id)
      .then((data) => {
        setSetlist(data.setlist);
        setItems(data.items);
      })
      .catch(() => setMessage("Setlist not found."));
    listSongs().then(setSongs).catch(() => {});
    listTeams().then(setTeams).catch(() => {});
  }, [id]);

  // Ang instrumento mo sa banda ng setlist, para bumukas ang kanta sa part mo
  const teamId = setlist?.team_id ?? null;
  useEffect(() => {
    if (!teamId || !myId) return;
    myInstrument(teamId, myId).then(setInstrument).catch(() => {});
  }, [teamId, myId]);

  async function shareWithTeam(value: string) {
    await setSetlistTeam(id, value || null);
    const team = teams.find((t) => t.id === value);
    setMessage(team ? `Shared with ${team.name}. Every member can see it now.` : "No longer shared with a band.");
    reload();
  }

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
      setMessage("Link copied! Send it to your band.");
    } catch {
      setMessage(`Copy this link: ${link}`);
    }
  }

  async function handleDelete() {
    if (!setlist || !window.confirm(`Delete the setlist "${setlist.title}"? Your songs will not be deleted.`)) return;
    await deleteSetlist(setlist.id);
    navigate("/setlist", { replace: true });
  }

  if (!setlist) return <div className={ui.page}><p className={ui.muted}>{message || "Loading setlist…"}</p></div>;
  // Ang may-ari lang ang makakapag-ayos; read-only ito sa ibang miyembro ng banda
  const isOwner = setlist.owner_id === myId;

  return (
    <div className={ui.page}>
      <Link to="/setlist" aria-label="Back to setlists" className={`${ui.iconButton} -ml-3`}>
        <BackIcon />
      </Link>

      <div>
        <p className={ui.eyebrow}>Setlist</p>
        <h1 className={`${ui.title} mt-1`}>{setlist.title}</h1>
        <p className={`${ui.muted} mt-1`}>
          {items.length} {items.length === 1 ? "song" : "songs"}
          {setlist.teams && ` · ${setlist.teams.name}`}
          {instrument && ` · opens on ${instrumentLabel(instrument)}`}
        </p>
      </div>

      {isOwner && teams.length > 0 && (
        <label className={`${ui.card} flex items-center justify-between gap-3 p-3 pl-4`}>
          <span className="text-sm font-medium">Share with band</span>
          <select value={setlist.team_id ?? ""} onChange={(e) => shareWithTeam(e.target.value)} className={`${ui.input} h-10 min-w-0 max-w-56 text-sm`}>
            <option value="">Not shared</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setStage(true)} disabled={items.length === 0} className={ui.dark}>
          <PlayIcon /> Start
        </button>
        <button type="button" onClick={copyLink} className={ui.secondary}>
          <LinkIcon /> Share
        </button>
      </div>

      {message && <p className="text-sm font-medium text-stone-100">{message}</p>}

      <ol className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item.id} className={`${ui.card} flex items-center gap-1.5 p-2 pl-4`}>
            <span className="w-6 font-digit text-xs text-stone-500">{String(index + 1).padStart(2, "0")}</span>
            <Link to={songLink(item.songs.id, item.song_key, instrument ?? undefined)} className="min-w-0 flex-1 truncate font-semibold hover:underline">
              {item.songs.title}
            </Link>
            <span className={ui.keyBadge}>{item.song_key}</span>
            {isOwner && (
              <>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className={ui.smallIconButton}>↑</button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down" className={ui.smallIconButton}>↓</button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id).then(reload)}
                  aria-label={`Remove ${item.songs.title}`}
                  className={`${ui.smallIconButton} hover:text-red-400`}
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ol>

      {isOwner && (
        <div className="flex flex-wrap gap-2 rounded-[28px] border border-dashed border-white/15 p-3">
          <select
            aria-label="Choose a song"
            value={songId}
            onChange={(e) => {
              setSongId(e.target.value);
              const song = songs.find((s) => s.id === e.target.value);
              if (song) setSongKey(song.original_key);
            }}
            className={`${ui.input} min-w-0 flex-1 basis-48`}
          >
            <option value="">Choose a song…</option>
            {songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
          </select>
          <select aria-label="Key to play in" value={songKey} onChange={(e) => setSongKey(e.target.value)} className={`${ui.input} w-24 shrink-0 font-digit text-sm`}>
            {KEYS.map((k) => <option key={k}>{k}</option>)}
          </select>
          <button type="button" onClick={add} disabled={!songId} className={ui.secondary}>+ Add</button>
        </div>
      )}

      {isOwner && (
        <button type="button" onClick={handleDelete} className="self-start text-sm font-medium text-red-400 hover:underline">
          Delete setlist
        </button>
      )}

      {stage && <StageMode text={setlistText(toSetlistSongs(items))} title={setlist.title} onClose={() => setStage(false)} />}
    </div>
  );
}
