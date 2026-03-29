import { apiRequest } from "./apiClient";

export function getAdmins() {
    return apiRequest("/admins");
}

export function getAdminById(id) {
    return apiRequest(`/admins/${id}`);
}

export function createAdmin(admin) {
    return apiRequest("/admins", {
        method: "POST",
        body: JSON.stringify(admin),
    });
}

export function updateAdmin(id, admin) {
    return apiRequest(`/admins/${id}`, {
        method: "PUT",
        body: JSON.stringify(admin),
    });
}

export function updateAdminPermissions(id, permissions) {
    return apiRequest(`/admins/${id}/permissions`, {
        method: "PUT",
        body: JSON.stringify(permissions),
    });
}

export function deleteAdmin(id) {
    return apiRequest(`/admins/${id}`, {
        method: "DELETE",
    });
}

export function changePassword(adminId, payload) {
    return apiRequest(`/admins/${adminId}/password`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}