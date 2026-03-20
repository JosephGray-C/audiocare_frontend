import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Headphones, User, IdCard, UserPlus, LogIn } from "lucide-react";
import { login } from "../services/authService";
import { createAdmin } from "../services/adminService";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import LoadingButton from "../components/ui/LoadingButton";

// ─── DEV MODE ────────────────────────────────────────────────────────────
// Set to false (or remove the register UI entirely) before production.
const DEV_ENABLE_REGISTER = true;
// ─────────────────────────────────────────────────────────────────────────

const LOGIN_INITIAL = { email: "", password: "" };

const REGISTER_INITIAL = {
    identityNumber: "",
    name: "",
    lastName1: "",
    lastName2: "",
    email: "",
    password: "",
    isMaster: true, // First admin should be master; change as needed
};

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [loginData, setLoginData] = useState(LOGIN_INITIAL);
    const [registerData, setRegisterData] = useState(REGISTER_INITIAL);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { saveLogin } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const formData = isRegister ? registerData : loginData;
    const setFormData = isRegister ? setRegisterData : setLoginData;

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function toggleMode() {
        setIsRegister(prev => !prev);
        setErrors({});
        setShowPassword(false);
    }

    // ── Validation ───────────────────────────────────────────────────────

    function validateLogin() {
        const newErrors = {};
        if (!loginData.email.trim()) {
            newErrors.email = "El correo es obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
            newErrors.email = "Formato de correo inválido";
        }
        if (!loginData.password.trim()) {
            newErrors.password = "La contraseña es obligatoria";
        }
        return newErrors;
    }

    function validateRegister() {
        const newErrors = {};
        if (!registerData.identityNumber.trim()) {
            newErrors.identityNumber = "El número de identidad es obligatorio";
        }
        if (!registerData.name.trim()) {
            newErrors.name = "El nombre es obligatorio";
        }
        if (!registerData.lastName1.trim()) {
            newErrors.lastName1 = "El primer apellido es obligatorio";
        }
        if (!registerData.lastName2.trim()) {
            newErrors.lastName2 = "El segundo apellido es obligatorio";
        }
        if (!registerData.email.trim()) {
            newErrors.email = "El correo es obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
            newErrors.email = "Formato de correo inválido";
        }
        if (!registerData.password.trim()) {
            newErrors.password = "La contraseña es obligatoria";
        } else if (registerData.password.length < 8) {
            newErrors.password = "La contraseña debe tener al menos 8 caracteres";
        }
        return newErrors;
    }

    // ── Submit ───────────────────────────────────────────────────────────

    async function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = isRegister ? validateRegister() : validateLogin();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            if (isRegister) {
                await createAdmin(registerData);
                showAlert("Admin registrado correctamente. Ahora puede iniciar sesión.", "success");
                setRegisterData(REGISTER_INITIAL);
                setIsRegister(false);
            } else {
                const response = await login(loginData);
                saveLogin(response);
                showAlert(`Bienvenido, ${response.name}`, "success");
                navigate("/", { replace: true });
            }
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    // ── Reusable input renderer ──────────────────────────────────────────

    function renderField({ name, label, type = "text", icon: Icon, placeholder, autoComplete }) {
        const isPasswordField = type === "password";
        const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

        return (
            <div className="space-y-1.5">
                <label htmlFor={name} className="block text-sm font-medium text-slate-600">
                    {label}
                </label>
                <div className="relative">
                    {Icon && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Icon size={16} className={errors[name] ? "text-red-400" : "text-slate-400"} />
                        </div>
                    )}
                    <input
                        id={name}
                        name={name}
                        type={inputType}
                        autoComplete={autoComplete}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={`
                            w-full ${Icon ? "pl-10" : "pl-4"} ${isPasswordField ? "pr-11" : "pr-4"} py-2.5 rounded-xl
                            border text-sm text-slate-700
                            placeholder:text-slate-300
                            outline-none transition-colors
                            ${errors[name]
                            ? "border-red-300 focus:border-red-400 bg-red-50/40"
                            : "border-slate-200 focus:border-[#34c3d6] bg-white"
                        }
                        `}
                    />
                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            tabIndex={-1}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}
                </div>
                {errors[name] && (
                    <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
                )}
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#1a2332] to-[#2a3a4e] flex-col justify-between p-12">
                {/* Decorative circles */}
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#34c3d6]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ef7d2d]/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-[#34c3d6]/5 rounded-full blur-2xl" />

                {/* Top section */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/20 flex items-center justify-center">
                            <Headphones size={22} className="text-[#34c3d6]" />
                        </div>
                        <span className="text-white/90 text-xl font-semibold tracking-wide">
                            AudioCare
                        </span>
                    </div>
                </div>

                {/* Center content */}
                <div className="relative z-10 -mt-12">
                    <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                        Sistema de Gestión
                        <br />
                        <span className="text-[#34c3d6]">de Inventario</span>
                    </h1>
                    <p className="text-white/50 text-base leading-relaxed max-w-md">
                        Control completo de su inventario de dispositivos auditivos.
                        Gestione pedidos, productos y ventas en un solo lugar.
                    </p>

                    {/* Stats row */}
                    <div className="flex gap-8 mt-10">
                        <div>
                            <div className="text-2xl font-bold text-[#34c3d6]">FIFO</div>
                            <div className="text-white/40 text-sm mt-1">Rotación inteligente</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div>
                            <div className="text-2xl font-bold text-[#f0a45a]">€ / ₡</div>
                            <div className="text-white/40 text-sm mt-1">Multi-moneda</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div>
                            <div className="text-2xl font-bold text-white/80">100%</div>
                            <div className="text-white/40 text-sm mt-1">Trazabilidad</div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="relative z-10">
                    <p className="text-white/30 text-sm">
                        © {new Date().getFullYear()} AudioCare — Dispositivos Auditivos
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center bg-[#f4f4f4] px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
                        <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/15 flex items-center justify-center">
                            <Headphones size={22} className="text-[#34c3d6]" />
                        </div>
                        <span className="text-slate-800 text-xl font-semibold tracking-wide">
                            AudioCare
                        </span>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Card header */}
                        <div className="px-6 pt-8 pb-2 lg:px-8">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {isRegister ? "Registrar administrador" : "Iniciar sesión"}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {isRegister
                                    ? "Complete los datos para crear una cuenta de admin"
                                    : "Ingrese sus credenciales para acceder al sistema"
                                }
                            </p>

                            {/* DEV banner */}
                            {isRegister && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-xs text-amber-700 font-medium">
                                        Modo desarrollo — Este formulario se eliminará en producción
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Form */}
                        <form
                            id="authForm"
                            onSubmit={handleSubmit}
                            className="px-6 py-6 space-y-4 lg:px-8"
                        >
                            {isRegister ? (
                                <>
                                    {renderField({
                                        name: "identityNumber",
                                        label: "Número de identidad",
                                        icon: IdCard,
                                        placeholder: "Ej: 123456789",
                                    })}

                                    {renderField({
                                        name: "name",
                                        label: "Nombre",
                                        icon: User,
                                        placeholder: "Ingrese su nombre",
                                        autoComplete: "given-name",
                                    })}

                                    {/* Apellidos en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {renderField({
                                            name: "lastName1",
                                            label: "Primer apellido",
                                            placeholder: "Apellido 1",
                                            autoComplete: "family-name",
                                        })}
                                        {renderField({
                                            name: "lastName2",
                                            label: "Segundo apellido",
                                            placeholder: "Apellido 2",
                                        })}
                                    </div>

                                    {renderField({
                                        name: "email",
                                        label: "Correo electrónico",
                                        type: "email",
                                        icon: Mail,
                                        placeholder: "admin@audiocare.com",
                                        autoComplete: "email",
                                    })}

                                    {renderField({
                                        name: "password",
                                        label: "Contraseña",
                                        type: "password",
                                        icon: Lock,
                                        placeholder: "Mínimo 8 caracteres",
                                        autoComplete: "new-password",
                                    })}

                                    {/* isMaster toggle */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setRegisterData(prev => ({
                                                    ...prev,
                                                    isMaster: !prev.isMaster,
                                                }))
                                            }
                                            className={`
                                                relative w-10 h-[22px] rounded-full transition-colors duration-200
                                                ${registerData.isMaster ? "bg-[#34c3d6]" : "bg-slate-200"}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm
                                                    transition-all duration-200
                                                    ${registerData.isMaster ? "left-[22px]" : "left-[3px]"}
                                                `}
                                            />
                                        </button>
                                        <span className="text-sm text-slate-600">
                                            Admin Master
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {renderField({
                                        name: "email",
                                        label: "Correo electrónico",
                                        type: "email",
                                        icon: Mail,
                                        placeholder: "admin@audiocare.com",
                                        autoComplete: "email",
                                    })}

                                    {renderField({
                                        name: "password",
                                        label: "Contraseña",
                                        type: "password",
                                        icon: Lock,
                                        placeholder: "••••••••",
                                        autoComplete: "current-password",
                                    })}
                                </>
                            )}

                            {/* Submit */}
                            <div className="pt-2">
                                <LoadingButton
                                    type="submit"
                                    form="authForm"
                                    loading={loading}
                                    className="w-full"
                                >
                                    {isRegister ? "Registrar" : "Ingresar"}
                                </LoadingButton>
                            </div>
                        </form>

                        {/* Toggle login / register */}
                        {DEV_ENABLE_REGISTER && (
                            <div className="px-6 pb-6 lg:px-8">
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                                        border border-slate-200 text-sm text-slate-500
                                        hover:bg-slate-50 hover:text-slate-700
                                        transition-colors"
                                >
                                    {isRegister ? (
                                        <>
                                            <LogIn size={15} />
                                            Ya tengo cuenta — Iniciar sesión
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={15} />
                                            Registrar admin (dev)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        {isRegister
                            ? "El nuevo admin tendrá todos los permisos bloqueados hasta que el master los active"
                            : "Contacte al administrador master si necesita acceso al sistema"
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}