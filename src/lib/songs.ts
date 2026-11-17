import { supabase } from "./supabase";
import type { SongStyle, TimeSignature } from "../music/arrangement";

// Ang itsura ng isang kanta sa database
export type Song = {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm: number;
  time_signature: TimeSignature;
  style: SongStyle;
};

export type SongInput = Omit<Song, "id">;

const FIELDS = "id, title, artist, original_key, content, bpm, time_signature, style";

export async function listSongs(): Promise<Song[]> {
  const { data, error } = await supabase.from("songs").select(FIELDS).order("title");
  if (error) throw error;
  return data;
}

export async function getSong(id: string): Promise<Song> {
  const { data, error } = await supabase.from("songs").select(FIELDS).eq("id", id).single();
  if (error) throw error;
  return data;
}

// Gumawa ng bago kapag walang id, o i-update kapag mayroon
export async function saveSong(song: SongInput, id?: string): Promise<Song> {
  const { data, error } = id
    ? await supabase.from("songs").update(song).eq("id", id).select(FIELDS).single()
    : await supabase.from("songs").insert(song).select(FIELDS).single();
  if (error) throw error;
  return data;
}

export async function deleteSong(id: string): Promise<void> {
  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw error;
}
