import { alerts } from "../data/mockData"

function Alerts() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white">
          Alerts & Events
        </h1>

        <p className="mt-1 text-slate-400">
          Current system alerts and events
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between">

              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                {alert.level}
              </span>

              <span className="text-sm text-slate-500">
                {alert.time}
              </span>

            </div>

            <p className="mt-3 text-white">
              {alert.message}
            </p>

          </div>
        ))}
      </div>

    </div>
  )
}

export default Alerts