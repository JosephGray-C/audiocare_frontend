const API_URL = "http://localhost:8080/audiocare/api";

const STORAGE_KEY = "audiocare_auth";

function getToken() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw)?.token ?? null;
    } catch {
        return null;
    }
}

export async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid — clear auth and redirect
        localStorage.removeItem(STORAGE_KEY);
        window.location.hash = "#/login";
        throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
    }

    if (response.status === 403) {
        throw new Error("No tienes permisos para realizar esta acción.");
    }

    if (!response.ok) {
        // Try to extract error message from backend
        let errorMessage = "Error en la solicitud";
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
            // ignore parse errors
        }
        throw new Error(errorMessage);
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) return null;

    return response.json();
}