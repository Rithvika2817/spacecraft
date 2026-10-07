function KPICard({ title, value, unit, theme }) {
  const isDark = theme === "dark"

  const styles = {
    "Selected Battery": {
      icon: "🔋",
      darkIcon: "border-blue-400/20 bg-blue-400/10 text-blue-300",
      lightIcon: "border-blue-200 bg-blue-50 text-blue-600",
      darkValue: "text-white",
      lightValue: "text-slate-900",
      footer: "Selected for analysis",
    },

    "State of Health": {
      icon: "♥",
      darkIcon:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
      lightIcon:
        "border-emerald-200 bg-emerald-50 text-emerald-600",
      darkValue: "text-emerald-300",
      lightValue: "text-emerald-600",
      footer: "Current estimate",
    },

    Cycle: {
      icon: "↻",
      darkIcon:
        "border-violet-400/20 bg-violet-400/10 text-violet-300",
      lightIcon:
        "border-violet-200 bg-violet-50 text-violet-600",
      darkValue: "text-white",
      lightValue: "text-slate-900",
      footer: "Latest available cycle",
    },
  }

  const style = styles[title]

  return (
    <div
      className="rounded-xl border p-5 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? "#101c2d" : "#ffffff",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-xs font-medium ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {title}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                isDark
                  ? style.darkValue
                  : style.lightValue
              }`}
            >
              {value}
            </span>

            {unit && (
              <span
                className={`text-xs font-medium ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {unit}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
            isDark
              ? style.darkIcon
              : style.lightIcon
          }`}
        >
          {style.icon}
        </div>
      </div>

      <div className="mt-5">
        <span
          className={`text-[11px] ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          {style.footer}
        </span>
      </div>
    </div>
  )
}

export default KPICard