import { useEffect, useMemo, useState } from "react"

import KPICard from "../components/KPICard"
import ChartCard from "../components/ChartCard"

import {
  getBatteries,
  getBatteryCurve,
  getHealth,
  getModels,
  getInputSpec,
  getCycleDetails,
} from "../api"

function Overview({ theme }) {
  const isDark = theme === "dark"

  // =========================================================
  // API STATE
  // =========================================================

  const [batteries, setBatteries] = useState([])
  const [selectedBattery, setSelectedBattery] = useState("")
  const [batteryData, setBatteryData] = useState(null)

  const [loadingBatteries, setLoadingBatteries] = useState(true)
  const [loadingCurve, setLoadingCurve] = useState(false)

  const [error, setError] = useState("")
  const [healthData, setHealthData] = useState(null)
const [modelsData, setModelsData] = useState(null)
const [inputSpecData, setInputSpecData] = useState(null)
const [cycleData, setCycleData] = useState(null)

const [loadingSystemData, setLoadingSystemData] =
  useState(true)

const [loadingCycle, setLoadingCycle] =
  useState(false)

  // =========================================================
  // LOAD BATTERY LIST
  // =========================================================

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

  // =========================================================
  // LOAD SELECTED BATTERY CURVE
  // =========================================================

  useEffect(() => {
  if (!selectedBattery) {
    return
  }

  let cancelled = false

  async function loadCurve() {
    setLoadingCurve(true)
    setError("")

    try {
      const result = await getBatteryCurve(
        selectedBattery
      )

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

  // =========================================================
  // CURRENT BATTERY METADATA
  // =========================================================

  const selectedBatteryInfo = useMemo(() => {
    return batteries.find(
      (battery) => battery.id === selectedBattery
    )
  }, [batteries, selectedBattery])

  // =========================================================
  // REAL API VALUES
  // =========================================================

  const cycles = batteryData?.cycles || []

  const actualSoh =
    batteryData?.actual_soh || []

  const centralizedPrediction =
    batteryData?.predictions?.cnn_centralized || []

  const federatedPrediction =
    batteryData?.predictions?.cnn_federated || []

  const lastTrainCycle =
    batteryData?.last_train_cycle ?? null

  // =========================================================
  // CURRENT SOH
  // =========================================================

  const currentSoh =
    actualSoh.length > 0
      ? actualSoh[actualSoh.length - 1]
      : null

  // =========================================================
  // LAST NON-NULL CENTRALIZED PREDICTION
  // =========================================================

  const lastPredictedSoh = [...federatedPrediction]
  .reverse()
  .find(
    (value) =>
      value !== null &&
      value !== undefined
  )

    // =========================================================
// LOAD SYSTEM / MODEL INFORMATION
// =========================================================

useEffect(() => {
  let cancelled = false

  async function loadSystemData() {
    setLoadingSystemData(true)

    const [
      healthResult,
      modelsResult,
      inputSpecResult,
    ] = await Promise.allSettled([
      getHealth(),
      getModels(),
      getInputSpec(),
    ])

    if (cancelled) return

    if (healthResult.status === "fulfilled") {
      setHealthData(healthResult.value)
    }

    if (modelsResult.status === "fulfilled") {
      setModelsData(modelsResult.value)
    }

    if (inputSpecResult.status === "fulfilled") {
      setInputSpecData(inputSpecResult.value)
    }

    setLoadingSystemData(false)
  }

  loadSystemData()

  return () => {
    cancelled = true
  }
}, [])

// =========================================================
// LOAD LATEST CYCLE DETAILS
// =========================================================

useEffect(() => {
  if (
    !selectedBattery ||
    cycles.length === 0
  ) {
    return
  }

  const latestCycle =
    cycles[cycles.length - 1]

  let cancelled = false

  async function loadCycleDetails() {
    setLoadingCycle(true)

    try {
      const result = await getCycleDetails(
        selectedBattery,
        latestCycle
      )

      if (cancelled) return

      setCycleData(result)
    } catch {
      if (cancelled) return

      setCycleData(null)
    } finally {
      if (!cancelled) {
        setLoadingCycle(false)
      }
    }
  }

  loadCycleDetails()

  return () => {
    cancelled = true
  }
}, [selectedBattery, cycles])

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loadingBatteries) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              isDark
                ? "bg-blue-400/10"
                : "bg-blue-50"
            }`}
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>

          <p
            className={`mt-4 text-sm font-medium ${
              isDark
                ? "text-slate-300"
                : "text-slate-700"
            }`}
          >
            Loading batteries...
          </p>
        </div>
      </div>
    )
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="space-y-5 py-5">

      {/* =====================================================
          PAGE TITLE
      ====================================================== */}

      <div>
        <h1
          className={`text-xl font-bold ${
            isDark
              ? "text-white"
              : "text-slate-900"
          }`}
        >
          Battery Overview
        </h1>

        <p
          className={`mt-1 text-xs ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Lithium-ion battery State of Health
          and model prediction analysis
        </p>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            isDark
              ? "border-red-900/50 bg-red-950/30 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm font-semibold">
            Unable to load battery data
          </p>

          <p className="mt-1 text-xs">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          BATTERY INFORMATION
      ====================================================== */}

      <section
        className={`rounded-xl border p-4 transition-colors duration-300 ${
          isDark
            ? "border-slate-800 bg-[#101c2d]"
            : "border-slate-200 bg-white shadow-sm"
        }`}
      >
        <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center">

          {/* Battery selector */}

          <div>
            <p
              className={`mb-2 text-xs font-semibold ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              Select Battery
            </p>

            <select
              value={selectedBattery}
              disabled={
                loadingCurve ||
                batteries.length === 0
              }
              onChange={(event) =>
                setSelectedBattery(
                  event.target.value
                )
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                isDark
                  ? "border-slate-700 bg-[#0b1626] text-white"
                  : "border-slate-200 bg-white text-slate-800"
              } ${
                loadingCurve
                  ? "cursor-not-allowed opacity-60"
                  : ""
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

          {/* Battery information */}

          <div
            className={`flex min-h-[72px] items-center gap-4 rounded-lg px-4 ${
              isDark
                ? "bg-[#0b1626]"
                : "bg-slate-50"
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${
                isDark
                  ? "bg-emerald-400/10"
                  : "bg-emerald-50"
              }`}
            >
              🔋
            </div>

            <div>
              <p
                className={`text-sm font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {selectedBattery || "—"} · 18650 Li-ion
              </p>

              <p
                className={`mt-1 text-[11px] ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {selectedBatteryInfo?.n_cycles ??
                  "—"}{" "}
                cycles · NASA Lithium-Ion
                Battery Dataset
              </p>

              <p
                className={`mt-0.5 text-[10px] ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                {loadingCurve
                  ? "Loading battery analysis..."
                  : "Historical degradation data available for analysis"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI ROW
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <KPICard
          title="Selected Battery"
          value={selectedBattery || "—"}
          theme={theme}
        />

        <KPICard
          title="State of Health"
          value={
            currentSoh !== null
              ? (currentSoh * 100).toFixed(1)
              : "—"
          }
          unit={
            currentSoh !== null
              ? "%"
              : ""
          }
          theme={theme}
        />

        <KPICard
          title="Cycle"
          value={
            cycles.length > 0
              ? cycles[cycles.length - 1]
              : selectedBatteryInfo?.last_cycle ??
                "—"
          }
          theme={theme}
        />

      </div>

      {/* =====================================================
          PREDICTED SOH HEADLINE
      ====================================================== */}

      <div
        className={`rounded-xl border px-5 py-4 ${
          isDark
            ? "border-blue-900/40 bg-blue-950/20"
            : "border-blue-100 bg-blue-50"
        }`}
      >
        <p
          className={`text-xs font-medium ${
            isDark
              ? "text-blue-300"
              : "text-blue-600"
          }`}
        >
          Predicted SoH at last cycle
        </p>

        <p
          className={`mt-1 text-2xl font-bold ${
            isDark
              ? "text-white"
              : "text-slate-900"
          }`}
        >
          {lastPredictedSoh !== undefined &&
          lastPredictedSoh !== null
            ? `${(
                lastPredictedSoh * 100
              ).toFixed(1)}%`
            : "—"}
        </p>

        <p
          className={`mt-1 text-[10px] ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          1D CNN · Federated Training
        </p>
      </div>

      {/* =====================================================
          LOADING CURVE / ANALYSIS
      ====================================================== */}

      {loadingCurve ? (
        <div
          className={`flex h-[420px] items-center justify-center rounded-xl border ${
            isDark
              ? "border-slate-800 bg-[#101c2d]"
              : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          <div className="text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                isDark
                  ? "bg-blue-400/10"
                  : "bg-blue-50"
              }`}
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            </div>

            <p
              className={`mt-3 text-sm font-medium ${
                isDark
                  ? "text-slate-300"
                  : "text-slate-700"
              }`}
            >
              Loading {selectedBattery} analysis...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* =================================================
              ANALYSIS SECTION
          ================================================== */}

          <div>

            <div className="mb-3">
              <h2
                className={`text-base font-semibold ${
                  isDark
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                Health & Degradation Analysis
              </h2>

              <p
                className={`mt-1 text-xs ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Historical observations and model
                predictions across operating cycles
              </p>
            </div>

            {/* =================================================
                GRAPH GRID
            ================================================== */}

            <div className="grid gap-4 xl:grid-cols-2">

              {/* Graph 1 */}

              <ChartCard
                title={`SoH Prediction vs Actual — ${selectedBattery}`}
                cycles={cycles}
                data={actualSoh}
                predictedData={
                  centralizedPrediction
                }
                federatedData={
                  federatedPrediction
                }
                lastTrainCycle={
                  lastTrainCycle
                }
                showTrainTest={true}
                color="#2563eb"
                yAxisName="State of Health (%)"
                dataLabel="Actual SoH"
                theme={theme}
              />

              {/* Graph 2 */}

              <ChartCard
                title={`SoH Degradation — ${selectedBattery}`}
                cycles={cycles}
                data={actualSoh}
                color="#14b8a6"
                yAxisName="State of Health (%)"
                dataLabel="Actual SoH"
                theme={theme}
              />

              {/* Graph 3 */}

              <ChartCard
                title={`Health Forecast — ${selectedBattery}`}
                cycles={cycles}
                data={actualSoh}
                predictedData={
                  centralizedPrediction
                }
                federatedData={
                  federatedPrediction
                }
                lastTrainCycle={
                  lastTrainCycle
                }
                showTrainTest={true}
                color="#8b5cf6"
                yAxisName="State of Health (%)"
                dataLabel="Actual SoH"
                theme={theme}
              />

              {/* Graph 4 — Model Information */}

              <div
                className={`overflow-hidden rounded-xl border ${
                  isDark
                    ? "border-slate-800 bg-[#101c2d]"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div
                  className={`border-b px-5 py-4 ${
                    isDark
                      ? "border-slate-800"
                      : "border-slate-200"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold ${
                      isDark
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    Battery Model Information
                  </h3>

                  <p
                    className={`mt-1 text-[10px] ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    Current training and prediction
                    configuration
                  </p>
                </div>

                <div className="space-y-4 p-5">

                  {/* Model */}

                  <div
                    className={`rounded-lg p-4 ${
                      isDark
                        ? "bg-[#0b1626]"
                        : "bg-slate-50"
                    }`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wide ${
                        isDark
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      Model
                    </p>

                    <p
                      className={`mt-1 text-sm font-semibold ${
                        isDark
                          ? "text-white"
                          : "text-slate-800"
                      }`}
                    >
                      1D CNN
                    </p>
                  </div>

                  {/* Training + Train Cycle */}

                  <div className="grid grid-cols-2 gap-3">

  <div
    className={`rounded-lg p-4 ${
      isDark
        ? "bg-[#0b1626]"
        : "bg-slate-50"
    }`}
  >
    <p
      className={`text-[10px] uppercase tracking-wide ${
        isDark
          ? "text-slate-500"
          : "text-slate-400"
      }`}
    >
      Centralized Training
    </p>

    <p
      className={`mt-1 text-sm font-semibold ${
        isDark
          ? "text-blue-300"
          : "text-blue-600"
      }`}
    >
      1D CNN
    </p>
  </div>

  <div
    className={`rounded-lg p-4 ${
      isDark
        ? "bg-[#0b1626]"
        : "bg-slate-50"
    }`}
  >
    <p
      className={`text-[10px] uppercase tracking-wide ${
        isDark
          ? "text-slate-500"
          : "text-slate-400"
      }`}
    >
      Federated Training
    </p>

    <p
      className={`mt-1 text-sm font-semibold ${
        isDark
          ? "text-purple-300"
          : "text-purple-600"
      }`}
    >
      1D CNN
    </p>
  </div>

</div>

                  {/* Prediction */}

                  <div
                    className={`rounded-lg border px-4 py-3 ${
                      isDark
                        ? "border-slate-800 bg-[#0b1626]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <p
                      className={`text-[10px] ${
                        isDark
                          ? "text-slate-500"
                          : "text-slate-400"
                      }`}
                    >
                      Prediction
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        isDark
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      Federated 1D CNN provides the
final accurate prediction.
Centralized prediction is
available for comparison.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>

         {/* =================================================
    BACKEND STATUS
================================================== */}

<div className="grid gap-4 xl:grid-cols-3">

  {/* Backend Health */}

  <div
    className={`rounded-xl border p-4 ${
      isDark
        ? "border-slate-800 bg-[#101c2d]"
        : "border-slate-200 bg-white shadow-sm"
    }`}
  >
    <p
      className={`text-[10px] uppercase tracking-wide ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
    >
      Backend Status
    </p>

    <div className="mt-3 flex items-center gap-3">

      <div
        className={`h-3 w-3 rounded-full ${
          healthData
            ? "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />

      <p
        className={`text-sm font-semibold ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        {loadingSystemData
          ? "Checking..."
          : healthData
          ? "Online"
          : "Waiting for API"}
      </p>

    </div>
  </div>


  {/* Models */}

  <div
    className={`rounded-xl border p-4 ${
      isDark
        ? "border-slate-800 bg-[#101c2d]"
        : "border-slate-200 bg-white shadow-sm"
    }`}
  >
    <p
      className={`text-[10px] uppercase tracking-wide ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
    >
      Model Service
    </p>

    <p
      className={`mt-3 text-sm font-semibold ${
        isDark ? "text-white" : "text-slate-900"
      }`}
    >
      {loadingSystemData
        ? "Checking..."
        : modelsData
        ? "Available"
        : "Waiting for API"}
    </p>
  </div>


  {/* Input Specification */}

  <div
    className={`rounded-xl border p-4 ${
      isDark
        ? "border-slate-800 bg-[#101c2d]"
        : "border-slate-200 bg-white shadow-sm"
    }`}
  >
    <p
      className={`text-[10px] uppercase tracking-wide ${
        isDark ? "text-slate-500" : "text-slate-400"
      }`}
    >
      Input Specification
    </p>

    <p
      className={`mt-3 text-sm font-semibold ${
        isDark ? "text-white" : "text-slate-900"
      }`}
    >
      {loadingSystemData
        ? "Checking..."
        : inputSpecData
        ? "Loaded"
        : "Waiting for API"}
    </p>
  </div>

</div>


{/* =================================================
    DATA SOURCE
================================================== */}

<div
  className={`rounded-lg border px-4 py-3 text-[11px] ${
    isDark
      ? "border-slate-800 bg-[#0b1626] text-slate-500"
      : "border-slate-200 bg-slate-50 text-slate-500"
  }`}
>
  <span className="font-semibold">
    Live API data:
  </span>{" "}
  Battery and model values are loaded from the
  Python/FastAPI backend.
</div>
{/* =================================================
    LATEST CYCLE DETAILS
================================================== */}

<div
  className={`overflow-hidden rounded-xl border ${
    isDark
      ? "border-slate-800 bg-[#101c2d]"
      : "border-slate-200 bg-white shadow-sm"
  }`}
>
  <div
    className={`border-b px-5 py-4 ${
      isDark
        ? "border-slate-800"
        : "border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3
          className={`text-sm font-semibold ${
            isDark
              ? "text-white"
              : "text-slate-900"
          }`}
        >
          Latest Cycle Details
        </h3>

        <p
          className={`mt-1 text-[10px] ${
            isDark
              ? "text-slate-400"
              : "text-slate-500"
          }`}
        >
          Detailed measurements and model predictions
        </p>
      </div>

      {cycleData && (
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            cycleData.is_test_cycle
              ? isDark
                ? "bg-amber-400/10 text-amber-300"
                : "bg-amber-50 text-amber-700"
              : isDark
                ? "bg-blue-400/10 text-blue-300"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {cycleData.is_test_cycle
            ? "Test Cycle"
            : "Train Cycle"}
        </span>
      )}
    </div>
  </div>

  <div className="p-5">
    {loadingCycle ? (
      <p
        className={`text-sm ${
          isDark
            ? "text-slate-400"
            : "text-slate-500"
        }`}
      >
        Loading cycle details...
      </p>
    ) : cycleData ? (
      <div className="space-y-5">

        {/* Cycle + SoH */}

        <div className="grid grid-cols-2 gap-3">

          <div
            className={`rounded-lg p-4 ${
              isDark
                ? "bg-[#0b1626]"
                : "bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wide ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Cycle
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                isDark
                  ? "text-white"
                  : "text-slate-900"
              }`}
            >
              {cycleData.cycle}
            </p>
          </div>

          <div
            className={`rounded-lg p-4 ${
              isDark
                ? "bg-[#0b1626]"
                : "bg-slate-50"
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-wide ${
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }`}
            >
              Actual SoH
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                isDark
                  ? "text-emerald-300"
                  : "text-emerald-600"
              }`}
            >
              {(cycleData.actual_soh * 100).toFixed(2)}%
            </p>
          </div>

        </div>

        {/* Features */}

        <div>
          <p
            className={`mb-3 text-[10px] font-semibold uppercase tracking-wide ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Normalized Features
          </p>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[
              ["Voltage", cycleData.features?.voltage],
              ["Current", cycleData.features?.current],
              ["Temperature", cycleData.features?.temperature],
              ["Capacity", cycleData.features?.capacity_calc],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`rounded-lg p-3 ${
                  isDark
                    ? "bg-[#0b1626]"
                    : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-[10px] ${
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    isDark
                      ? "text-slate-200"
                      : "text-slate-700"
                  }`}
                >
                  {typeof value === "number"
                    ? value.toFixed(4)
                    : "—"}
                </p>
              </div>
            ))}

          </div>
        </div>

        {/* Predictions */}

        <div>
          <p
            className={`mb-3 text-[10px] font-semibold uppercase tracking-wide ${
              isDark
                ? "text-slate-500"
                : "text-slate-400"
            }`}
          >
            Model Predictions
          </p>

          <div className="grid grid-cols-2 gap-3">

            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? "bg-[#0b1626]"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-[10px] ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Centralized 1D CNN
              </p>

              <p
                className={`mt-1 text-lg font-bold ${
                  isDark
                    ? "text-blue-300"
                    : "text-blue-600"
                }`}
              >
                {cycleData.predictions?.cnn_centralized != null
                  ? `${(
                      cycleData.predictions.cnn_centralized *
                      100
                    ).toFixed(2)}%`
                  : "—"}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                isDark
                  ? "bg-[#0b1626]"
                  : "bg-slate-50"
              }`}
            >
              <p
                className={`text-[10px] ${
                  isDark
                    ? "text-slate-500"
                    : "text-slate-400"
                }`}
              >
                Federated 1D CNN
              </p>

              <p
                className={`mt-1 text-lg font-bold ${
                  isDark
                    ? "text-purple-300"
                    : "text-purple-600"
                }`}
              >
                {cycleData.predictions?.cnn_federated != null
                  ? `${(
                      cycleData.predictions.cnn_federated *
                      100
                    ).toFixed(2)}%`
                  : "—"}
              </p>
            </div>

          </div>
        </div>

      </div>
    ) : (
      <p
        className={`text-sm ${
          isDark
            ? "text-slate-500"
            : "text-slate-400"
        }`}
      >
        Latest cycle data is unavailable.
      </p>
    )}
  </div>
</div>
        </>
      )}

    </div>
  )
}

export default Overview