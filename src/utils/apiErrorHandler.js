export function handleApiError(error, showAlert) {
    if (!error.response) {
        showAlert("No se pudo conectar con el servidor", "error");
        return;
    }

    const { status, data } = error.response;

    if (status === 400) {
        showAlert(data.message || "Datos inválidos", "warning");
    } else if (status === 409) {
        showAlert(data.message || "El registro ya existe", "warning");
    } else if (status >= 500) {
        showAlert("Error interno del servidor", "error");
    } else {
        showAlert("Error inesperado", "error");
    }
}
