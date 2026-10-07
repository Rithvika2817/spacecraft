function SubsystemHealth() {
  const systems = [
    {
      name: "Power System",
      health: 91,
      status: "Nominal",
    },
    {
      name: "Thermal System",
      health: 84,
      status: "Watch",
    },
    {
      name: "Communication",
      health: 96,
      status: "Nominal",
    },
    {
      name: "Attitude Control",
      health: 89,
      status: "Nominal",
    },
    {
      name: "Propulsion",
      health: 76,
      status: "Watch",
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-[#101a29]">

      {/* Header */}
      <div className="border-b border-slate-800/80 px-5 py-4">

        <h3 className="text-sm font-semibold text-white">
          Key Subsystem Health
        </h3>

        <p className="mt-1 text-[10px] text-slate-400">
          Current health status across major systems
        </p>

      </div>

      {/* Table */}
      <div className="p-4">

        <div className="grid grid-cols-[1.5fr_0.7fr_1fr_0.7fr] border-b border-slate-800 px-2 pb-2 text-[10px] uppercase tracking-wider text-slate-400">

          <span>Subsystem</span>
          <span>Health</span>
          <span>Condition</span>
          <span>Status</span>

        </div>

        <div className="divide-y divide-slate-800/70">

          {systems.map((system) => (
            <div
              key={system.name}
              className="grid grid-cols-[1.5fr_0.7fr_1fr_0.7fr] items-center px-2 py-3"
            >

              {/* Name */}
              <span className="text-xs text-slate-200">
                {system.name}
              </span>

              {/* Health */}
              <span className="text-xs font-medium text-white">
                {system.health}%
              </span>

              {/* Progress */}
              <div className="pr-4">

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

                  <div
                    className={`h-full rounded-full ${
                      system.health >= 90
                        ? "bg-emerald-400"
                        : system.health >= 80
                        ? "bg-cyan-400"
                        : "bg-amber-400"
                    }`}
                    style={{
                      width: `${system.health}%`,
                    }}
                  />

                </div>

              </div>

              {/* Status */}
              <span
                className={`w-fit rounded-full px-2 py-1 text-[9px] font-semibold ${
                  system.status === "Nominal"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-amber-400/10 text-amber-400"
                }`}
              >
                {system.status}
              </span>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default SubsystemHealth