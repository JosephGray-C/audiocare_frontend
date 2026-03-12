import { apiRequest } from "./apiClient";

export function createModelProduct(modelProduct) {
    return apiRequest("/models", {
        method: "POST",
        body: JSON.stringify(modelProduct),
    });
}

export function getModelProducts(id) {
    return apiRequest("/models");
}
