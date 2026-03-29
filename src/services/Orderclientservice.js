import { apiRequest } from "./apiClient";

export function getOrders() {
    return apiRequest("/orders");
}

export function getOrderById(id) {
    return apiRequest(`/orders/${id}`);
}

export function getOrdersByStatus(status) {
    return apiRequest(`/orders/status/${status}`);
}

export function getOrdersByClient(clientId) {
    return apiRequest(`/orders/client/${clientId}`);
}

export function createOrder(order) {
    return apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(order),
    });
}

export function updateOrder(id, order) {
    return apiRequest(`/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(order),
    });
}

export function updateOrderStatus(id, status) {
    return apiRequest(`/orders/${id}/status?status=${status}`, {
        method: "PATCH",
    });
}

export function cancelOrder(id) {
    return apiRequest(`/orders/${id}/cancel`, {
        method: "PATCH",
    });
}

export function deleteOrder(id) {
    return apiRequest(`/orders/${id}`, {
        method: "DELETE",
    });
}