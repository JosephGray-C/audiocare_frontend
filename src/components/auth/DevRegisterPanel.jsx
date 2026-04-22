import { useState } from "react";
import { Mail, Lock, User, IdCard, ShieldPlus } from "lucide-react";
import { createAdmin } from "../../services/Adminservice";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import LoadingButton from "../ui/LoadingButton";
import FormField from "../form/FormField";

const REGISTER_INITIAL = {
  identityNumber: "",
  name: "",
  lastName1: "",
  lastName2: "",
  email: "",
  password: "",
  isMaster: true,
};

export default function DevRegisterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [registerData, setRegisterData] = useState(REGISTER_INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  function handleChange(e) {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
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

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateRegister();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      await createAdmin(registerData);
      showAlert("Admin registrado correctamente.", "success");
      setRegisterData(REGISTER_INITIAL);
      setErrors({});
      setIsOpen(false);
    } catch (error) {
      handleApiError(error, showAlert);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Herramientas de desarrollo
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Crear administrador manualmente para pruebas
          </p>
        </div>

        <span className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800">
          {isOpen ? "Ocultar" : "Abrir"}
        </span>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            name="identityNumber"
            label="Número de identidad"
            icon={IdCard}
            value={registerData.identityNumber}
            onChange={handleChange}
            error={errors.identityNumber}
            placeholder="Ej: 123456789"
          />

          <FormField
            name="name"
            label="Nombre"
            icon={User}
            value={registerData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Ingrese su nombre"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              name="lastName1"
              label="Primer apellido"
              value={registerData.lastName1}
              onChange={handleChange}
              error={errors.lastName1}
              placeholder="Apellido 1"
            />

            <FormField
              name="lastName2"
              label="Segundo apellido"
              value={registerData.lastName2}
              onChange={handleChange}
              error={errors.lastName2}
              placeholder="Apellido 2"
            />
          </div>

          <FormField
            name="email"
            label="Correo electrónico"
            type="email"
            icon={Mail}
            value={registerData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="admin@audiocare.com"
          />

          <FormField
            name="password"
            label="Contraseña"
            type="password"
            icon={Lock}
            value={registerData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Mínimo 8 caracteres"
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                setRegisterData((prev) => ({
                  ...prev,
                  isMaster: !prev.isMaster,
                }))
              }
              className={`relative h-[22px] w-10 rounded-full transition-colors duration-200 ${
                registerData.isMaster ? "bg-[#34c3d6]" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
                  registerData.isMaster ? "left-[22px]" : "left-[3px]"
                }`}
              />
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <ShieldPlus size={16} />
              <span>Admin Master</span>
            </div>
          </div>

          <LoadingButton type="submit" loading={loading} className="w-full">
            Registrar administrador
          </LoadingButton>
        </form>
      )}
    </div>
  );
}
