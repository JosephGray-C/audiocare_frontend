import { apiRequest } from "./apiClient";

export function createAdmin(admin) {
    return apiRequest("/admins", {
        method: "POST",
        body: JSON.stringify(admin),
    });
}

export function changePassword(adminId, payload) {
    return apiRequest(`/admins/${adminId}/password`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}