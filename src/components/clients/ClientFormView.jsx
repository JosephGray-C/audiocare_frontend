import { useState, useEffect, useMemo } from "react";
import { Users, IdCard, Mail, Phone, User } from "lucide-react";
import { createClient, updateClient } from "../../services/Clientservice";
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
  type: "PRIVATE",
  email: "",
  phone: "",
};

function getInitialForm(client) {
  if (!client) return EMPTY_FORM;

  return {
    identityNumber: client.identityNumber || "",
    name: client.name || "",
    lastName1: client.lastName1 || "",
    lastName2: client.lastName2 || "",
    type: client.type || "PRIVATE",
    email: client.email || "",
    phone: client.phone || "",
  };
}

export default function ClientFormView({ client = null, onSaved }) {
  const [formData, setFormData] = useState(getInitialForm(client));
  const [originalData, setOriginalData] = useState(getInitialForm(client));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const isEdit = !!client;

  useEffect(() => {
    const initial = getInitialForm(client);
    setFormData(initial);
    setOriginalData(initial);
    setErrors({});
  }, [client]);

  const hasChanges = useMemo(() => {
    return !isEdit || JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleTypeChange(type) {
    setFormData((prev) => ({
      ...prev,
      type,
      ...(type === "DISTRIBUTOR" ? { lastName1: "", lastName2: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, type: null }));
  }

  function handleReset() {
    const initial = getInitialForm(client);
    setFormData(initial);
    setErrors({});
    closeAlert();
  }

  function validate() {
    const newErrors = {};

    if (!formData.identityNumber.trim()) {
      newErrors.identityNumber = "El número de identidad es obligatorio";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Formato de correo inválido";
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
      identityNumber: formData.identityNumber.trim(),
      name: formData.name.trim(),
      lastName1:
        formData.type === "PRIVATE" ? formData.lastName1.trim() || null : null,
      lastName2:
        formData.type === "PRIVATE" ? formData.lastName2.trim() || null : null,
      type: formData.type,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await updateClient(client.id, payload);
        showAlert("Cliente actualizado correctamente", "success");
      } else {
        await createClient(payload);
        showAlert("Cliente registrado correctamente", "success");
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
    <div className="w-full">
      <div className="max-w-4xl mx-auto space-y-5">
        <ModulePanelHeader
          title={isEdit ? "Editar Cliente" : "Registrar Cliente"}
          subtitle={
            isEdit
              ? "Actualice la información del cliente seleccionado"
              : "Complete los datos para registrar un nuevo cliente"
          }
          icon={Users}
          variant="form"
        />

        <form id="clientForm" onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Datos del cliente
            </h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-600">
                Tipo de cliente
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("PRIVATE")}
                  className={`
                                        flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                                        ${
                                          formData.type === "PRIVATE"
                                            ? "bg-[#34c3d6]/10 border-[#34c3d6] text-[#34c3d6]"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                                        }
                                    `}
                >
                  Privado
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("DISTRIBUTOR")}
                  className={`
                                        flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors
                                        ${
                                          formData.type === "DISTRIBUTOR"
                                            ? "bg-[#ef7d2d]/10 border-[#ef7d2d] text-[#ef7d2d]"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                                        }
                                    `}
                >
                  Distribuidor
                </button>
              </div>
            </div>

            <FormField
              name="identityNumber"
              label={
                formData.type === "PRIVATE"
                  ? "Cédula física"
                  : "Cédula jurídica"
              }
              icon={IdCard}
              value={formData.identityNumber}
              onChange={handleChange}
              error={errors.identityNumber}
              placeholder={
                formData.type === "PRIVATE" ? "Ej: 123456789" : "Ej: 3101234567"
              }
            />

            <FormField
              name="name"
              label={formData.type === "PRIVATE" ? "Nombre" : "Razón social"}
              icon={User}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder={
                formData.type === "PRIVATE"
                  ? "Nombre del cliente"
                  : "Nombre de la empresa"
              }
            />

            {formData.type === "PRIVATE" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  name="lastName1"
                  label="Primer apellido"
                  value={formData.lastName1}
                  onChange={handleChange}
                  error={errors.lastName1}
                  placeholder="Apellido 1"
                />

                <FormField
                  name="lastName2"
                  label="Segundo apellido"
                  value={formData.lastName2}
                  onChange={handleChange}
                  error={errors.lastName2}
                  placeholder="Apellido 2"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Contacto (opcional)
            </h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FormField
                name="email"
                label="Correo electrónico"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="correo@ejemplo.com"
              />

              <FormField
                name="phone"
                label="Teléfono"
                icon={Phone}
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="Ej: 8888-0000"
              />
            </div>
          </div>
        </form>

        <ModuleFormActions
          onReset={handleReset}
          resetText="Limpiar"
          submitText={isEdit ? "Actualizar Cliente" : "Guardar Cliente"}
          submitFormId="clientForm"
          loading={loading}
          submitType="submit"
        />
      </div>
    </div>
  );
}
