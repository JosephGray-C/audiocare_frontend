import { createContext, useContext, useState, useCallback, useMemo } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

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

    const confirmStylesBySeverity = {
        warning: {
            borderColor: "#f59e0b",
            color: "#b45309",
            hoverBg: "#fffbeb",
        },
        error: {
            borderColor: "#ef4444",
            color: "#b91c1c",
            hoverBg: "#fef2f2",
        },
        success: {
            borderColor: "#22c55e",
            color: "#15803d",
            hoverBg: "#f0fdf4",
        },
        info: {
            borderColor: "#3b82f6",
            color: "#1d4ed8",
            hoverBg: "#eff6ff",
        },
    };

    const severityStyle = confirmStylesBySeverity[alert.severity] || confirmStylesBySeverity.warning;

    const neutralActionButtonSx = {
        minWidth: 36,
        width: 36,
        height: 36,
        p: 0,
        borderRadius: "30px",
        borderColor: "#e2e8f0",
        color: "#64748b",
        backgroundColor: "#ffffff",
        boxShadow: "none",
        transition: "all 0.2s ease",
        "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#f8fafc",
            boxShadow: "none",
        },
    };

    const semanticActionButtonSx = {
        minWidth: 36,
        width: 36,
        height: 36,
        p: 0,
        borderRadius: "30px",
        borderColor: severityStyle.borderColor,
        color: severityStyle.color,
        backgroundColor: "#ffffff",
        boxShadow: "none",
        transition: "all 0.2s ease",
        "&:hover": {
            borderColor: severityStyle.borderColor,
            backgroundColor: severityStyle.hoverBg,
            boxShadow: "none",
        },
        "&:disabled": {
            borderColor: "#e2e8f0",
            color: "#94a3b8",
        },
    };

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
                    severity={alert.severity}
                    variant='outlined'
                    sx={{
                        width: {
                            xs: "calc(100vw - 24px)",
                            sm: alert.mode === "confirm" ? "460px" : "420px",
                        },
                        maxWidth: alert.mode === "confirm" ? "460px" : "420px",
                        bgcolor: "background.paper",
                        display: "flex",
                        alignItems: "center",
                        py: 1,
                        "& .MuiAlert-icon": {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            m: 0,
                            mr: 1,
                            alignSelf: "center",
                        },
                        "& .MuiAlert-message": {
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            py: 0,
                        },
                    }}
                >
                    <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2} sx={{ width: "100%" }}>
                        <span
                            style={{
                                display: "block",
                                lineHeight: 1.35,
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {alert.message}
                        </span>

                        {alert.mode === "alert" ? (
                            <Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
                                <Button size='small' variant='outlined' onClick={handleClose} sx={semanticActionButtonSx}>
                                    <CloseIcon fontSize='small' />
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
                                <Button
                                    size='small'
                                    variant='outlined'
                                    onClick={closeAlert}
                                    disabled={confirmLoading}
                                    sx={neutralActionButtonSx}
                                >
                                    <CloseIcon fontSize='small' />
                                </Button>

                                <Button
                                    size='small'
                                    variant='outlined'
                                    onClick={handleConfirm}
                                    disabled={confirmLoading}
                                    sx={semanticActionButtonSx}
                                >
                                    {confirmLoading ? <CircularProgress size={14} color='inherit' /> : <CheckIcon fontSize='small' />}
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </Alert>
            </Snackbar>
        </AlertContext.Provider>
    );
}

export const useAlert = () => useContext(AlertContext);
