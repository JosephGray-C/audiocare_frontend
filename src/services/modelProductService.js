import { apiRequest } from "./ApiClient";

export function getModelProducts() {
    return apiRequest("/models");
}

export function getModelProductById(id) {
    return apiRequest(`/models/${id}`);
}

export function searchModelProducts(name) {
    return apiRequest(`/models/search?name=${encodeURIComponent(name)}`);
}

export function getModelProductsByStatus(status) {
    return apiRequest(`/models/status/${status}`);
}

export function createModelProduct(modelProduct) {
    return apiRequest("/models", {
        method: "POST",
        body: JSON.stringify(modelProduct),
    });
}

export function updateModelProduct(id, modelProduct) {
    return apiRequest(`/models/${id}`, {
        method: "PUT",
        body: JSON.stringify(modelProduct),
    });
}

export function deleteModelProduct(id) {
    return apiRequest(`/models/${id}`, {
        method: "DELETE",
    });
}