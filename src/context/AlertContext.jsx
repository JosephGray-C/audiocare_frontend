import { createContext, useContext, useState, useCallback, useMemo } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const AlertContext = createContext();

function getDuration(severity) {
    if (severity === "error" || severity === "warning") return 5000;
    return 3000;
}

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const showAlert = useCallback((message, severity = "success") => {
        setAlert({
            open: true,
            message,
            severity,
        });
    }, []);

    const handleClose = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);

    const value = useMemo(() => ({ showAlert }), [showAlert]);

    return (
        <AlertContext.Provider value={value}>
            {children}

            <Snackbar
                open={alert.open}
                autoHideDuration={getDuration(alert.severity)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                sx={{ mb: 3 }}
            >
                <Alert
                    onClose={handleClose}
                    severity={alert.severity}
                    variant='outlined'
                    sx={{
                        width: {
                            xs: "calc(100vw - 24px)",
                            sm: "420px",
                        },
                        maxWidth: "420px",
                        bgcolor: "background.paper",
                    }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </AlertContext.Provider>
    );
}

export const useAlert = () => useContext(AlertContext);
