import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { ui } from "./ui";

const CONFIRM_WORD = "BURAHIN";

// Pagbura ng sariling account. Kailangang i-type ang BURAHIN, dahil hindi na ito maibabalik.
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
      setMessage("Hindi nabura ang account. Subukan ulit mamaya.");
      return;
    }
    // Wala na ang user sa server, kaya sa browser na lang aalisin ang session
    await supabase.auth.signOut({ scope: "local" });
    navigate("/", { replace: true });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm font-semibold text-red-700 hover:underline dark:text-red-400">
        Burahin ang account ko
      </button>
    );
  }

  return (
    <section aria-labelledby="delete-title" className="flex flex-col gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
      <h2 id="delete-title" className="font-display text-lg font-bold text-red-800 dark:text-red-300">Burahin ang account</h2>
      <p className="text-sm text-red-900 dark:text-red-200">Hindi na ito maibabalik. Mabubura ang:</p>
      <ul className="list-disc pl-5 text-sm text-red-900 dark:text-red-200">
        <li>lahat ng kanta at setlist mo, pati ang mga share link nito</li>
        <li>ang membership mo sa mga banda</li>
        <li>ang mga bandang ikaw ang gumawa, kasama ang lahat ng miyembro nito</li>
      </ul>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-red-900 dark:text-red-200">
        I-type ang {CONFIRM_WORD} para ituloy
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className={`${ui.input} w-full font-mono`} />
      </label>
      {message && <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={typed.trim() !== CONFIRM_WORD || busy}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-red-700 px-5 font-bold text-white hover:bg-red-600 disabled:opacity-40"
        >
          {busy ? "Binubura…" : "Burahin nang tuluyan"}
        </button>
        <button type="button" onClick={() => { setOpen(false); setTyped(""); }} className={ui.secondary}>
          Huwag na
        </button>
      </div>
    </section>
  );
}
