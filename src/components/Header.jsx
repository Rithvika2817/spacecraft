function Header({ theme, onToggleTheme }) {
  const isDark = theme === "dark"

  return (
    <header
      className={`border-b transition-colors duration-300 ${
        isDark
          ? "border-slate-800 bg-[#0b1626]"
          : "border-slate-200 bg-[#f8fafc]"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">

        {/* Title */}
        <div>
          <h1
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Lithium-Ion Battery SoH Prediction System
          </h1>

          <p
            className={`mt-1 text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Centralized deep learning vs federated learning · NASA battery
            dataset
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div
            className={`hidden items-center gap-2 rounded-lg border px-3 py-2 md:flex ${
              isDark
                ? "border-slate-700 bg-[#111f31]"
                : "border-slate-200 bg-white"
            }`}
          >
            <input
              type="text"
              placeholder="Search battery, cycle, parameter..."
              className={`w-56 bg-transparent text-xs outline-none ${
                isDark
                  ? "text-slate-200 placeholder:text-slate-500"
                  : "text-slate-700 placeholder:text-slate-400"
              }`}
            />

            <span
              className={
                isDark ? "text-slate-400" : "text-slate-500"
              }
            >
              ⌕
            </span>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className={`relative flex h-9 w-16 items-center rounded-full border p-1 transition-colors ${
              isDark
                ? "border-slate-700 bg-[#111f31]"
                : "border-slate-200 bg-white"
            }`}
          >
            <span
              className={`absolute text-xs transition-opacity ${
                isDark
                  ? "left-2 opacity-100"
                  : "left-2 opacity-40"
              }`}
            >
              🌙
            </span>

            <span
              className={`absolute right-2 text-xs transition-opacity ${
                isDark
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
              ☀️
            </span>

            <span
              className={`relative z-10 h-7 w-7 rounded-full shadow-sm transition-transform duration-300 ${
                isDark
                  ? "translate-x-7 bg-slate-700"
                  : "translate-x-0 bg-blue-500"
              }`}
            />
          </button>

          {/* Notification */}
          <button
            type="button"
            className={`hidden h-9 w-9 items-center justify-center rounded-lg border sm:flex ${
              isDark
                ? "border-slate-700 bg-[#111f31] text-slate-300"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            ♧
          </button>

          {/* Profile */}
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-300"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            R
          </div>

        </div>
      </div>
    </header>
  )
}

export default Header