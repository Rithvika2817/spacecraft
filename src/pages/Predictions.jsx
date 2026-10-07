import { useEffect, useMemo, useState } from "react"
import ReactECharts from "echarts-for-react"

import {
  getBatteries,
  getBatteryCurve,
} from "../api"

function Predictions({ theme }) {
  const isDark = theme === "dark"

  const [batteries, setBatteries] = useState([])
  const [batteryData, setBatteryData] = useState(null)
  const [selectedBattery, setSelectedBattery] = useState("")
  const [loading, setLoading] = useState(true)
  const [curveLoading, setCurveLoading] = useState(false)
  const [error, setError] = useState("")

  // =========================================================
  // LOAD BATTERIES
  // =========================================================

  useEffect(() => {
    let cancelled = false

    async function loadBatteries() {
      try {
        setLoading(true)
        setError("")

        const result = await getBatteries()

        if (cancelled) return

        setBatteries(result)

        if (result.length > 0) {
          setSelectedBattery(result[0].id)
        }
      } catch (err) {
        if (cancelled) return

        setError(
          err.message ||
            "Failed to load battery information."
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBatteries()

    return () => {
      cancelled = true
    }
  }, [])

  // =========================================================
  // LOAD SELECTED BATTERY CURVE
  // =========================================================

  useEffect(() => {
    if (!selectedBattery) return

    let cancelled = false

    async function loadCurve() {
      try {
        setCurveLoading(true)
        setError("")

        const result =
          await getBatteryCurve(selectedBattery)

        if (cancelled) return

        setBatteryData(result)
      } catch (err) {
        if (cancelled) return

        setBatteryData(null)

        setError(
          err.message ||
            `Failed to load ${selectedBattery} data.`
        )
      } finally {
        if (!cancelled) {
          setCurveLoading(false)
        }
      }
    }

    loadCurve()

    return () => {
      cancelled = true
    }
  }, [selectedBattery])

  // =========================================================
  // DATA
  // =========================================================

  const cycles = batteryData?.cycles || []
  const actualSoH = batteryData?.actual_soh || []

  const centralizedPrediction =
    batteryData?.predictions?.cnn_centralized || []

  const federatedPrediction =
    batteryData?.predictions?.cnn_federated || []

  const lastTrainCycle =
    batteryData?.last_train_cycle ?? null

  // =========================================================
  // LATEST PREDICTION
  // =========================================================

  const latestPrediction = useMemo(() => {
    if (!cycles.length) return null

    for (let index = cycles.length - 1; index >= 0; index--) {
      const actual = actualSoH[index]
      const centralized =
        centralizedPrediction[index]
      const federated =
        federatedPrediction[index]

      if (
        actual !== null &&
        actual !== undefined &&
        (centralized !== null &&
          centralized !== undefined ||
          federated !== null &&
          federated !== undefined)
      ) {
        return {
          cycle: cycles[index],
          actual,
          centralized,
          federated,
        }
      }
    }

    return null
  }, [
    cycles,
    actualSoH,
    centralizedPrediction,
    federatedPrediction,
  ])

  // =========================================================
  // PREDICTION COUNTS
  // =========================================================

  const predictionCounts = useMemo(() => {
    let centralized = 0
    let federated = 0

    centralizedPrediction.forEach((value) => {
      if (value !== null && value !== undefined) {
        centralized++
      }
    })

    federatedPrediction.forEach((value) => {
      if (value !== null && value !== undefined) {
        federated++
      }
    })

    return {
      centralized,
      federated,
    }
  }, [
    centralizedPrediction,
    federatedPrediction,
  ])

  // =========================================================
  // CHART
  // =========================================================

  const chartOption = useMemo(() => {
    if (!batteryData) return {}

    return {
      backgroundColor: "transparent",

      tooltip: {
        trigger: "axis",

        backgroundColor: "#0f172a",
        borderColor: "#334155",

        textStyle: {
          color: "#e2e8f0",
        },

        formatter: (params) => {
          if (!params?.length) return ""

          const cycle = params[0].axisValue

          let html = `Cycle ${cycle}<br/>`

          params.forEach((item) => {
            const value = item.value

            html += `${item.marker} ${
              item.seriesName
            }: ${
              value !== null &&
              value !== undefined
                ? `${(value * 100).toFixed(2)}%`
                : "—"
            }<br/>`
          })

          return html
        },
      },

      legend: {
        top: 5,

        textStyle: {
          color: isDark
            ? "#cbd5e1"
            : "#475569",

          fontSize: 11,
        },
      },

      grid: {
        left: "7%",
        right: "5%",
        top: "15%",
        bottom: "15%",
      },

      xAxis: {
        type: "category",
        data: cycles,

        axisLabel: {
          color: isDark
            ? "#cbd5e1"
            : "#64748b",

          fontSize: 10,
        },

        axisLine: {
          lineStyle: {
            color: isDark
              ? "#334155"
              : "#cbd5e1",
          },
        },

        axisTick: {
          show: false,
        },
      },

      yAxis: {
        type: "value",

        min: 0,
        max: 1.1,

        name: "SoH (%)",

        nameTextStyle: {
          color: isDark
            ? "#94a3b8"
            : "#64748b",

          fontSize: 10,
        },

        axisLabel: {
          color: isDark
            ? "#cbd5e1"
            : "#64748b",

          fontSize: 10,

          formatter: (value) =>
            `${Math.round(value * 100)}%`,
        },

        splitLine: {
          lineStyle: {
            color: isDark
              ? "#1e293b"
              : "#e2e8f0",
          },
        },
      },

      series: [
        {
          name: "Actual SoH",
          type: "line",

          data: actualSoH,

          smooth: false,
          showSymbol: false,

          lineStyle: {
            width: 2,
            color: "#38bdf8",
          },
        },

        {
          name: "1D CNN · Centralized",
          type: "line",

          data: centralizedPrediction,

          smooth: false,
          showSymbol: false,
          connectNulls: false,

          lineStyle: {
            width: 2,
            type: "dashed",
            color: "#22c55e",
          },
        },

        {
          name: "1D CNN · Federated",
          type: "line",

          data: federatedPrediction,

          smooth: false,
          showSymbol: false,
          connectNulls: false,

          lineStyle: {
            width: 2,
            type: "dashed",
            color: "#8b5cf6",
          },
        },

        ...(lastTrainCycle !== null
          ? [
              {
                name: "Train / Test",
                type: "line",
                data: [],

                markLine: {
                  silent: true,
                  symbol: "none",

                  lineStyle: {
                    type: "dashed",
                    color: isDark
                      ? "#94a3b8"
                      : "#64748b",
                    width: 1,
                  },

                  label: {
                    show: true,
                    formatter: "Train | Test",
                    color: isDark
                      ? "#94a3b8"
                      : "#64748b",
                    fontSize: 10,
                  },

                  data: [
                    {
                      xAxis: lastTrainCycle,
                    },
                  ],
                },
              },
            ]
          : []),
      ],
    }
  }, [
    batteryData,
    cycles,
    actualSoH,
    centralizedPrediction,
    federatedPrediction,
    lastTrainCycle,
    isDark,
  ])

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p
          className={`text-sm ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Loading prediction data...
        </p>
      </div>
    )
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <h1
            className={`text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Predictions
          </h1>

          <p
            className={`mt-1 text-sm ${
              isDark
                ? "text-slate-300"
                : "text-slate-600"
            }`}
          >
            Compare actual SoH with centralized and
            federated 1D CNN predictions
          </p>
        </div>

        {/* BATTERY SELECTOR */}
        <div>
          <p
            className={`mb-1 text-[10px] uppercase tracking-wider ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Battery
          </p>

          <select
            value={selectedBattery}
            onChange={(event) =>
              setSelectedBattery(event.target.value)
            }
            className={`rounded-lg border px-4 py-2 text-sm outline-none ${
              isDark
                ? "border-slate-700 bg-[#0a111e] text-white focus:border-blue-400"
                : "border-slate-300 bg-white text-slate-900 focus:border-blue-500"
            }`}
          >
            {batteries.map((battery) => (
              <option
                key={battery.id}
                value={battery.id}
              >
                {battery.id}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* LATEST PREDICTION CARDS */}
      <div className="grid gap-4 md:grid-cols-4">

        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-slate-700/70 bg-[#101a29]"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-wider ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Battery
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {selectedBattery || "—"}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Selected battery
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-slate-700/70 bg-[#101a29]"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-wider ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Actual SoH
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {latestPrediction?.actual != null
              ? `${(
                  latestPrediction.actual * 100
                ).toFixed(2)}%`
              : "—"}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Latest available cycle
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-slate-700/70 bg-[#101a29]"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-wider ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Centralized 1D CNN
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {latestPrediction?.centralized != null
              ? `${(
                  latestPrediction.centralized *
                  100
                ).toFixed(2)}%`
              : "—"}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Predicted SoH
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-slate-700/70 bg-[#101a29]"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-wider ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Federated 1D CNN
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {latestPrediction?.federated != null
              ? `${(
                  latestPrediction.federated *
                  100
                ).toFixed(2)}%`
              : "—"}
          </p>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Predicted SoH
          </p>
        </div>

      </div>

      {/* PREDICTION COUNTS */}
      <div
        className={`rounded-xl border p-5 ${
          isDark
            ? "border-slate-700/70 bg-[#101a29]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2
              className={`text-sm font-semibold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              Prediction Availability
            </h2>

            <p
              className={`mt-1 text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Predictions are available after the
              required input history.
            </p>
          </div>

          <div className="flex gap-6">

            <div>
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Centralized
              </p>

              <p
                className={`mt-1 text-lg font-semibold ${
                  isDark
                    ? "text-green-300"
                    : "text-green-700"
                }`}
              >
                {predictionCounts.centralized}
              </p>
            </div>

            <div>
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Federated
              </p>

              <p
                className={`mt-1 text-lg font-semibold ${
                  isDark
                    ? "text-violet-300"
                    : "text-violet-700"
                }`}
              >
                {predictionCounts.federated}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* PREDICTION GRAPH */}
      <div
        className={`overflow-hidden rounded-xl border ${
          isDark
            ? "border-slate-700/70 bg-[#101a29]"
            : "border-slate-200 bg-white"
        }`}
      >

        <div
          className={`border-b px-5 py-4 ${
            isDark
              ? "border-slate-800/80"
              : "border-slate-200"
          }`}
        >
          <h2
            className={`text-sm font-semibold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            SoH Prediction Comparison
          </h2>

          <p
            className={`mt-1 text-[10px] ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Actual SoH compared with both 1D CNN
            training approaches for {selectedBattery}
          </p>
        </div>

        <div className="px-3 pb-3 pt-2">

          {curveLoading ? (
            <div className="flex h-[380px] items-center justify-center">
              <p
                className={`text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Loading prediction data...
              </p>
            </div>
          ) : batteryData ? (
            <ReactECharts
              option={chartOption}
              style={{
                height: "380px",
                width: "100%",
              }}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center">
              <p
                className={`text-sm ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                No prediction data available.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* CURRENT CYCLE */}
      {latestPrediction && (
        <div
          className={`rounded-xl border p-5 ${
            isDark
              ? "border-slate-700/70 bg-[#101a29]"
              : "border-slate-200 bg-white"
          }`}
        >

          <h2
            className={`text-sm font-semibold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            Latest Prediction Details
          </h2>

          <p
            className={`mt-1 text-xs ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Cycle {latestPrediction.cycle}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? "bg-[#0a111e]"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-xs ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Actual SoH
              </p>

              <p
                className={`mt-2 text-xl font-semibold ${
                  isDark
                    ? "text-sky-300"
                    : "text-sky-700"
                }`}
              >
                {latestPrediction.actual != null
                  ? `${(
                      latestPrediction.actual *
                      100
                    ).toFixed(2)}%`
                  : "—"}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? "bg-[#0a111e]"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-xs ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Centralized 1D CNN
              </p>

              <p
                className={`mt-2 text-xl font-semibold ${
                  isDark
                    ? "text-green-300"
                    : "text-green-700"
                }`}
              >
                {latestPrediction.centralized != null
                  ? `${(
                      latestPrediction.centralized *
                      100
                    ).toFixed(2)}%`
                  : "—"}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? "bg-[#0a111e]"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-xs ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Federated 1D CNN
              </p>

              <p
                className={`mt-2 text-xl font-semibold ${
                  isDark
                    ? "text-violet-300"
                    : "text-violet-700"
                }`}
              >
                {latestPrediction.federated != null
                  ? `${(
                      latestPrediction.federated *
                      100
                    ).toFixed(2)}%`
                  : "—"}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Predictions