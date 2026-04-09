import { apiRequest } from "./apiClient";

export function getMovements() {
    return apiRequest("/movements");
}

export function getMovementsByEventType(eventType) {
    return apiRequest(`/movements/event/${eventType}`);
}

export function getMovementsByProduct(productId) {
    return apiRequest(`/movements/product/${productId}`);
}

export function getMovementsByDateRange(from, to) {
    return apiRequest(`/movements/range?from=${from}&to=${to}`);
}