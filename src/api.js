const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "")

async function handleResponse(response, defaultMessage) {
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Resource was not found.")
    }

    if (response.status === 422) {
      throw new Error(
        "Invalid data sent to the server."
      )
    }

    if (response.status === 503) {
      throw new Error(
        "The prediction model could not be loaded."
      )
    }

    throw new Error(defaultMessage)
  }

  return response.json()
}


// ─────────────────────────────────────────────
// 1. Health
// GET /health
// ─────────────────────────────────────────────

export async function getHealth() {
  try {
    const response = await fetch(`${API}/health`)

    return await handleResponse(
      response,
      "Failed to load API health."
    )
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 2. Models
// GET /models
// ─────────────────────────────────────────────

export async function getModels() {
  try {
    const response = await fetch(`${API}/models`)

    return await handleResponse(
      response,
      "Failed to load model information."
    )
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 3. Input Specification
// GET /input-spec
// ─────────────────────────────────────────────

export async function getInputSpec() {
  try {
    const response = await fetch(
      `${API}/input-spec`
    )

    return await handleResponse(
      response,
      "Failed to load input specification."
    )
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 4. Predict
// POST /predict
// ─────────────────────────────────────────────

export async function predict(data) {
  try {
    const response = await fetch(
      `${API}/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    return await handleResponse(
      response,
      "Prediction request failed."
    )
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 5. Compare Predictions
// POST /predict/compare
// ─────────────────────────────────────────────

export async function comparePredictions(data) {
  try {
    const response = await fetch(
      `${API}/predict/compare`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    return await handleResponse(
      response,
      "Prediction comparison failed."
    )
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 6. Batteries
// GET /batteries
// ─────────────────────────────────────────────

export async function getBatteries() {
  try {
    const response = await fetch(
      `${API}/batteries`
    )

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error(
          "The prediction model could not be loaded."
        )
      }

      throw new Error(
        "Failed to load batteries."
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 7. Battery Curve
// GET /batteries/{battery_id}/curve
// ─────────────────────────────────────────────

export async function getBatteryCurve(id) {
  try {
    const response = await fetch(
      `${API}/batteries/${encodeURIComponent(id)}/curve`
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Battery ${id} was not found.`
        )
      }

      if (response.status === 503) {
        throw new Error(
          "The prediction model could not be loaded."
        )
      }

      throw new Error(
        `Failed to load ${id} data.`
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}


// ─────────────────────────────────────────────
// 8. Cycle Details
// GET /batteries/{battery_id}/cycles/{cycle}
// ─────────────────────────────────────────────

export async function getCycleDetails(
  id,
  cycle
) {
  try {
    const response = await fetch(
      `${API}/batteries/${encodeURIComponent(
        id
      )}/cycles/${encodeURIComponent(cycle)}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Cycle ${cycle} for battery ${id} was not found.`
        )
      }

      throw new Error(
        `Failed to load cycle ${cycle}.`
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Can't reach the server")
    }

    throw error
  }
}