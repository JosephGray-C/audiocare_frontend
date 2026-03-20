export function handleApiError(error, showAlert) {
    // If fetch itself failed (network error, server down, etc.)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
        showAlert("No se pudo conectar con el servidor", "error");
        return;
    }

    // apiClient.js throws a plain Error with the message extracted
    // from the backend JSON response, so we can use it directly.
    const message = error?.message || "Error inesperado";

    // Map known patterns to appropriate severity
    if (message.includes("Ya existe")) {
        showAlert(message, "warning");
    } else if (
        message.includes("obligatorio") ||
        message.includes("inválido") ||
        message.includes("Datos inválidos")
    ) {
        showAlert(message, "warning");
    } else {
        showAlert(message, "error");
    }
}
