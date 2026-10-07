import { NavLink } from "react-router-dom"

function Sidebar({ theme }) {
  const isDark = theme === "dark"

  const mainLinks = [
    {
      name: "Overview",
      path: "/",
      icon: "▦",
    },
    {
      name: "Battery Analysis",
      path: "/battery-analysis",
      icon: "◉",
    },
    {
      name: "Model Comparison",
      path: "/models",
      icon: "▤",
    },
    {
      name: "Federated Learning",
      path: "/federated-learning",
      icon: "◎",
    },
    {
  name: "Predictions",
  path: "/predictions",
  icon: "⌁",
},
  ]

  return (
    <aside
      className={`sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r transition-colors duration-300 ${
        isDark
          ? "border-slate-800 bg-[#0b1626]"
          : "border-slate-200 bg-[#eef4fa]"
      }`}
    >
      {/* BRAND */}
      <div
        className={`border-b px-4 py-5 ${
          isDark
            ? "border-slate-800"
            : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl ${
              isDark
                ? "border-emerald-400/30 bg-emerald-400/10"
                : "border-emerald-200 bg-white"
            }`}
          >
            🔋
          </div>

          <div>
            <h1
              className={`text-base font-bold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              BattSoH
            </h1>

            <p
              className={`mt-0.5 text-[9px] uppercase tracking-[0.18em] ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Battery Analytics
            </p>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <nav className="flex-1 px-3 py-6">
        <p
          className={`mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] ${
            isDark
              ? "text-slate-500"
              : "text-slate-500"
          }`}
        >
          Analysis
        </p>

        <div className="space-y-1">
          {mainLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? isDark
                      ? "bg-blue-500/15 text-blue-300"
                      : "bg-blue-600 text-white shadow-sm"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex w-5 justify-center text-base ${
                      isActive
                        ? isDark
                          ? "text-blue-300"
                          : "text-white"
                        : isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                    }`}
                  >
                    {link.icon}
                  </span>

                  <span>{link.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar