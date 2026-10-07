import { useEffect, useMemo, useState } from "react"

import KPICard from "../components/KPICard"
import ChartCard from "../components/ChartCard"

import {
  getBatteries,
  getBatteryCurve,
} from "../api"

function Analysis() {
  const [batteries, setBatteries] = useState([])
  const [selectedBattery, setSelectedBattery] = useState("")
  const [batteryData, setBatteryData] = useState(null)

  const [loadingBatteries, setLoadingBatteries] =
    useState(true)

  const [loadingCurve, setLoadingCurve] =
    useState(false)

  const [error, setError] = useState("")

  // Load battery list
  useEffect(() => {
    let cancelled = false

    async function loadBatteries() {
      setLoadingBatteries(true)
      setError("")

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
          err.message || "Failed to load batteries."
        )
      } finally {
        if (!cancelled) {
          setLoadingBatteries(false)
        }
      }
    }

    loadBatteries()

    return () => {
      cancelled = true
    }
  }, [])

  // Load selected battery curve
  useEffect(() => {
    if (!selectedBattery) {
      return
    }

    let cancelled = false

    async function loadCurve() {
      setLoadingCurve(true)
      setError("")

      try {
        const result =
          await getBatteryCurve(selectedBattery)

        if (cancelled) return

        setBatteryData(result)
      } catch (err) {
        if (cancelled) return

        setError(
          err.message ||
            `Failed to load ${selectedBattery} data.`
        )
      } finally {
        if (!cancelled) {
          setLoadingCurve(false)
        }
      }
    }

    loadCurve()

    return () => {
      cancelled = true
    }
  }, [selectedBattery])

  const cycles = batteryData?.cycles || []

  const actualSoh =
    batteryData?.actual_soh || []

  const centralizedPrediction =
    batteryData?.predictions?.cnn_centralized || []

  const federatedPrediction =
    batteryData?.predictions?.cnn_federated || []

  const lastTrainCycle =
    batteryData?.last_train_cycle ?? null

  // Convert backend data into ChartCard format
  const actualData = useMemo(() => {
  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      actualSoh[index] !== null &&
      actualSoh[index] !== undefined
        ? actualSoh[index]
        : null,
  }))
}, [cycles, actualSoh])

  const centralizedData = useMemo(() => {
  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      centralizedPrediction[index] !== null &&
      centralizedPrediction[index] !== undefined
        ? centralizedPrediction[index]
        : null,
  }))
}, [cycles, centralizedPrediction])

  const federatedData = useMemo(() => {
    
  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      federatedPrediction[index] !== null &&
      federatedPrediction[index] !== undefined
        ? federatedPrediction[index]
        : null,
  }))
}, [cycles, federatedPrediction])
const voltageData = useMemo(() => {
  const values = batteryData?.features?.voltage || []

  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      values[index] !== null && values[index] !== undefined
        ? values[index]
        : null,
  }))
}, [cycles, batteryData])

const currentData = useMemo(() => {
  const values = batteryData?.features?.current || []

  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      values[index] !== null && values[index] !== undefined
        ? values[index]
        : null,
  }))
}, [cycles, batteryData])

const temperatureData = useMemo(() => {
  const values = batteryData?.features?.temperature || []

  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      values[index] !== null && values[index] !== undefined
        ? values[index]
        : null,
  }))
}, [cycles, batteryData])

