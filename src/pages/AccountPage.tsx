import { Account } from "../components/Account";
import { DeleteAccount } from "../components/DeleteAccount";
import { useTheme } from "../lib/useTheme";
import { ui } from "../components/ui";

export function AccountPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={ui.page}>
      <h1 className={ui.title}>Ako</h1>
      <Account startOpen />
      <div className={`${ui.card} flex items-center justify-between gap-3 p-4`}>
        <span className="font-semibold">Dark mode</span>
        <button type="button" role="switch" aria-checked={theme === "dark"} onClick={toggleTheme} className={ui.secondary}>
          {theme === "dark" ? "Naka-on" : "Naka-off"}
        </button>
      </div>
      <DeleteAccount />
    </div>
  );
}
