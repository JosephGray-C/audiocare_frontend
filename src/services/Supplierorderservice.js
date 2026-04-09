import { apiRequest } from "./ApiClient";

export function getSupplierOrders() {
    return apiRequest("/supplier-orders");
}

export function getSupplierOrderById(id) {
    return apiRequest(`/supplier-orders/${id}`);
}

export function getSupplierOrdersByDateRange(from, to) {
    return apiRequest(`/supplier-orders/range?from=${from}&to=${to}`);
}

export function createSupplierOrder(order) {
    return apiRequest("/supplier-orders", {
        method: "POST",
        body: JSON.stringify(order),
    });
}

export function updateSupplierOrder(id, order) {
    return apiRequest(`/supplier-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(order),
    });
}