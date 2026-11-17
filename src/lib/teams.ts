import { supabase } from "./supabase";
import type { Instrument } from "./team";

export type Member = {
  user_id: string;
  display_name: string;
  instrument: Instrument;
  role: "leader" | "member";
};

export type Team = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  team_members: Member[];
};

export type TeamDetail = Team & { setlists: { id: string; title: string }[] };

const TEAM_FIELDS = "id, name, owner_id, invite_code, team_members(user_id, display_name, instrument, role)";

// Lahat ng bandang kasapi ka (ang RLS na ang nagsasala)
export async function listTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select(TEAM_FIELDS).order("created_at");
  if (error) throw error;
  return data as unknown as Team[];
}

export async function getTeam(id: string): Promise<TeamDetail> {
  const { data, error } = await supabase
    .from("teams")
    .select(`${TEAM_FIELDS}, setlists(id, title)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as TeamDetail;
}

export async function createTeam(name: string, displayName: string, instrument: Instrument): Promise<string> {
  const { data, error } = await supabase.rpc("create_team", {
    p_name: name,
    p_display_name: displayName,
    p_instrument: instrument,
  });
  if (error) throw error;
  return data as string;
}

// Silip sa banda bago sumali (pangalan at bilang ng miyembro lang)
export async function teamByCode(code: string): Promise<{ id: string; name: string; member_count: number } | null> {
  const { data, error } = await supabase.rpc("team_by_code", { p_code: code });
  if (error) throw error;
  return (data as { id: string; name: string; member_count: number }[])[0] ?? null;
}

export async function joinTeam(code: string, displayName: string, instrument: Instrument): Promise<string> {
  const { data, error } = await supabase.rpc("join_team", {
    p_code: code,
    p_display_name: displayName,
    p_instrument: instrument,
  });
  if (error) throw error;
  return data as string;
}

export async function updateMyMembership(teamId: string, userId: string, changes: { instrument?: Instrument; display_name?: string }) {
  const { error } = await supabase.from("team_members").update(changes).eq("team_id", teamId).eq("user_id", userId);
  if (error) throw error;
}

// Umalis (sarili) o magtanggal (leader)
export async function removeMember(teamId: string, userId: string) {
  const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId);
  if (error) throw error;
}

// Bagong invite link; hindi na gagana ang luma
export async function newInviteCode(teamId: string): Promise<string> {
  const code = crypto.randomUUID();
  const { error } = await supabase.from("teams").update({ invite_code: code }).eq("id", teamId);
  if (error) throw error;
  return code;
}

export async function deleteTeam(teamId: string) {
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) throw error;
}
