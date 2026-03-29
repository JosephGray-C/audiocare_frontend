import { apiRequest } from "./apiClient";

export function getClients() {
    return apiRequest("/clients");
}

export function getClientById(id) {
    return apiRequest(`/clients/${id}`);
}

export function searchClients(name) {
    return apiRequest(`/clients/search?name=${encodeURIComponent(name)}`);
}

export function getClientsByType(type) {
    return apiRequest(`/clients/type/${type}`);
}

export function createClient(client) {
    return apiRequest("/clients", {
        method: "POST",
        body: JSON.stringify(client),
    });
}

export function updateClient(id, client) {
    return apiRequest(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(client),
    });
}

export function deleteClient(id) {
    return apiRequest(`/clients/${id}`, {
        method: "DELETE",
    });
}