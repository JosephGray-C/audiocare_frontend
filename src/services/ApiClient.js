const API_URL = "http://198.199.68.97/audiocare/api";
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

    // Handle 401
    if (response.status === 401) {
        if (token) {
            // Session expired
            localStorage.removeItem(STORAGE_KEY);
            window.location.hash = "#/login";
            throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
        }
    }

    // Handle 403
    if (response.status === 403) {
        throw new Error("No tienes permisos para realizar esta acción.");
    }

    // Handle other errors (including 401 without token)
    if (!response.ok) {
        let errorMessage = "Error en la solicitud";
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
    }

    if (response.status === 204) return null;

    return response.json();
}