const capacityData = useMemo(() => {
  const values = batteryData?.features?.capacity_calc || []

  return cycles.map((cycle, index) => ({
    time: cycle,
    value:
      values[index] !== null && values[index] !== undefined
        ? values[index]
        : null,
  }))
}, [cycles, batteryData])
  // Prediction error
  const predictionError = useMemo(() => {
  return cycles
    .map((cycle, index) => {
      const actual = actualSoh[index]
      const predicted = federatedPrediction[index]

      if (
        actual === null ||
        actual === undefined ||
        predicted === null ||
        predicted === undefined
      ) {
        return null
      }

      return {
        time: cycle,
        value: Number(
          (actual - predicted).toFixed(4)
        ),
      }
    })
    .filter(Boolean)
}, [cycles, actualSoh, federatedPrediction])
  // Centralized vs Federated model metrics
  const modelMetrics = useMemo(() => {
    const centralizedErrors = []
    const federatedErrors = []

    cycles.forEach((cycle, index) => {
      const actual = actualSoh[index]
      const centralized = centralizedPrediction[index]
      const federated = federatedPrediction[index]

      if (
        actual !== null &&
        actual !== undefined &&
        centralized !== null &&
        centralized !== undefined
      ) {
        centralizedErrors.push(
          actual - centralized
        )
      }

      if (
        actual !== null &&
        actual !== undefined &&
        federated !== null &&
        federated !== undefined
      ) {
        federatedErrors.push(
          actual - federated
        )
      }
    })

    const calculateMetrics = (errors) => {
      if (errors.length === 0) {
        return {
          mae: null,
          rmse: null,
        }
      }

      const mae =
        errors.reduce(
          (sum, error) => sum + Math.abs(error),
          0
        ) / errors.length

      const rmse = Math.sqrt(
        errors.reduce(
          (sum, error) => sum + error * error,
          0
        ) / errors.length
      )

      return {
        mae: mae * 100,
        rmse: rmse * 100,
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
  }, [
    cycles,
    actualSoh,
    centralizedPrediction,
    federatedPrediction,
  ])
  const currentSoh =
    actualSoh.length > 0
      ? actualSoh[actualSoh.length - 1]
      : null

  const currentSohPercent =
    currentSoh !== null
      ? Number((currentSoh * 100).toFixed(2))
      : null

  const currentCycle =
    cycles.length > 0
      ? cycles[cycles.length - 1]
      : null

  if (loadingBatteries) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-400">
          Loading battery data...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold">
            Battery Analysis
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Detailed State of Health analysis for the
            selected battery
          </p>
        </div>

        {/* Battery selector */}
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">
            Battery
          </p>

          <select
            value={selectedBattery}
            onChange={(event) =>
              setSelectedBattery(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-[#0a111e] px-4 py-2 text-sm text-white outline-none focus:border-cyan-400"
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

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading selected battery */}
      {loadingCurve && (
        <div className="rounded-lg border border-slate-700 bg-[#0a111e] px-4 py-3 text-sm text-slate-400">
          Loading {selectedBattery} analysis...
        </div>
      )}

      {batteryData && !loadingCurve && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">

            <KPICard
              title="Selected Battery"
              value={selectedBattery}
            />

            <KPICard
              title="Cycle"
              value={
                currentCycle !== null
                  ? currentCycle
                  : "—"
              }
            />

            <KPICard
              title="State of Health"
              value={
                currentSohPercent !== null
                  ? currentSohPercent
                  : "—"
              }
              unit={
                currentSohPercent !== null
                  ? "%"
                  : ""
              }
            />

          </div>

          {/* SoH Analysis */}
          <div>

            <div className="mb-3">
              <h2 className="text-lg font-semibold">
                State of Health vs Cycle
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Actual and predicted SoH for{" "}
                {selectedBattery}
              </p>
            </div>

            <ChartCard
              title={`SoH Analysis — ${selectedBattery}`}
              data={actualData}
              predictedData={centralizedData}
              federatedData={federatedData}
              lastTrainCycle={lastTrainCycle}
              color="#38bdf8"
              yAxisName="SoH %"
            />

          </div>
                {/* Battery Parameter Trends */}
<div>
  <div className="mb-3">
    <h2 className="text-lg font-semibold">
      Battery Parameter Trends
    </h2>

    <p className="mt-1 text-xs text-slate-400">
      Normalized operating parameters across battery cycles
    </p>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <ChartCard
      title={`Voltage — ${selectedBattery}`}
      data={voltageData}
      color="#38bdf8"
      yAxisName="Normalized"
      dataLabel="Voltage"
      formatAsPercent={false}
    />

    <ChartCard
      title={`Current — ${selectedBattery}`}
      data={currentData}
      color="#a78bfa"
      yAxisName="Normalized"
      dataLabel="Current"
      formatAsPercent={false}
    />

    <ChartCard
      title={`Temperature — ${selectedBattery}`}
      data={temperatureData}
      color="#f97316"
      yAxisName="Normalized"
      dataLabel="Temperature"
      formatAsPercent={false}
    />

    <ChartCard
      title={`Capacity — ${selectedBattery}`}
      data={capacityData}
      color="#22c55e"
      yAxisName="Normalized"
      dataLabel="Capacity"
      formatAsPercent={false}
    />
  </div>
</div>
          {/* Prediction Error */}
          <div>

            <div className="mb-3">
              <h2 className="text-lg font-semibold">
                Prediction Error
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Difference between actual and federated
predicted SoH
              </p>
            </div>

            <ChartCard
              title={`Prediction Error — ${selectedBattery}`}
              data={predictionError}
              color="#f59e0b"
              yAxisName="Error %"
              dataLabel="Prediction Error"
              signedValues={true}
            />

          </div>
          {/* Model Comparison */}
          <div>

            <div className="mb-3">
              <h2 className="text-lg font-semibold">
                Model Comparison
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Centralized vs federated 1D CNN performance
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              {/* Centralized */}
              <div className="rounded-xl border border-slate-700 bg-[#0a111e] p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Centralized Training
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      1D CNN
                    </h3>
                  </div>

                  <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">
                    Centralized
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">

                  <div className="rounded-lg bg-[#0f1928] p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      MAE
                    </p>

                    <p className="mt-1 text-xl font-semibold text-white">
                      {modelMetrics.centralized.mae !== null
                        ? `${modelMetrics.centralized.mae.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#0f1928] p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      RMSE
                    </p>

                    <p className="mt-1 text-xl font-semibold text-white">
                      {modelMetrics.centralized.rmse !== null
                        ? `${modelMetrics.centralized.rmse.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Federated */}
              <div className="rounded-xl border border-slate-700 bg-[#0a111e] p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Federated Training
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      1D CNN
                    </h3>
                  </div>

                  <span className="rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-1 text-[10px] text-violet-300">
                    Federated
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">

                  <div className="rounded-lg bg-[#0f1928] p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      MAE
                    </p>

                    <p className="mt-1 text-xl font-semibold text-white">
                      {modelMetrics.federated.mae !== null
                        ? `${modelMetrics.federated.mae.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#0f1928] p-4">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      RMSE
                    </p>

                    <p className="mt-1 text-xl font-semibold text-white">
                      {modelMetrics.federated.rmse !== null
                        ? `${modelMetrics.federated.rmse.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
          {/* Training / Testing Information */}
          <div className="rounded-xl border border-slate-700 bg-[#0a111e] p-5">

            <h2 className="text-lg font-semibold text-white">
              Analysis Information
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">

              <div className="rounded-lg bg-[#0f1928] p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Total Cycles
                </p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {cycles.length}
                </p>
              </div>

              <div className="rounded-lg bg-[#0f1928] p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Last Train Cycle
                </p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {lastTrainCycle ?? "—"}
                </p>
              </div>

              <div className="rounded-lg bg-[#0f1928] p-4">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                  Test Start Cycle
                </p>

                <p className="mt-1 text-xl font-semibold text-white">
                  {lastTrainCycle !== null
                    ? lastTrainCycle + 1
                    : "—"}
                </p>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  )
}

export default Analysis