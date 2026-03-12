export default function FormField({ label, icon: Icon, prefix, name, value, onChange, placeholder, type = "text", error, disabled }) {
    return (
        <>
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr] lg:items-center lg:gap-6'>
                <label className='text-sm font-medium text-slate-700 leading-6'>{label}</label>

                <div
                    className={`flex items-center w-full min-w-0 rounded-full border px-4 py-2 transition-colors
                        ${
                            error
                                ? "border-red-400 bg-red-50"
                                : disabled
                                  ? "border-slate-200 bg-slate-100/80"
                                  : "border-slate-200 bg-slate-100"
                        }
                    `}
                >
                    {Icon && <Icon size={16} className='mr-2 shrink-0 text-slate-500' />}

                    {prefix && <span className='mr-2 shrink-0 text-slate-500'>{prefix}</span>}

                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className={`w-full min-w-0 bg-transparent text-sm outline-none
                            ${
                                error
                                    ? "text-red-500 placeholder:text-red-500"
                                    : disabled
                                      ? "text-slate-800"
                                      : "text-slate-700 placeholder:text-slate-400"
                            }
                        `}
                        placeholder={error ? error : placeholder}
                    />
                </div>
            </div>

            <div className='border-t border-slate-200' />
        </>
    );
}
