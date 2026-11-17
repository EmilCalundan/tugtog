import { supabase } from "./supabase";
import type { SetlistSong } from "./setlist";
import type { Instrument } from "./team";

export type Setlist = {
  id: string;
  title: string;
  share_id: string;
  owner_id: string;
  team_id: string | null;
  teams: { name: string } | null;
};

const SETLIST_FIELDS = "id, title, share_id, owner_id, team_id, teams(name)";

export type SetlistItem = {
  id: string;
  position: number;
  song_key: string;
  songs: { id: string; title: string; artist: string; original_key: string; content: string };
};

export async function listSetlists(): Promise<Setlist[]> {
  const { data, error } = await supabase
    .from("setlists")
    .select(SETLIST_FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Setlist[];
}

export async function createSetlist(title: string): Promise<Setlist> {
  const { data, error } = await supabase.from("setlists").insert({ title }).select(SETLIST_FIELDS).single();
  if (error) throw error;
  return data as unknown as Setlist;
}

export async function getSetlist(id: string): Promise<{ setlist: Setlist; items: SetlistItem[] }> {
  const { data, error } = await supabase.from("setlists").select(SETLIST_FIELDS).eq("id", id).single();
  const setlist = data as unknown as Setlist;
  if (error) throw error;

  const { data: items, error: itemsError } = await supabase
    .from("setlist_items")
    .select("id, position, song_key, songs(id, title, artist, original_key, content)")
    .eq("setlist_id", id)
    .order("position");
  if (itemsError) throw itemsError;

  return { setlist, items: (items ?? []) as unknown as SetlistItem[] };
}

// Ibahagi ang setlist sa isang banda (o alisin ang pagbabahagi kapag null)
export async function setSetlistTeam(id: string, teamId: string | null): Promise<void> {
  const { error } = await supabase.from("setlists").update({ team_id: teamId }).eq("id", id);
  if (error) throw error;
}

// Ang instrumento mo sa isang banda, para mabuksan ang kanta sa tamang tab
export async function myInstrument(teamId: string, userId: string): Promise<Instrument | null> {
  const { data } = await supabase
    .from("team_members")
    .select("instrument")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.instrument as Instrument | undefined) ?? null;
}

export async function deleteSetlist(id: string): Promise<void> {
  const { error } = await supabase.from("setlists").delete().eq("id", id);
  if (error) throw error;
}

export async function addToSetlist(setlistId: string, songId: string, songKey: string): Promise<void> {
  // Ilagay sa dulo ng listahan
  const { data } = await supabase
    .from("setlist_items")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1);
  const position = data && data.length > 0 ? data[0].position + 1 : 0;

  const { error } = await supabase
    .from("setlist_items")
    .insert({ setlist_id: setlistId, song_id: songId, song_key: songKey, position });
  if (error) throw error;
}

// Ipagpalit ang puwesto ng dalawang kanta
export async function swapItems(a: SetlistItem, b: SetlistItem): Promise<void> {
  await supabase.from("setlist_items").update({ position: b.position }).eq("id", a.id);
  await supabase.from("setlist_items").update({ position: a.position }).eq("id", b.id);
}

export async function removeItem(id: string): Promise<void> {
  const { error } = await supabase.from("setlist_items").delete().eq("id", id);
  if (error) throw error;
}

// Gawing listahan ng kanta na handa para sa Stage mode
export function toSetlistSongs(items: SetlistItem[]): SetlistSong[] {
  return items.map((item) => ({ ...item.songs, song_key: item.song_key }));
}
