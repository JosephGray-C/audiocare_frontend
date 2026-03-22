import { apiRequest } from "./apiClient";

// GET available products (FIFO order)
export function getAvailableProducts() {
    return apiRequest("/products");
}

// GET all products including billed
export function getAllProducts() {
    return apiRequest("/products/all");
}

export function getProductById(id) {
    return apiRequest(`/products/${id}`);
}

export function getProductBySerial(serialNum) {
    return apiRequest(`/products/serial/${encodeURIComponent(serialNum)}`);
}

export function getProductsByModel(modelId, status = "AVAILABLE") {
    return apiRequest(`/products/model/${modelId}?status=${status}`);
}

export function getProductsBySupplierOrder(supplierOrderId) {
    return apiRequest(`/products/supplier-order/${supplierOrderId}`);
}

export function getOldestAvailable(modelId) {
    return apiRequest(`/products/fifo/${modelId}`);
}

export function createProduct(product) {
    return apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(product),
    });
}

export function updateProduct(id, product) {
    return apiRequest(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(product),
    });
}

export function deleteProduct(id) {
    return apiRequest(`/products/${id}`, {
        method: "DELETE",
    });
}