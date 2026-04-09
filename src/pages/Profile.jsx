import { useEffect, useMemo, useState } from "react";
import { User, IdCard, Mail, Lock, Pencil, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import { changePassword } from "../services/adminService";
import LoadingButton from "../components/ui/LoadingButton";
import FormField from "../components/form/FormField";

const PERSONAL_FIELDS = [
    { key: "identityNumber", label: "Número de identidad", icon: IdCard },
    { key: "name", label: "Nombre", icon: User },
    { key: "lastName1", label: "Primer apellido", icon: User },
    { key: "lastName2", label: "Segundo apellido", icon: User },
    { key: "email", label: "Correo electrónico", icon: Mail, type: "email" },
];

function buildInitialForm(auth) {
    return {
        identityNumber: auth?.identityNumber || "",
        name: auth?.name || "",
        lastName1: auth?.lastName1 || "",
        lastName2: auth?.lastName2 || "",
        email: auth?.email || "",
    };
}

export default function Profile() {
    const { auth } = useAuth();
    const { showAlert } = useAlert();

    const [profileData, setProfileData] = useState(buildInitialForm(auth));
    const [editingPassword, setEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loadingPassword, setLoadingPassword] = useState(false);

    const shouldShowConfirmPassword = newPassword.trim().length > 0;

    useEffect(() => {
        setProfileData(buildInitialForm(auth));
        setEditingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        setLoadingPassword(false);
    }, [auth]);

    const displayName = useMemo(() => {
        return [auth?.name, auth?.lastName1, auth?.lastName2].filter(Boolean).join(" ");
    }, [auth]);

    function startEditingPassword() {
        setEditingPassword(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
    }

    function cancelEditingPassword() {
        setEditingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
    }

    function handleCurrentPasswordChange(e) {
        setCurrentPassword(e.target.value);
        setErrors(prev => ({ ...prev, currentPassword: null }));
    }

    function handleNewPasswordChange(e) {
        setNewPassword(e.target.value);
        setErrors(prev => ({
            ...prev,
            newPassword: null,
            confirmPassword: null,
        }));
    }

    function handleConfirmPasswordChange(e) {
        setConfirmPassword(e.target.value);
        setErrors(prev => ({ ...prev, confirmPassword: null }));
    }

    function validatePassword() {
        const newErrors = {};

        if (!currentPassword.trim()) {
            newErrors.currentPassword = "La contraseña actual es obligatoria";
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = "La nueva contraseña es obligatoria";
        } else if (newPassword.length < 8) {
            newErrors.newPassword = "Debe tener al menos 8 caracteres";
        }

        if (shouldShowConfirmPassword) {
            if (!confirmPassword.trim()) {
                newErrors.confirmPassword = "Confirme la nueva contraseña";
            } else if (newPassword !== confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        return newErrors;
    }

    async function handleSavePassword() {
        const validationErrors = validatePassword();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoadingPassword(true);

            await changePassword(auth.adminId, {
                currentPassword,
                newPassword,
            });

            showAlert("Contraseña actualizada correctamente", "success");
            cancelEditingPassword();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoadingPassword(false);
        }
    }

    return (
        <div className='w-full'>
            <div className='max-w-5xl mx-auto space-y-6'>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-xl bg-[#ef7d2d]/10 flex items-center justify-center'>
                        <ShieldCheck size={18} className='text-[#ef7d2d]' />
                    </div>

                    <div>
                        <h1 className='text-xl font-bold text-slate-800'>Perfil</h1>
                        <p className='text-sm text-slate-400'>{displayName || "Administrador"}</p>
                    </div>
                </div>

                <section className='space-y-4'>
                    <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Acceso</h2>

                    <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm'>
                        <div className='grid grid-cols-1 lg:grid-cols-[220px_1fr]'>
                            <div className='px-5 py-4 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-100'>
                                <p className='text-sm font-medium text-slate-600'>Contraseña</p>
                            </div>

                            <div className='px-5 py-4'>
                                {!editingPassword ? (
                                    <div className='space-y-3'>
                                        <div className='min-h-[42px] flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5'>
                                            <span className='text-sm text-slate-700 break-all'>••••••••</span>
                                        </div>

                                        <button
                                            type='button'
                                            onClick={startEditingPassword}
                                            className='inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#34c3d6] transition-colors'
                                        >
                                            <Pencil size={14} />
                                            Editar
                                        </button>
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        <FormField
                                            name='currentPassword'
                                            label='Contraseña actual'
                                            type='password'
                                            icon={Lock}
                                            value={currentPassword}
                                            onChange={handleCurrentPasswordChange}
                                            error={errors.currentPassword}
                                            placeholder='Ingrese su contraseña actual'
                                        />

                                        <FormField
                                            name='newPassword'
                                            label='Nueva contraseña'
                                            type='password'
                                            icon={Lock}
                                            value={newPassword}
                                            onChange={handleNewPasswordChange}
                                            error={errors.newPassword}
                                            placeholder='Mínimo 8 caracteres'
                                        />

                                        <div
                                            className={`
                                                overflow-hidden transition-all duration-500 ease-in-out
                                                ${shouldShowConfirmPassword ? "max-h-40 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                                            `}
                                        >
                                            <FormField
                                                name='confirmPassword'
                                                label='Confirmar contraseña'
                                                type='password'
                                                icon={Lock}
                                                value={confirmPassword}
                                                onChange={handleConfirmPasswordChange}
                                                error={errors.confirmPassword}
                                                placeholder='Repita la nueva contraseña'
                                            />
                                        </div>

                                        <div className='flex justify-end gap-3'>
                                            <button
                                                type='button'
                                                onClick={cancelEditingPassword}
                                                disabled={loadingPassword}
                                                className='rounded-xl border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50'
                                            >
                                                Cancelar
                                            </button>

                                            <LoadingButton type='button' onClick={handleSavePassword} loading={loadingPassword}>
                                                Guardar
                                            </LoadingButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className='space-y-4'>
                    <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Datos personales</h2>

                    <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm'>
                        {PERSONAL_FIELDS.map(field => (
                            <ReadOnlyProfileRow key={field.key} field={field} value={profileData[field.key]} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function ReadOnlyProfileRow({ field, value }) {
    return (
        <div className='grid grid-cols-1 lg:grid-cols-[220px_1fr]'>
            <div className='px-5 py-4 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-100'>
                <p className='text-sm font-medium text-slate-600'>{field.label}</p>
            </div>

            <div className='px-5 py-4'>
                <div className='min-h-[42px] flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5'>
                    <span className='text-sm text-slate-700 break-all'>{value || "—"}</span>
                </div>
            </div>
        </div>
    );
}