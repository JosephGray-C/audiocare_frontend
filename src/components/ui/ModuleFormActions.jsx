import React from "react";
import LoadingButton from "./LoadingButton";

export default function ModuleFormActions({
    onReset,
    resetText = "Limpiar",
    submitText = "Guardar",
    submitFormId,
    loading = false,
    submitType = "submit",
    onSubmitClick,
    disabled = false,
}) {
    return (
        <div className='flex justify-end gap-3'>
            <button
                type='button'
                onClick={onReset}
                disabled={loading}
                className='rounded-xl border border-slate-300 bg-white px-7 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50'
            >
                {resetText}
            </button>

            <LoadingButton
                type={submitType}
                form={submitFormId}
                loading={loading}
                disabled={disabled}
                onClick={submitType === "button" ? onSubmitClick : undefined}
            >
                {submitText}
            </LoadingButton>
        </div>
    );
}