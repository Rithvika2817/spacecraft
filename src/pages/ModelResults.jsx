import { useEffect, useMemo, useState } from "react"
import ReactECharts from "echarts-for-react"

import {
  getBatteries,
  getBatteryCurve,
} from "../api"

function ModelResults() {
  const [batteries, setBatteries] = useState([])
  const [batteryCurves, setBatteryCurves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [metric, setMetric] = useState("RMSE")

  // Load all batteries and their curve data
  useEffect(() => {
    let cancelled = false

    async function loadModelData() {
      setLoading(true)
      setError("")

      try {
        const batteryList = await getBatteries()

        if (cancelled) return

        setBatteries(batteryList)

        const curves = await Promise.all(
          batteryList.map((battery) =>
            getBatteryCurve(battery.id)
          )
        )

        if (cancelled) return

        setBatteryCurves(curves)
      } catch (err) {
        if (cancelled) return

        setError(
          err.message ||
            "Failed to load model comparison data."
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadModelData()

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * Calculate centralized and federated
   * performance using TEST cycles only.
   */
  const modelResults = useMemo(() => {
    const centralizedErrors = []
    const federatedErrors = []

    batteryCurves.forEach((battery) => {
      const cycles = battery?.cycles || []
      const actualSoh = battery?.actual_soh || []

      const centralized =
        battery?.predictions?.cnn_centralized || []

      const federated =
        battery?.predictions?.cnn_federated || []

      const lastTrainCycle =
        battery?.last_train_cycle ?? null

      cycles.forEach((cycle, index) => {
        // Evaluate only test cycles
        if (
          lastTrainCycle !== null &&
          cycle <= lastTrainCycle
        ) {
          return
        }

        const actual = actualSoh[index]
        const centralizedValue =
          centralized[index]
        const federatedValue =
          federated[index]

        if (
          actual !== null &&
          actual !== undefined &&
          centralizedValue !== null &&
          centralizedValue !== undefined
        ) {
          centralizedErrors.push({
            actual,
            error:
              actual - centralizedValue,
          })
        }

        if (
          actual !== null &&
          actual !== undefined &&
          federatedValue !== null &&
          federatedValue !== undefined
        ) {
          federatedErrors.push({
            actual,
            error:
              actual - federatedValue,
          })
        }
      })
    })

    const calculateMetrics = (entries) => {
      if (entries.length === 0) {
        return {
          rmse: null,
          mae: null,
          mape: null,
          count: 0,
        }
      }

      const mae =
        entries.reduce(
          (sum, item) =>
            sum + Math.abs(item.error),
          0
        ) / entries.length

      const rmse = Math.sqrt(
        entries.reduce(
          (sum, item) =>
            sum + item.error * item.error,
          0
        ) / entries.length
      )

      const validMapeEntries = entries.filter(
        (item) => item.actual !== 0
      )

      const mape =
        validMapeEntries.length > 0
          ? validMapeEntries.reduce(
              (sum, item) =>
                sum +
                Math.abs(
                  item.error / item.actual
                ) *
                  100,
              0
            ) / validMapeEntries.length
          : null

      return {
        // Convert SoH fraction error to percentage points
        rmse: rmse * 100,
        mae: mae * 100,
        mape,
        count: entries.length,
      }
    }

    return {
      centralized: calculateMetrics(
        centralizedErrors
      ),
      federated: calculateMetrics(
        federatedErrors
      ),
    }
  }, [batteryCurves])

  const rows = [
    {
      model: "1D CNN · Centralized",
      type: "Centralized Training",
      ...modelResults.centralized,
    },
    {
      model: "1D CNN · Federated",
      type: "Federated Training",
      ...modelResults.federated,
    },
  ]

  const hasData = rows.some(
    (model) => model[metric.toLowerCase()] !== null
  )

  const chartOption = {
    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",

      backgroundColor: "#0f172a",

      borderColor: "#334155",

      textStyle: {
        color: "#e2e8f0",
      },

      formatter: (params) => {
        if (!params || params.length === 0) {
          return ""
        }

        const model = params[0].name

        const value =
          params[0].value !== null &&
          params[0].value !== undefined
            ? `${Number(params[0].value).toFixed(3)}%`
            : "—"

        return `${model}<br/>${metric}: ${value}`
      },
    },

    grid: {
      left: "7%",
      right: "5%",
      top: "12%",
      bottom: "15%",
    },

    xAxis: {
      type: "category",

      data: rows.map((model) => model.model),

      axisLabel: {
        color: "#cbd5e1",
        fontSize: 11,
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

      name: `${metric} (%)`,

      nameTextStyle: {
        color: "#94a3b8",
        fontSize: 10,
      },

      axisLabel: {
        color: "#cbd5e1",
        fontSize: 10,

        formatter: (value) =>
          `${value.toFixed(2)}%`,
      },

      splitLine: {
        lineStyle: {
          color: "#1e293b",
        },
      },
    },

    series: [
      {
        name: metric,

        type: "bar",

        data: rows.map((model) => {
          const key = metric.toLowerCase()
          return model[key]
        }),

        barWidth: "35%",

        itemStyle: {
          color: "#38bdf8",

          borderRadius: [5, 5, 0, 0],
        },

        label: {
          show: true,

          position: "top",

          color: "#cbd5e1",

          fontSize: 11,

          formatter: (params) =>
            params.value !== null &&
            params.value !== undefined
              ? `${Number(params.value).toFixed(2)}%`
              : "—",
        },
      },
    ],
  }

  const bestModel = useMemo(() => {
    const centralized =
      modelResults.centralized[metric.toLowerCase()]

    const federated =
      modelResults.federated[metric.toLowerCase()]

    if (
      centralized === null ||
      centralized === undefined
    ) {
      if (
        federated === null ||
        federated === undefined
      ) {
        return null
      }

      return "1D CNN · Federated"
    }

    if (
      federated === null ||
      federated === undefined
    ) {
      return "1D CNN · Centralized"
    }

    return centralized <= federated
      ? "1D CNN · Centralized"
      : "1D CNN · Federated"
  }, [modelResults, metric])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">
          Loading model comparison...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Model Comparison
        </h1>

        <p className="mt-1 text-sm text-slate-300">
          Centralized vs federated training for 1D CNN
          State of Health prediction
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Architecture */}
      <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">

        <p className="text-xs uppercase tracking-wider text-slate-400">
          Model Architecture
        </p>

        <div className="mt-4 rounded-lg border border-slate-700 bg-[#0a111e] p-5">

          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              1D CNN
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Same neural network architecture
            </p>
          </div>

          <div className="mx-auto mt-5 h-8 w-px bg-slate-600" />

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4 text-center">
              <p className="text-sm font-semibold text-cyan-300">
                Centralized Training
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Training using centralized data
              </p>
            </div>

            <div className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-4 text-center">
              <p className="text-sm font-semibold text-violet-300">
                Federated Training
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Collaborative training without
                centralizing local data
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Dataset information */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Batteries Evaluated
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {batteries.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            NASA battery dataset
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Centralized Test Samples
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {modelResults.centralized.count}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Test-cycle predictions
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Federated Test Samples
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {modelResults.federated.count}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Test-cycle predictions
          </p>
        </div>

      </div>

      {/* Performance Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-[#101a29]">

        <div className="border-b border-slate-800/80 px-5 py-4">

          <h2 className="text-sm font-semibold text-white">
            Model Performance
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            Evaluation metrics calculated on test cycles
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-slate-800 bg-[#0a111e]">

              <tr>

                <th className="px-5 py-3 text-xs font-medium text-slate-300">
                  Model
                </th>

                <th className="px-5 py-3 text-xs font-medium text-slate-300">
                  RMSE
                </th>

                <th className="px-5 py-3 text-xs font-medium text-slate-300">
                  MAE
                </th>

                <th className="px-5 py-3 text-xs font-medium text-slate-300">
                  MAPE
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.map((model) => (

                <tr
                  key={model.model}
                  className="border-b border-slate-800/70 last:border-b-0"
                >

                  <td className="px-5 py-4">

                    <p className="text-sm font-medium text-white">
                      {model.model}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {model.type}
                    </p>

                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {model.rmse !== null
                      ? `${model.rmse.toFixed(3)}%`
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {model.mae !== null
                      ? `${model.mae.toFixed(3)}%`
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {model.mape !== null
                      ? `${model.mape.toFixed(3)}%`
                      : "—"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* Performance Chart */}
      <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-[#101a29]">

        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">

          <div>

            <h2 className="text-sm font-semibold text-white">
              Performance Comparison
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              Lower error indicates better prediction performance
            </p>

          </div>

          <select
            value={metric}
            onChange={(event) =>
              setMetric(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-[#0a111e] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
          >
            <option value="RMSE">
              RMSE
            </option>

            <option value="MAE">
              MAE
            </option>

            <option value="MAPE">
              MAPE
            </option>
          </select>

        </div>

        {hasData ? (

          <div className="px-3 pb-3 pt-2">

            <ReactECharts
              option={chartOption}
              style={{
                height: "350px",
                width: "100%",
              }}
            />

          </div>

        ) : (

          <div className="flex h-[350px] items-center justify-center">

            <div className="text-center">

              <p className="text-sm font-medium text-slate-300">
                No model metrics available
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Prediction results are not available for comparison.
              </p>

            </div>

          </div>

        )}

      </div>

      {/* Best Model */}
      <div className="rounded-xl border border-slate-700/70 bg-[#101a29] p-5">

        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          Best Performing Training Approach
        </p>

        <p className="mt-2 text-2xl font-bold text-white">
          {bestModel || "—"}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Based on the selected evaluation metric across
          test-cycle predictions
        </p>

      </div>

    </div>
  )
}

export default ModelResults