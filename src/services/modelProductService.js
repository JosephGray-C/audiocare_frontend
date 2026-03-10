import { apiRequest } from "./apiClient";

export function createModelProduct(modelProduct) {
    return apiRequest("/models", {
        method: "POST",
        body: JSON.stringify(modelProduct),
    });
}

export function getModels() {
    return apiRequest("/models");
}
