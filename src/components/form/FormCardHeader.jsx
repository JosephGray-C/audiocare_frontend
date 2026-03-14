export default function FormCardHeader({ title, icon: Icon }) {
    return (
        <div className='flex items-center gap-3 border-b border-slate-200 px-5 py-5 lg:px-6 lg:py-6'>
            <div className='flex items-center justify-center shrink-0'>{Icon && <Icon size={18} className='text-[#ef7d2d]' />}</div>

            <div className='min-w-0'>
                <h2 className='text-xl font-bold leading-tight text-slate-900 lg:text-2xl'>{title}</h2>
            </div>
        </div>
    );
}
