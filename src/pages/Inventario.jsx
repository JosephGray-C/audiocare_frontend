import { useState, useEffect, useCallback, useMemo } from "react";
import { Boxes, Search, Filter, ChevronDown, ChevronRight, Loader2, Package } from "lucide-react";
import { getAllProducts } from "../services/productService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";

const STATUS_STYLES = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BILLED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Inventario() {
    const [products, setProducts] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Expanded rows
    const [expandedModels, setExpandedModels] = useState(new Set());

    const { showAlert } = useAlert();

    // ── Fetch ────────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        try {
            setLoadingData(true);
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoadingData(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derive available years from data ─────────────────────────────────

    const years = useMemo(() => {
        const yearSet = new Set();
        products.forEach(p => {
            if (p.entryDate) yearSet.add(p.entryDate.substring(0, 4));
        });
        return Array.from(yearSet).sort().reverse();
    }, [products]);

    // ── Filter products ──────────────────────────────────────────────────

    const filteredProducts = useMemo(() => {
        let result = products;

        if (yearFilter !== "ALL") {
            result = result.filter(p => p.entryDate && p.entryDate.startsWith(yearFilter));
        }

        if (statusFilter !== "ALL") {
            result = result.filter(p => p.status === statusFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                (p.model?.name && p.model.name.toLowerCase().includes(q)) ||
                (p.serialNum && p.serialNum.toLowerCase().includes(q)) ||
                (p.model?.modelCode && String(p.model.modelCode).includes(q))
            );
        }

        return result;
    }, [products, yearFilter, statusFilter, search]);

    // ── Group by model ───────────────────────────────────────────────────

    const groupedModels = useMemo(() => {
        const map = new Map();

        filteredProducts.forEach(product => {
            const modelId = product.model?.id;
            if (!modelId) return;

            if (!map.has(modelId)) {
                map.set(modelId, {
                    id: modelId,
                    name: product.model.name,
                    modelCode: product.model.modelCode,
                    priceSale: product.model.priceSale,
                    costFabricCrc: product.model.costFabricCrc,
                    costFabricEur: product.model.costFabricEur,
                    status: product.model.status,
                    products: [],
                    availableCount: 0,
                    billedCount: 0,
                    totalCount: 0,
                    oldestEntry: null,
                });
            }

            const group = map.get(modelId);
            group.products.push(product);
            group.totalCount++;

            if (product.status === "AVAILABLE") group.availableCount++;
            if (product.status === "BILLED") group.billedCount++;

            if (!group.oldestEntry || product.entryDate < group.oldestEntry) {
                group.oldestEntry = product.entryDate;
            }
        });

        // Sort by model name
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredProducts]);

    // ── Totals ───────────────────────────────────────────────────────────

    const totalAvailable = groupedModels.reduce((sum, g) => sum + g.availableCount, 0);
    const totalBilled = groupedModels.reduce((sum, g) => sum + g.billedCount, 0);
    const totalProducts = groupedModels.reduce((sum, g) => sum + g.totalCount, 0);
    const modelsInStock = groupedModels.filter(g => g.availableCount > 0).length;

    // ── Toggle expand ────────────────────────────────────────────────────

    function toggleExpand(modelId) {
        setExpandedModels(prev => {
            const next = new Set(prev);
            if (next.has(modelId)) {
                next.delete(modelId);
            } else {
                next.add(modelId);
            }
            return next;
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function fmtDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR");
    }

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#34c3d6]/10 flex items-center justify-center">
                    <Boxes size={20} className="text-[#34c3d6]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Inventario de Stock</h1>
                    <p className="text-sm text-slate-400">
                        Supervise y gestione el stock físico disponible
                    </p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SummaryCard label="Modelos en stock" value={modelsInStock} color="#34c3d6" />
                <SummaryCard label="Unidades disponibles" value={totalAvailable} color="#22c55e" />
                <SummaryCard label="Unidades facturadas" value={totalBilled} color="#3b82f6" />
                <SummaryCard label="Total unidades" value={totalProducts} color="#64748b" />
            </div>

            {/* Year tabs + filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                {/* Year tabs */}
                <div className="flex items-center gap-1 px-5 pt-4 pb-2 overflow-x-auto">
                    <button
                        onClick={() => setYearFilter("ALL")}
                        className={`
                            px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                            ${yearFilter === "ALL"
                            ? "bg-[#34c3d6]/10 text-[#34c3d6]"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        }
                        `}
                    >
                        Todos
                    </button>
                    {years.map(year => (
                        <button
                            key={year}
                            onClick={() => setYearFilter(year)}
                            className={`
                                px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                                ${yearFilter === year
                                ? "bg-[#34c3d6]/10 text-[#34c3d6]"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            }
                            `}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                {/* Search + status filter */}
                <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center border-t border-slate-100">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por modelo, código o serie..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#34c3d6] transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#34c3d6] appearance-none cursor-pointer transition-colors"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="AVAILABLE">Disponibles</option>
                            <option value="BILLED">Facturados</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-t border-slate-100">
                            <th className="w-10 px-3 py-3" />
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Modelo</th>
                            <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Código</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Disponibles</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Facturados</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Primera Entrada</th>
                            <th className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Precio Venta</th>
                            <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Estado Modelo</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loadingData ? (
                            <tr>
                                <td colSpan={9} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-sm">Cargando inventario...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : groupedModels.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Boxes size={32} strokeWidth={1.5} />
                                        <span className="text-sm">
                                                {search || yearFilter !== "ALL" || statusFilter !== "ALL"
                                                    ? "No se encontraron resultados"
                                                    : "No hay productos en inventario"
                                                }
                                            </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            groupedModels.map(group => {
                                const isExpanded = expandedModels.has(group.id);

                                return (
                                    <ModelRow
                                        key={group.id}
                                        group={group}
                                        isExpanded={isExpanded}
                                        onToggle={() => toggleExpand(group.id)}
                                        fmtDate={fmtDate}
                                        fmtCRC={fmtCRC}
                                    />
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer count */}
                {!loadingData && groupedModels.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                        Mostrando {groupedModels.length} modelo{groupedModels.length !== 1 ? "s" : ""} con {totalProducts} unidad{totalProducts !== 1 ? "es" : ""} en inventario
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Summary card ─────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5">
            <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                {value}
            </p>
        </div>
    );
}

// ── Model row (expandable) ───────────────────────────────────────────────

function ModelRow({ group, isExpanded, onToggle, fmtDate, fmtCRC }) {
    const modelStatusStyle = group.availableCount > 0
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-slate-50 text-slate-500 border-slate-200";

    const modelStatusLabel = group.availableCount > 0 ? "Disponible" : "Sin Stock";

    return (
        <>
            {/* Main row */}
            <tr
                onClick={onToggle}
                className="hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
                <td className="px-3 py-3.5 text-center">
                    {isExpanded
                        ? <ChevronDown size={16} className="text-slate-400 mx-auto" />
                        : <ChevronRight size={16} className="text-slate-400 mx-auto" />
                    }
                </td>
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#ef7d2d]/10 flex items-center justify-center shrink-0">
                            <Package size={14} className="text-[#ef7d2d]" />
                        </div>
                        <span className="font-medium text-slate-800">{group.name}</span>
                    </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {group.modelCode}
                    </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                    <span className="font-semibold text-emerald-600 tabular-nums">{group.availableCount}</span>
                </td>
                <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                    <span className="text-slate-500 tabular-nums">{group.billedCount}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                    <span className="font-semibold text-slate-700 tabular-nums">{group.totalCount}</span>
                </td>
                <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                    <span className="text-slate-500 text-sm">{fmtDate(group.oldestEntry)}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold text-slate-800 tabular-nums">{fmtCRC(group.priceSale)}</span>
                </td>
                <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${modelStatusStyle}`}>
                        {modelStatusLabel}
                    </span>
                </td>
            </tr>

            {/* Expanded: individual products */}
            {isExpanded && (
                <tr>
                    <td colSpan={9} className="px-0 py-0">
                        <div className="bg-slate-50/80 border-y border-slate-100">
                            <table className="w-full text-sm">
                                <thead>
                                <tr>
                                    <th className="pl-16 pr-5 py-2.5 text-left font-medium text-slate-400 text-xs">Serie</th>
                                    <th className="px-5 py-2.5 text-left font-medium text-slate-400 text-xs hidden md:table-cell">Pedido Proveedor</th>
                                    <th className="px-5 py-2.5 text-center font-medium text-slate-400 text-xs">Fecha Ingreso</th>
                                    <th className="px-5 py-2.5 text-center font-medium text-slate-400 text-xs hidden sm:table-cell">Fecha Venta</th>
                                    <th className="px-5 py-2.5 text-center font-medium text-slate-400 text-xs">Estado</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80">
                                {group.products
                                    .sort((a, b) => (a.entryDate || "").localeCompare(b.entryDate || ""))
                                    .map(product => (
                                        <tr key={product.id} className="hover:bg-white/60 transition-colors">
                                            <td className="pl-16 pr-5 py-2.5">
                                                    <span className="font-mono text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        {product.serialNum}
                                                    </span>
                                            </td>
                                            <td className="px-5 py-2.5 hidden md:table-cell">
                                                    <span className="text-xs text-slate-500 truncate block max-w-[180px]">
                                                        {product.supplierOrder?.name || "—"}
                                                    </span>
                                            </td>
                                            <td className="px-5 py-2.5 text-center">
                                                <span className="text-xs text-slate-500">{fmtDate(product.entryDate)}</span>
                                            </td>
                                            <td className="px-5 py-2.5 text-center hidden sm:table-cell">
                                                <span className="text-xs text-slate-400">{product.saleDate ? fmtDate(product.saleDate) : "—"}</span>
                                            </td>
                                            <td className="px-5 py-2.5 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[product.status]}`}>
                                                        {product.status === "AVAILABLE" ? "Disponible" : "Facturado"}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))
                                }
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}