import { useState, useEffect } from "react";
import { ShieldCheck, User, IdCard, Mail, Lock } from "lucide-react";
import { createAdmin, updateAdmin } from "../../services/adminService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import FormField from "../form/FormField";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import ModuleFormActions from "../ui/ModuleFormActions";

const EMPTY_FORM = {
    identityNumber: "",
    name: "",
    lastName1: "",
    lastName2: "",
    email: "",
    password: "",
    confirmPassword: "",
    isMaster: false,
};

function getInitialForm(admin) {
    if (!admin) return EMPTY_FORM;

    return {
        identityNumber: admin.identityNumber || "",
        name: admin.name || "",
        lastName1: admin.lastName1 || "",
        lastName2: admin.lastName2 || "",
        email: admin.email || "",
        password: "",
        confirmPassword: "",
        isMaster: admin.isMaster || false,
    };
}

export default function AdminFormView({ admin = null, onSaved }) {
    const [formData, setFormData] = useState(getInitialForm(admin));
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { showAlert, closeAlert } = useAlert();

    const isEdit = !!admin;
    const shouldShowConfirmPassword = formData.password.trim().length > 0;

    useEffect(() => {
        const initial = getInitialForm(admin);
        setFormData(initial);
        setErrors({});
    }, [admin]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        setErrors(prev => ({
            ...prev,
            [name]: null,
            ...(name === "password" ? { confirmPassword: null } : {}),
        }));
    }

    function handleReset() {
        const initial = getInitialForm(admin);
        setFormData(initial);
        setErrors({});
        closeAlert();
    }

    function validate() {
        const newErrors = {};

        if (!formData.identityNumber.trim()) newErrors.identityNumber = "Obligatorio";
        if (!formData.name.trim()) newErrors.name = "Obligatorio";
        if (!formData.lastName1.trim()) newErrors.lastName1 = "Obligatorio";
        if (!formData.lastName2.trim()) newErrors.lastName2 = "Obligatorio";

        if (!formData.email.trim()) {
            newErrors.email = "Obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Formato inválido";
        }

        if (!isEdit && !formData.password.trim()) {
            newErrors.password = "Obligatoria al crear";
        } else if (formData.password && formData.password.length < 8) {
            newErrors.password = "Mínimo 8 caracteres";
        }

        if (shouldShowConfirmPassword) {
            if (!formData.confirmPassword.trim()) {
                newErrors.confirmPassword = "Confirme la contraseña";
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Las contraseñas no coinciden";
            }
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showAlert("Hay errores en el formulario", "warning");
            return;
        }

        const payload = {
            identityNumber: formData.identityNumber,
            name: formData.name,
            lastName1: formData.lastName1,
            lastName2: formData.lastName2,
            email: formData.email,
            password: formData.password,
            isMaster: formData.isMaster,
        };

        if (isEdit && !payload.password) {
            delete payload.password;
        }

        try {
            setLoading(true);

            if (isEdit) {
                await updateAdmin(admin.id, payload);
                showAlert("Admin actualizado correctamente", "success");
            } else {
                await createAdmin(payload);
                showAlert("Admin creado correctamente", "success");
            }

            setFormData(EMPTY_FORM);
            setErrors({});
            onSaved?.();
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full'>
            <div className='max-w-4xl mx-auto space-y-5'>
                <ModulePanelHeader
                    title={isEdit ? "Editar Administrador" : "Registrar Administrador"}
                    subtitle={
                        isEdit
                            ? "Actualice la información del administrador seleccionado"
                            : "Complete los datos para registrar un nuevo administrador"
                    }
                    icon={ShieldCheck}
                    variant='form'
                />

                <form id='adminForm' onSubmit={handleSubmit} className='space-y-5'>
                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Datos del administrador</h2>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <FormField
                                name='identityNumber'
                                label='Número de identidad'
                                icon={IdCard}
                                value={formData.identityNumber}
                                onChange={handleChange}
                                error={errors.identityNumber}
                                placeholder='Ej: 123456789'
                            />

                            <FormField
                                name='name'
                                label='Nombre'
                                icon={User}
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                placeholder='Nombre'
                            />
                        </div>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <FormField
                                name='lastName1'
                                label='Primer apellido'
                                value={formData.lastName1}
                                onChange={handleChange}
                                error={errors.lastName1}
                                placeholder='Apellido 1'
                            />

                            <FormField
                                name='lastName2'
                                label='Segundo apellido'
                                value={formData.lastName2}
                                onChange={handleChange}
                                error={errors.lastName2}
                                placeholder='Apellido 2'
                            />
                        </div>
                    </div>

                    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4'>
                        <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wider'>Acceso</h2>

                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <FormField
                                name='email'
                                label='Correo electrónico'
                                icon={Mail}
                                type='email'
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                                placeholder='admin@audiocare.com'
                            />

                            <FormField
                                name='password'
                                label={isEdit ? "Nueva contraseña" : "Contraseña"}
                                icon={Lock}
                                type='password'
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                placeholder={isEdit ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
                            />
                        </div>

                        <div
                            className={`
                                overflow-hidden transition-all duration-500 ease-in-out
                                ${shouldShowConfirmPassword ? "max-h-40 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
                            `}
                        >
                            <div className='pt-1'>
                                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                                    <div className='lg:col-start-2'>
                                        <FormField
                                            name='confirmPassword'
                                            label='Confirmar contraseña'
                                            icon={Lock}
                                            type='password'
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            error={errors.confirmPassword}
                                            placeholder='Repita la contraseña'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <ModuleFormActions
                    onReset={handleReset}
                    resetText='Limpiar'
                    submitText={isEdit ? "Actualizar Admin" : "Crear Admin"}
                    submitFormId='adminForm'
                    loading={loading}
                />
            </div>
        </div>
    );
}