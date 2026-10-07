import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Sidebar from "./components/Sidebar"
import Header from "./components/Header"

import Overview from "./pages/Overview"
import Analysis from "./pages/Analysis"
import ModelResults from "./pages/ModelResults"
import FederatedLearning from "./pages/FederatedLearning"
import Predictions from "./pages/Predictions"

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "light"
  })

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    )
  }

  const isDark = theme === "dark"

  return (
    <BrowserRouter>
      <div
        className={
          isDark
            ? "min-h-screen bg-[#07111f] text-slate-100"
            : "min-h-screen bg-[#eef3f8] text-slate-900"
        }
      >
        <div className="flex min-h-screen">
          <Sidebar theme={theme} />

          <div className="min-w-0 flex-1">
            <Header
              theme={theme}
              onToggleTheme={toggleTheme}
            />

            <main className="px-6 pb-10 lg:px-8">
  <Routes>
    <Route
      path="/"
      element={<Overview theme={theme} />}
    />

    <Route
      path="/battery-analysis"
      element={<Analysis />}
    />

    <Route
      path="/models"
      element={<ModelResults />}
    />

    <Route
      path="/federated-learning"
      element={<FederatedLearning theme={theme} />}
    />

    <Route
  path="/predictions"
  element={<Predictions theme={theme} />}
/>
  </Routes>
</main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App