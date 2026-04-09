import { createContext, useContext, useState, useCallback, useMemo } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";

const AlertContext = createContext();

const INITIAL_ALERT = {
    open: false,
    mode: "alert", // "alert" | "confirm"
    message: "",
    severity: "success",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    onConfirm: null,
};

function getDuration(severity) {
    if (severity === "error" || severity === "warning") return 5000;
    return 3000;
}

export function AlertProvider({ children }) {
    const [alert, setAlert] = useState(INITIAL_ALERT);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const clearAlertState = useCallback(() => {
        setAlert(INITIAL_ALERT);
        setConfirmLoading(false);
    }, []);

    const closeAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, open: false }));
    }, []);

    const handleClose = useCallback(
        (_, reason) => {
            if (reason === "clickaway" || confirmLoading) return;
            closeAlert();
        },
        [closeAlert, confirmLoading],
    );

    const handleExited = useCallback(() => {
        clearAlertState();
    }, [clearAlertState]);

    const showAlert = useCallback((message, severity = "success") => {
        setConfirmLoading(false);
        setAlert({
            ...INITIAL_ALERT,
            open: true,
            mode: "alert",
            message,
            severity,
        });
    }, []);

    const showConfirm = useCallback(({ message, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm, severity = "warning" }) => {
        setConfirmLoading(false);
        setAlert({
            ...INITIAL_ALERT,
            open: true,
            mode: "confirm",
            message,
            severity,
            confirmText,
            cancelText,
            onConfirm,
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!alert.onConfirm || confirmLoading) return;

        const confirmAction = alert.onConfirm;

        try {
            setConfirmLoading(true);

            // Cierra la confirmación actual primero
            closeAlert();

            // Ejecuta la acción. Si esta acción llama showAlert(...),
            // esa nueva alerta ya no será pisada por un reset posterior.
            await confirmAction();
        } catch (error) {
            setConfirmLoading(false);
            throw error;
        }
    }, [alert.onConfirm, confirmLoading, closeAlert]);

    const value = useMemo(
        () => ({
            showAlert,
            showConfirm,
            closeAlert,
        }),
        [showAlert, showConfirm, closeAlert],
    );

    return (
        <AlertContext.Provider value={value}>
            {children}

            <Snackbar
                open={alert.open}
                autoHideDuration={alert.mode === "alert" ? getDuration(alert.severity) : null}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                sx={{ mb: 3 }}
            >
                <Alert
                    onClose={alert.mode === "alert" ? handleClose : undefined}
                    severity={alert.severity}
                    variant='outlined'
                    sx={{
                        width: {
                            xs: "calc(100vw - 24px)",
                            sm: alert.mode === "confirm" ? "520px" : "420px",
                        },
                        maxWidth: alert.mode === "confirm" ? "520px" : "420px",
                        bgcolor: "background.paper",
                        alignItems: "flex-start",
                        "& .MuiAlert-message": {
                            width: "100%",
                        },
                    }}
                >
                    {alert.mode === "alert" ? (
                        alert.message
                    ) : (
                        <Stack spacing={1.5}>
                            <span>{alert.message}</span>

                            <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                <Button
                                    size='small'
                                    variant='outlined'
                                    color='inherit'
                                    onClick={closeAlert}
                                    disabled={confirmLoading}
                                    sx={{
                                        textTransform: "none",
                                        borderRadius: "3px",
                                    }}
                                >
                                    {alert.cancelText}
                                </Button>

                                <Button
                                    size='small'
                                    variant='contained'
                                    color={alert.severity === "error" ? "error" : "warning"}
                                    onClick={handleConfirm}
                                    disabled={confirmLoading}
                                    sx={{
                                        textTransform: "none",
                                        borderRadius: "3px",
                                    }}
                                    startIcon={confirmLoading ? <CircularProgress size={14} color='inherit' /> : null}
                                >
                                    {confirmLoading ? "Procesando..." : alert.confirmText}
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </Alert>
            </Snackbar>
        </AlertContext.Provider>
    );
}

export const useAlert = () => useContext(AlertContext);
