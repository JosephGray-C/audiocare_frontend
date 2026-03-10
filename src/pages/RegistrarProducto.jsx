import { Package, Barcode, Euro, DollarSign } from "lucide-react";
import { useState } from "react";
import { formatCRC, convertCRCToEuro, convertCRCToUSD } from "../utils/currency";
import { createModelProduct } from "../services/modelProductService";

export default function RegistrarProducto() {
    const [formData, setFormData] = useState({
        codigoModelo: "",
        nombre: "",
        precioFabricaCRC: "",
        precioFabricaEUR: "",
        precioVenta: "",
    });

    const formattedPrecioVenta = formatCRC(formData.precioVenta);

    const euros = formData.precioVenta ? convertCRCToEuro(formData.precioVenta) : "0.00";

    const usd = formData.precioVenta ? convertCRCToUSD(formData.precioVenta) : "0.00";

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    function handlePrecioVenta(e) {
        const raw = e.target.value.replace(/\D/g, "");

        setFormData(prev => ({
            ...prev,
            precioVenta: raw,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            await createModelProduct(formData);

            console.log("Modelo de producto agregado");

            setFormData({
                codigoModelo: "",
                nombre: "",
                precioFabricaCRC: "",
                precioFabricaEUR: "",
                precioVenta: "",
            });
        } catch (error) {
            console.error(error);
        }
    }
    
    return (
        <div className='flex justify-center items-start pt-16'>
            {/* CARD */}
            <div className='w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200'>
                {/* HEADER */}
                <div className='flex items-center gap-2 px-6 py-4 border-b border-slate-200'>
                    <Package size={18} className='text-purple-600' />
                    <h2 className='font-semibold text-slate-800'>Registrar Producto</h2>
                </div>

                {/* BODY */}
                <form onSubmit={handleSubmit} className='px-6 py-6 space-y-6'>
                    {/* Codigo Modelo */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Código Modelo</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <Barcode size={16} className='text-slate-500 mr-2' />
                            <input
                                name='codigoModelo'
                                value={formData.codigoModelo}
                                onChange={handleChange}
                                className='bg-transparent outline-none w-full text-sm'
                                placeholder='Ingrese los datos...'
                            />
                        </div>
                    </div>

                    <div className='border-t border-slate-200' />

                    {/* Nombre */}
                    <div className='flex items-center justify-between gap-6'>
                        <label className='text-sm text-slate-600 w-44'>Nombre</label>

                        <div className='flex items-center bg-slate-100 rounded-full px-4 py-2 w-full border border-slate-200'>
                            <Package size={16} className='text-slate-500 mr-2' />
                            <input
                                name='nombre'
                                value={formData.nombre}
                                onChange={handleChange}
                                className='bg-transparent outline-none w-full text-sm'
                                placeholder='Ingrese los datos...'
                            />
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
                            <input
                                name='precioVenta'
                                value={formattedPrecioVenta}
                                onChange={handlePrecioVenta}
                                className='bg-transparent outline-none w-full text-sm'
                                placeholder='Ingrese los datos...'
                            />
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
                </form>

                {/* FOOTER */}
                <div className='flex justify-end gap-3 px-6 py-4 border-t border-slate-200'>
                    <button className='px-5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-sm'>Cancelar</button>

                    <button type='submit' className='px-5 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm shadow-sm'>
                        Guardar Producto
                    </button>
                </div>
            </div>
        </div>
    );
}
