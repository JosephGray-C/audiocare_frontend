import { apiRequest } from "./ApiClient.js";

export function login(credentials) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}