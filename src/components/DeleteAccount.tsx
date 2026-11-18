import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { ui } from "./ui";

const CONFIRM_WORD = "DELETE";

// Pagbura ng sariling account. Kailangang i-type ang DELETE, dahil hindi na ito maibabalik.
export function DeleteAccount() {
  const session = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (!session) return null;

  async function handleDelete() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setBusy(false);
      setMessage("The account was not deleted. Try again later.");
      return;
    }
    // Wala na ang user sa server, kaya sa browser na lang aalisin ang session
    await supabase.auth.signOut({ scope: "local" });
    navigate("/", { replace: true });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm font-medium text-red-400 hover:underline">
        Delete my account
      </button>
    );
  }

  return (
    <section aria-labelledby="delete-title" className="flex flex-col gap-3 rounded-[28px] border border-red-500/40 bg-red-500/10 p-5 backdrop-blur">
      <h2 id="delete-title" className="font-display text-lg font-semibold text-red-300">Delete account</h2>
      <p className="text-sm text-red-200">This cannot be undone. It deletes:</p>
      <ul className="list-disc pl-5 text-sm text-red-200">
        <li>all your songs and setlists, and their share links</li>
        <li>your membership in bands</li>
        <li>the bands you created, with all their members</li>
      </ul>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-red-200">
        Type {CONFIRM_WORD} to continue
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={`${ui.input} w-full font-mono`} />
      </label>
      {message && <p role="alert" className="text-sm font-medium text-red-400">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={typed.trim() !== CONFIRM_WORD || busy}
          className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-6 font-semibold text-white hover:bg-red-500 disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete forever"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setTyped(""); }} className={ui.secondary}>
          Cancel
        </button>
      </div>
    </section>
  );
}
