import { useEffect, useMemo, useState } from "react"
import ReactECharts from "echarts-for-react"

import {
  getBatteries,
  getBatteryCurve,
} from "../api"

function FederatedLearning({ theme }) {
  const isDark = theme === "dark"
  const [batteries, setBatteries] = useState([])
  const [batteryCurves, setBatteryCurves] = useState([])
  const [selectedBattery, setSelectedBattery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // =========================================================
  // LOAD BATTERIES
  // =========================================================

  useEffect(() => {
    let cancelled = false

    async function loadBatteries() {
      try {
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
      }
    }

    loadBatteries()

    return () => {
      cancelled = true
    }
  }, [])

  // =========================================================
  // LOAD ALL BATTERY CURVES
  // =========================================================

  useEffect(() => {
    if (batteries.length === 0) return

    let cancelled = false

    async function loadCurves() {
      setLoading(true)
      setError("")

      try {
        const curves = await Promise.all(
          batteries.map((battery) =>
            getBatteryCurve(battery.id)
          )
        )

        if (cancelled) return

        setBatteryCurves(curves)
      } catch (err) {
        if (cancelled) return

        setError(
          err.message ||
            "Failed to load federated learning data."
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCurves()

    return () => {
      cancelled = true
    }
  }, [batteries])

  // =========================================================
  // SELECTED BATTERY DATA
  // =========================================================

  const selectedData = useMemo(() => {
    return batteryCurves.find(
      (battery) =>
        battery?.battery === selectedBattery
    )
  }, [batteryCurves, selectedBattery])

  // =========================================================
  // FEDERATED MODEL METRICS
  // TEST DATA ONLY
  // =========================================================

  const federatedMetrics = useMemo(() => {
    if (!batteryCurves.length) {
      return {
        rmse: null,
        mae: null,
        mape: null,
        samples: 0,
      }
    }

    const errors = []

    batteryCurves.forEach((battery) => {
      const cycles = battery?.cycles || []
      const actual = battery?.actual_soh || []
      const predicted =
        battery?.predictions?.cnn_federated || []

      const lastTrainCycle =
        battery?.last_train_cycle ?? null

      cycles.forEach((cycle, index) => {
        if (
          lastTrainCycle !== null &&
          cycle <= lastTrainCycle
        ) {
          return
        }

        const actualValue = actual[index]
        const predictedValue = predicted[index]

        if (
          actualValue !== null &&
          actualValue !== undefined &&
          predictedValue !== null &&
          predictedValue !== undefined
        ) {
          errors.push({
            actual: actualValue,
            error:
              actualValue - predictedValue,
          })
        }
      })
    })

    if (errors.length === 0) {
      return {
        rmse: null,
        mae: null,
        mape: null,
        samples: 0,
      }
    }

    const mae =
      errors.reduce(
        (sum, item) =>
          sum + Math.abs(item.error),
        0
      ) / errors.length

    const rmse = Math.sqrt(
      errors.reduce(
        (sum, item) =>
          sum + item.error * item.error,
        0
      ) / errors.length
    )

    const mapeEntries = errors.filter(
      (item) => item.actual !== 0
    )

    const mape =
      mapeEntries.length > 0
        ? mapeEntries.reduce(
            (sum, item) =>
              sum +
              Math.abs(
                item.error / item.actual
              ) *
                100,
            0
          ) / mapeEntries.length
        : null

    return {
      rmse: rmse * 100,
      mae: mae * 100,
      mape,
      samples: errors.length,
    }
  }, [batteryCurves])

  // =========================================================
  // FEDERATED SoH CHART
  // =========================================================

  const federatedChartOption = useMemo(() => {
    if (!selectedData) {
      return {}
    }

    const cycles = selectedData.cycles || []
    const actual = selectedData.actual_soh || []
    const predicted =
      selectedData.predictions?.cnn_federated || []

    const lastTrainCycle =
      selectedData.last_train_cycle ?? null

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

            html += `${item.marker} ${item.seriesName}: ${
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
          color: "#cbd5e1",
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
          color: "#cbd5e1",
          fontSize: 10,
        },

        axisLine: {
          lineStyle: {
            color: "#334155",
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
          color: "#94a3b8",
          fontSize: 10,
        },

        axisLabel: {
          color: "#cbd5e1",
          fontSize: 10,

          formatter: (value) =>
            `${Math.round(value * 100)}%`,
        },

        splitLine: {
          lineStyle: {
            color: "#1e293b",
          },
        },
      },

      series: [
        {
          name: "Actual SoH",
          type: "line",

          data: actual,

          smooth: false,
          showSymbol: false,

          lineStyle: {
            width: 2,
            color: "#38bdf8",
          },
        },

        {
          name: "Federated 1D CNN",
          type: "line",

          data: predicted,

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
                    color: "#94a3b8",
                    width: 1,
                  },

                  label: {
                    show: true,
                    formatter: "Train | Test",
                    color: "#94a3b8",
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
  }, [selectedData])

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">
          Loading federated learning data...
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
    isDark ? "text-white" : "text-slate-900"
  }`}
>
  Federated Learning
</h1>

<p
  className={`mt-1 text-sm ${
    isDark ? "text-slate-300" : "text-slate-600"
  }`}
>
  Federated 1D CNN analysis for battery
  State of Health prediction
</p>
        </div>

        {/* BATTERY SELECTOR */}
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">
            Battery
          </p>

          <select
            value={selectedBattery}
            onChange={(event) =>
              setSelectedBattery(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-[#0a111e] px-4 py-2 text-sm text-white outline-none focus:border-violet-400"
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

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            RMSE
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {federatedMetrics.rmse !== null
              ? `${federatedMetrics.rmse.toFixed(3)}%`
              : "—"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Test prediction error
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            MAE
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {federatedMetrics.mae !== null
              ? `${federatedMetrics.mae.toFixed(3)}%`
              : "—"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Mean absolute error
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            MAPE
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {federatedMetrics.mape !== null
              ? `${federatedMetrics.mape.toFixed(3)}%`
              : "—"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Mean absolute percentage error
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Test Samples
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {federatedMetrics.samples}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Across evaluated batteries
          </p>
        </div>

      </div>

      {/* FEDERATED SoH PREDICTION */}
      <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-[#101a29]">

        <div className="border-b border-slate-800/80 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            Federated SoH Prediction
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            Actual vs federated 1D CNN prediction for{" "}
            {selectedBattery}
          </p>
        </div>

        <div className="px-3 pb-3 pt-2">
          {selectedData ? (
            <ReactECharts
              option={federatedChartOption}
              style={{
                height: "380px",
                width: "100%",
              }}
            />
          ) : (
            <div className="flex h-[380px] items-center justify-center">
              <p className="text-sm text-slate-400">
                No federated prediction data available.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* FEDERATED LEARNING EXPLANATION */}
      <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">

        <h2 className="text-sm font-semibold text-white">
          Federated Learning in This Project
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">

          {/* LOCAL DATA */}
          <div className="rounded-lg bg-[#0a111e] p-4">
            <p className="text-sm font-medium text-violet-300">
              1. Local Data
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Battery data is treated as distributed
              data sources for the federated training
              approach.
            </p>
          </div>

          {/* MODEL TRAINING */}
          <div className="rounded-lg bg-[#0a111e] p-4">
            <p className="text-sm font-medium text-violet-300">
              2. Model Training
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              The same 1D CNN architecture is used for
              the federated training approach.
            </p>
          </div>

          {/* PREDICTION */}
          <div className="rounded-lg bg-[#0a111e] p-4">
            <p className="text-sm font-medium text-violet-300">
              3. Prediction
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              The resulting federated model produces
              SoH predictions that can be compared with
              actual battery degradation.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}

export default FederatedLearning