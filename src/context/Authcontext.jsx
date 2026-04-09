import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const STORAGE_KEY = "audiocare_auth";

function loadStoredAuth() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Basic expiry check: if no token, discard
        if (!parsed?.token) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => loadStoredAuth());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Sync state on mount
        setLoading(false);
    }, []);

    useEffect(() => {
        if (auth) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [auth]);

    function saveLogin(loginResponse) {
        setAuth({
            token: loginResponse.token,
            adminId: loginResponse.adminId,
            name: loginResponse.name,
            lastName1: loginResponse.lastName1,
            email: loginResponse.email,
            isMaster: loginResponse.isMaster,
            permissions: loginResponse.permissions,
        });
    }

    function logout() {
        setAuth(null);
    }

    const isAuthenticated = !!auth?.token;

    return (
        <AuthContext.Provider
            value={{
                auth,
                isAuthenticated,
                loading,
                saveLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);