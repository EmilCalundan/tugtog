import { NavLink, Outlet, useLocation } from "react-router";
import { useTheme } from "./lib/useTheme";
import { MusicIcon, ListIcon, LearnIcon, TeamIcon, UserIcon } from "./components/Icons";

// "match": ang mga path na kabilang sa bawat tab
const NAV = [
  { to: "/", label: "Songs", Icon: MusicIcon, match: ["/kanta", "/subukan"] },
  { to: "/setlist", label: "Setlists", Icon: ListIcon, match: ["/setlist"] },
  { to: "/banda", label: "Band", Icon: TeamIcon, match: ["/banda", "/sali"] },
  { to: "/matuto", label: "Learn", Icon: LearnIcon, match: ["/matuto"] },
  { to: "/ako", label: "Me", Icon: UserIcon, match: ["/ako", "/bagong-password"] },
];

// Ang balangkas ng app: glass na sidebar sa desktop, bilog na dock sa ibaba sa phone
export default function App() {
  useTheme();
  const { pathname } = useLocation();
  const isActive = (to: string, match: string[]) =>
    pathname === to || match.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="app-bg min-h-screen text-stone-100 md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 p-4 md:block">
        <div className="glass flex h-full flex-col gap-6 rounded-[28px] px-3 py-6">
          <div className="px-3 font-digit text-xl tracking-tight">TUGTOG</div>
          <nav aria-label="Main menu" className="flex flex-col gap-1">
            {NAV.map(({ to, label, Icon, match }) => (
              <NavLink
                key={to}
                to={to}
                aria-current={isActive(to, match) ? "page" : undefined}
                className={() =>
                  `flex h-11 items-center gap-3 rounded-full px-4 font-medium ${
                    isActive(to, match) ? "knob" : "text-stone-300 hover:bg-white/10"
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-28 md:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label="Main menu"
        className="glass fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full p-1.5 md:hidden"
      >
        {NAV.map(({ to, label, Icon, match }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            title={label}
            aria-current={isActive(to, match) ? "page" : undefined}
            className={() =>
              `flex size-[52px] items-center justify-center rounded-full ${
                isActive(to, match) ? "knob" : "text-stone-300 hover:bg-white/10"
              }`
            }
          >
            <Icon />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
