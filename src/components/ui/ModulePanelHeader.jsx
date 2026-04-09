const VARIANT_STYLES = {
    list: {
        bg: "bg-[#34c3d6]/10",
        icon: "text-[#34c3d6]",
    },
    form: {
        bg: "bg-[#ef7d2d]/10",
        icon: "text-[#ef7d2d]",
    },
};

export default function ModulePanelHeader({ title, subtitle, icon: Icon, variant = "list", actions = null }) {
    const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.list;

    return (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.bg}`}>
                    {Icon ? <Icon size={20} className={styles.icon} /> : null}
                </div>

                <div>
                    <h1 className='text-xl font-bold text-slate-800'>{title}</h1>
                    {subtitle ? <p className='text-sm text-slate-400'>{subtitle}</p> : null}
                </div>
            </div>

            {actions ? <div className='self-start sm:self-auto'>{actions}</div> : null}
        </div>
    );
}
