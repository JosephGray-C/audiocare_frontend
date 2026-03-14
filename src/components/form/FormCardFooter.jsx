import LoadingButton from "../ui/LoadingButton";

export default function FormCardFooter({ onCancel, submitFormId, loading = false, cancelText = "Cancelar", submitText = "Guardar" }) {
    return (
        <div className='flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-5 lg:px-6 lg:py-5'>
            <button
                type='button'
                onClick={onCancel}
                className='rounded-xl border border-slate-300 bg-white px-7 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100'
            >
                {cancelText}
            </button>

            <LoadingButton
                type='submit'
                form={submitFormId}
                loading={loading}
                className='rounded-xl bg-[#34c3d6] px-7 py-2.5 text-white hover:bg-[#28b4c8]'
            >
                {submitText}
            </LoadingButton>
        </div>
    );
}
