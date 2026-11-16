import { NavLink, Outlet, useLocation } from "react-router";
import { useTheme } from "./lib/useTheme";
import { MusicIcon, ListIcon, LearnIcon, UserIcon } from "./components/Icons";

// "match": ang mga path na kabilang sa bawat tab
const NAV = [
  { to: "/", label: "Mga kanta", Icon: MusicIcon, match: ["/kanta", "/subukan"] },
  { to: "/setlist", label: "Setlist", Icon: ListIcon, match: ["/setlist"] },
  { to: "/matuto", label: "Matuto", Icon: LearnIcon, match: ["/matuto"] },
  { to: "/ako", label: "Ako", Icon: UserIcon, match: ["/ako"] },
];

// Ang balangkas ng app: sidebar sa desktop, tab bar sa ibaba sa phone
export default function App() {
  useTheme();
  const { pathname } = useLocation();
  const isActive = (to: string, match: string[]) =>
    pathname === to || match.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-stone-200 bg-white px-4 py-6 md:flex dark:border-stone-800 dark:bg-stone-900">
        <div className="px-2 font-display text-2xl font-bold tracking-tight">
          Tugtog<span className="text-amber-500">.</span>
        </div>
        <nav aria-label="Pangunahing menu" className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon, match }) => (
            <NavLink
              key={to}
              to={to}
              aria-current={isActive(to, match) ? "page" : undefined}
              className={() =>
                `flex h-11 items-center gap-3 rounded-xl px-3 font-semibold ${
                  isActive(to, match)
                    ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-50"
                    : "text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800"
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label="Pangunahing menu"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-stone-200 bg-white/95 px-2 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-900/95"
      >
        {NAV.map(({ to, label, Icon, match }) => (
          <NavLink
            key={to}
            to={to}
            aria-current={isActive(to, match) ? "page" : undefined}
            className={() =>
              `flex flex-col items-center gap-1 py-1 text-xs ${
                isActive(to, match) ? "font-semibold text-stone-900 dark:text-stone-50" : "text-stone-500 dark:text-stone-400"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
