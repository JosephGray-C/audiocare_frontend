const API_URL = "http://localhost:8080/audiocare/api";

export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error("API request failed");
    }

    return response.json();
}