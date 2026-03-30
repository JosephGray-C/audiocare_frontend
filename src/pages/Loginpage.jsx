import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Headphones } from "lucide-react";
import { login } from "../services/Authservice";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import LoadingButton from "../components/ui/LoadingButton";
import RenderField from "../components/form/RenderField";
import DevRegisterPanel from "../components/auth/DevRegisterPanel";

const DEV_ENABLE_REGISTER = true;

const LOGIN_INITIAL = {
    email: "",
    password: "",
};

export default function LoginPage() {
    const [loginData, setLoginData] = useState(LOGIN_INITIAL);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { saveLogin } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

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

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            const response = await login(loginData);
            saveLogin(response);
            showAlert(`Bienvenido, ${response.name}`, "success");
            navigate("/", { replace: true });
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full max-w-md'>
            <div className='mb-8 flex flex-col items-center text-center'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#34c3d6]/15'>
                    <Headphones size={28} className='text-[#34c3d6]' />
                </div>

                <h1 className='text-2xl font-bold text-slate-900'>Iniciar sesión</h1>

                <p className='mt-2 text-sm text-slate-500'>Ingrese sus credenciales para acceder al sistema</p>
            </div>

            <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
                <form id='loginForm' onSubmit={handleSubmit} className='space-y-5 p-6 sm:p-7'>
                    <RenderField
                        name='email'
                        label='Correo electrónico'
                        type='email'
                        icon={Mail}
                        value={loginData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder='admin@audiocare.com'
                        autoComplete='email'
                    />

                    <RenderField
                        name='password'
                        label='Contraseña'
                        type='password'
                        icon={Lock}
                        value={loginData.password}
                        onChange={handleChange}
                        error={errors.password}
                        placeholder='••••••••'
                        autoComplete='current-password'
                    />

                    <div className='pt-1'>
                        <LoadingButton type='submit' form='loginForm' loading={loading} className='w-full'>
                            Ingresar
                        </LoadingButton>
                    </div>
                </form>
            </div>

            <p className='mt-5 text-center text-xs text-slate-400'>Contacte al administrador master si necesita acceso al sistema</p>

            {DEV_ENABLE_REGISTER && (
                <div className='mt-6'>
                    <DevRegisterPanel />
                </div>
            )}
        </div>
    );
}
