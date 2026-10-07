import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

import { useState } from "react"

function ChartCard({
  title,
  data = [],
  predictedData = [],
  federatedData = [],
  cycles = [],
  lastTrainCycle = null,
  color = "#2563eb",
  yAxisName = "",
  dataLabel = "Actual SoH",
  theme,
  showTrainTest = false,

  // New chart formatting options
  formatAsPercent = true,
  signedValues = false,
}) {
  const isDark = theme === "dark"

  const [showFederated, setShowFederated] = useState(false)

  const textColor = isDark ? "#cbd5e1" : "#475569"
  const mutedTextColor = isDark ? "#94a3b8" : "#64748b"
  const gridColor = isDark ? "#1e293b" : "#e2e8f0"

  /*
   * Convert the API arrays into Recharts rows.
   */
  const chartData =
    cycles.length > 0
      ? cycles.map((cycle, index) => ({
          cycle,

          actual:
            data[index] !== null &&
            data[index] !== undefined
              ? data[index]
              : null,

          predicted:
            predictedData[index] !== null &&
            predictedData[index] !== undefined
              ? predictedData[index]
              : null,

          federated:
            federatedData[index] !== null &&
            federatedData[index] !== undefined
              ? federatedData[index]
              : null,
        }))
      : data.map((item, index) => ({
          cycle: item.time ?? index + 1,
          actual: item.value ?? null,

          predicted:
            predictedData[index]?.value ??
            null,
        }))

  const hasPrediction = chartData.some(
    (item) =>
      item.predicted !== null &&
      item.predicted !== undefined
  )

  const hasFederated = chartData.some(
    (item) =>
      item.federated !== null &&
      item.federated !== undefined
  )

  /*
   * Format tooltip values.
   *
   * SoH:
   * 0.7138 -> 71.4%
   *
   * Normalized parameters:
   * 0.7138 -> 0.7138
   *
   * Prediction error:
   * -0.08 -> -8.0%
   */
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "-"
    }

    if (formatAsPercent) {
      return `${(value * 100).toFixed(1)}%`
    }

    return Number(value).toFixed(4)
  }

  /*
   * Calculate Y-axis domain.
   */
  const getYAxisDomain = () => {
    if (formatAsPercent && !signedValues) {
      return [0, 1.1]
    }

    if (formatAsPercent && signedValues) {
      const values = chartData
        .flatMap((item) => [
          item.actual,
          item.predicted,
          item.federated,
        ])
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            Number.isFinite(value)
        )

      if (values.length === 0) {
        return [-0.1, 0.1]
      }

      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)

      const padding = Math.max(
        Math.abs(maxValue - minValue) * 0.15,
        0.01
      )

      return [
        minValue - padding,
        maxValue + padding,
      ]
    }

    return [0, 1]
  }

  const yAxisDomain = getYAxisDomain()

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-300 ${
        isDark
          ? "border-slate-800 bg-[#101c2d]"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {/* Chart header */}
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          isDark
            ? "border-slate-800"
            : "border-slate-200"
        }`}
      >
        <div>
          <h3
            className={`text-sm font-semibold ${
              isDark
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {title}
          </h3>

          <p
            className={`mt-1 text-[10px] ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            {hasPrediction
              ? "Actual vs predicted State of Health"
              : dataLabel}
          </p>
        </div>

        {hasFederated ? (
          <button
            type="button"
            onClick={() =>
              setShowFederated(
                (current) => !current
              )
            }
            className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition ${
              showFederated
                ? isDark
                  ? "border-blue-400/30 bg-blue-400/10 text-blue-300"
                  : "border-blue-200 bg-blue-50 text-blue-600"
                : isDark
                  ? "border-slate-700 bg-slate-800/60 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {showFederated
              ? "Hide Federated"
              : "Show Federated"}
          </button>
        ) : (
          <div
            className={`rounded-md border px-2.5 py-1 text-[10px] ${
              isDark
                ? "border-slate-700 bg-slate-800/60 text-slate-300"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            All Cycles
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-3 pb-3 pt-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={270}
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 15,
                left: 5,
                bottom: 20,
              }}
            >
              <CartesianGrid
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="cycle"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{
                  fill: textColor,
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: gridColor,
                }}
                tickLine={false}
                label={{
                  value: "Cycle",
                  position: "insideBottom",
                  offset: -10,
                  fill: mutedTextColor,
                  fontSize: 11,
                }}
              />

              <YAxis
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  if (formatAsPercent) {
                    return `${Math.round(
                      value * 100
                    )}%`
                  }

                  return Number(value).toFixed(1)
                }}
                tick={{
                  fill: textColor,
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
                width={45}
                label={{
                  value:
                    yAxisName ||
                    (formatAsPercent
                      ? "State of Health (%)"
                      : "Normalized"),
                  angle: -90,
                  position: "insideLeft",
                  fill: mutedTextColor,
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: isDark
                    ? "#0f172a"
                    : "#ffffff",
                  border: `1px solid ${
                    isDark
                      ? "#334155"
                      : "#cbd5e1"
                  }`,
                  borderRadius: "8px",
                  color: isDark
                    ? "#e2e8f0"
                    : "#334155",
                  fontSize: "11px",
                }}
                labelFormatter={(cycle) =>
                  `Cycle ${cycle}`
                }
                formatter={(value, name) => {
                  if (
                    value === null ||
                    value === undefined
                  ) {
                    return ["-", name]
                  }

                  return [
                    formatValue(value),
                    name,
                  ]
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: "11px",
                  color: textColor,
                  paddingBottom: "5px",
                }}
              />

              {showTrainTest &&
                lastTrainCycle !== null && (
                  <ReferenceLine
                    x={lastTrainCycle}
                    stroke={
                      isDark
                        ? "#94a3b8"
                        : "#64748b"
                    }
                    strokeDasharray="5 5"
                    label={{
                      value: "train | test",
                      position: "insideTop",
                      fill: mutedTextColor,
                      fontSize: 10,
                    }}
                  />
                )}

              {/* Actual */}
              <Line
                type="linear"
                dataKey="actual"
                name={dataLabel}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                }}
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Centralized 1D CNN */}
              {hasPrediction && (
                <Line
                  type="linear"
                  dataKey="predicted"
                  name="Predicted SoH"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}

              {/* Federated 1D CNN */}
              {showFederated && (
                <Line
                  type="linear"
                  dataKey="federated"
                  name="1D CNN · Federated"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[270px] items-center justify-center">
            <div className="text-center">
              <p
                className={`text-sm font-medium ${
                  isDark
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                No data available
              </p>

              <p
                className={`mt-1 text-xs ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Model output will appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartCard