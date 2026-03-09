import { Package, Barcode, Euro, DollarSign } from "lucide-react";
import { useState } from "react";
import { formatCRC, convertCRCToEuro, convertCRCToUSD } from "../utils/currency";

export default function RegistrarProducto() {
    const [precioVenta, setPrecioVenta] = useState("");

    const formattedPrecioVenta = formatCRC(precioVenta);

    const euros = precioVenta ? convertCRCToEuro(precioVenta) : "0.00";

    const usd = precioVenta ? convertCRCToUSD(precioVenta) : "0.00";

    const handlePrecioVenta = e => {
        const raw = e.target.value.replace(/\D/g, "");
        setPrecioVenta(raw);
    };

    return (
        <div className='flex justify-center pt-20 pb-80 min-h-screen'>
            {/* CARD */}
            <div className='w-full max-w-3xl bg-white rounded-xl shadow-sm border border-slate-200'>
                {/* HEADER */}
                <div className='flex items-center gap-2 px-6 py-4 border-b border-slate-200'>
                    <Package size={18} className='text-purple-600' />
                    <h2 className='font-semibold text-slate-800'>Registrar Producto</h2>
                </div>

                {/* BODY */}
                <div className='px-6 py-6 space-y-6'>
                    {/* Codigo Modelo */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Código Modelo</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <Barcode size={16} className='text-slate-500 mr-2' />
                            <input className='bg-transparent outline-none w-full text-sm' placeholder='Ingrese los datos...' />
                        </div>
                    </div>

                    <div className='border-t border-slate-200' />

                    {/* Nombre */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Nombre</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <Package size={16} className='text-slate-500 mr-2' />
                            <input className='bg-transparent outline-none w-full text-sm' placeholder='Ingrese los datos...' />
                        </div>
                    </div>

                    <div className='border-t border-slate-200' />

                    {/* Precio Fabrica Colones */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Precio Fábrica Colones</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <span className='text-slate-500 mr-2'>₡</span>
                            <input className='bg-transparent outline-none w-full text-sm' placeholder='Ingrese los datos...' />
                        </div>
                    </div>

                    <div className='border-t border-slate-200' />

                    {/* Precio Fabrica Euros */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Precio Fábrica Euros</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <Euro size={16} className='text-slate-500 mr-2' />
                            <input className='bg-transparent outline-none w-full text-sm' placeholder='Ingrese los datos...' />
                        </div>
                    </div>

                    <div className='border-t border-slate-200' />

                    {/* Precio Venta */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Precio Venta</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <span className='text-slate-500 mr-2'>₡</span>
                            <input
                                value={formattedPrecioVenta}
                                onChange={handlePrecioVenta}
                                className='bg-transparent outline-none w-full text-sm'
                                placeholder='Ingrese los datos...'
                            />
                        </div>
                    </div>

                    {/* Conversion badges */}
                    <div className='flex gap-4 ml-40'>
                        <div className='px-4 py-1 rounded-full border border-slate-300 bg-slate-100 text-sm flex items-center gap-2'>
                            <Euro size={14} />
                            {euros}
                        </div>

                        <div className='px-4 py-1 rounded-full border border-slate-300 bg-slate-100 text-sm flex items-center gap-2'>
                            <DollarSign size={14} />
                            {usd}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className='flex justify-end gap-3 px-6 py-4 border-t border-slate-200'>
                    <button className='px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-sm'>Cancelar</button>

                    <button className='px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm shadow-sm'>
                        Guardar Producto
                    </button>
                </div>
            </div>
        </div>
    );
}
