import { useState, useEffect, useCallback, useMemo } from "react";
import {
    LayoutDashboard, TrendingUp, TrendingDown, Package, ShoppingCart,
    Truck, Users, Boxes, DollarSign, AlertTriangle, ArrowRight,
    Loader2, Euro
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../services/productService";
import { getOrders } from "../services/orderClientService";
import { getModelProducts } from "../services/modelProductService";
import { getSupplierOrders } from "../services/supplierOrderService";
import { getClients } from "../services/clientService";
import { getMovements } from "../services/inventoryMovementService";
import { useAlert } from "../context/AlertContext";
import { handleApiError } from "../utils/apiErrorHandler";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [products, orders, models, supplierOrders, clients, movements] = await Promise.all([
                getAllProducts(),
                getOrders(),
                getModelProducts(),
                getSupplierOrders(),
                getClients(),
                getMovements(),
            ]);
            setData({ products, orders, models, supplierOrders, clients, movements });
        } catch (error) {
            handleApiError(error, showAlert);
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Computed metrics ──────────────────────────────────────────────────

    const metrics = useMemo(() => {
        if (!data) return null;
        const { products, orders, models, supplierOrders, clients, movements } = data;

        // Products
        const available = products.filter(p => p.status === "AVAILABLE");
        const billed = products.filter(p => p.status === "BILLED");

        // Orders
        const completed = orders.filter(o => o.status === "COMPLETED");
        const pending = orders.filter(o => o.status === "PENDING");
        const confirmed = orders.filter(o => o.status === "CONFIRMED");
        const canceled = orders.filter(o => o.status === "CANCELED");

        // Revenue
        const totalRevenue = completed.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

        // Cost of goods sold (from billed products' model cost)
        const totalCost = billed.reduce((s, p) => s + Number(p.model?.costFabricCrc || 0), 0);
        const grossProfit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // Inventory value (available products at sale price)
        const inventoryValue = available.reduce((s, p) => s + Number(p.model?.priceSale || 0), 0);
        const inventoryCost = available.reduce((s, p) => s + Number(p.model?.costFabricCrc || 0), 0);

        // Models with stock vs without
        const modelsInStock = models.filter(m => m.status === "AVAILABLE").length;
        const modelsNoStock = models.filter(m => m.status === "NO_STOCK").length;

        // Low stock models (1-2 available)
        const modelStockMap = {};
        available.forEach(p => {
            const mid = p.model?.id;
            if (mid) modelStockMap[mid] = (modelStockMap[mid] || 0) + 1;
        });
        const lowStockModels = models
            .filter(m => modelStockMap[m.id] && modelStockMap[m.id] <= 2)
            .map(m => ({ ...m, stockCount: modelStockMap[m.id] }));

        // Top selling models
        const modelSalesMap = {};
        billed.forEach(p => {
            const mid = p.model?.id;
            const name = p.model?.name || "—";
            if (mid) {
                if (!modelSalesMap[mid]) modelSalesMap[mid] = { name, count: 0, revenue: 0 };
                modelSalesMap[mid].count++;
                modelSalesMap[mid].revenue += Number(p.model?.priceSale || 0);
            }
        });
        const topModels = Object.values(modelSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

        // Sales by month (last 6 months)
        const monthlyData = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyData[key] = { month: key, sales: 0, revenue: 0, products: 0 };
        }
        completed.forEach(o => {
            const key = o.saleDate?.substring(0, 7);
            if (key && monthlyData[key]) {
                monthlyData[key].sales++;
                monthlyData[key].revenue += Number(o.totalAmount || 0);
            }
        });
        billed.forEach(p => {
            const key = p.saleDate?.substring(0, 7);
            if (key && monthlyData[key]) {
                monthlyData[key].products++;
            }
        });
        const monthlySales = Object.values(monthlyData);

        // Recent movements (last 10)
        const recentMovements = movements.slice(0, 10);

        // Supplier investment
        const totalSupplierInvestment = supplierOrders.reduce((s, o) => s + Number(o.totalAmountCrc || 0), 0);
        const totalSupplierInvestmentEur = supplierOrders.reduce((s, o) => s + Number(o.totalAmountEur || 0), 0);

        return {
            available, billed, products,
            completed, pending, confirmed, canceled, orders,
            totalRevenue, totalCost, grossProfit, margin,
            inventoryValue, inventoryCost,
            modelsInStock, modelsNoStock, models,
            lowStockModels, topModels, monthlySales,
            recentMovements, clients, supplierOrders,
            totalSupplierInvestment, totalSupplierInvestmentEur,
        };
    }, [data]);

    // ── Helpers ───────────────────────────────────────────────────────────

    function fmtCRC(value) {
        return "₡ " + Number(value || 0).toLocaleString("es-CR");
    }

    function fmtShort(value) {
        if (value >= 1000000) return "₡" + (value / 1000000).toFixed(1) + "M";
        if (value >= 1000) return "₡" + (value / 1000).toFixed(0) + "K";
        return "₡" + value;
    }

    function fmtMonthLabel(key) {
        const [y, m] = key.split("-");
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
    }

    function fmtDateTime(dateStr) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" }) + " " +
            d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
    }

    const eventLabels = {
        PRODUCT_ADDED: "Producto ingresado",
        PRODUCT_SOLD: "Producto vendido",
        PRODUCT_SALE_CANCELED: "Venta cancelada",
        SUPPLIER_ORDER_CREATED: "Pedido registrado",
    };

    const eventColors = {
        PRODUCT_ADDED: "text-emerald-600 bg-emerald-50",
        PRODUCT_SOLD: "text-blue-600 bg-blue-50",
        PRODUCT_SALE_CANCELED: "text-amber-600 bg-amber-50",
        SUPPLIER_ORDER_CREATED: "text-purple-600 bg-purple-50",
    };

    // ── Loading ───────────────────────────────────────────────────────────

    if (loading || !metrics) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    // ── Max values for charts ─────────────────────────────────────────────

    const maxRevenue = Math.max(...metrics.monthlySales.map(m => m.revenue), 1);
    const maxProducts = Math.max(...metrics.monthlySales.map(m => m.products), 1);

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-xl font-bold text-slate-800">
                    Bienvenido, {auth?.name || "Admin"}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    Resumen general del sistema AudioCare
                </p>
            </div>

            {/* ── KPI Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard
                    label="Ingresos completados"
                    value={fmtCRC(metrics.totalRevenue)}
                    icon={DollarSign}
                    color="#22c55e"
                    sub={`${metrics.completed.length} venta${metrics.completed.length !== 1 ? "s" : ""}`}
                />
                <KpiCard
                    label="Stock disponible"
                    value={metrics.available.length}
                    icon={Boxes}
                    color="#34c3d6"
                    sub={`${metrics.modelsInStock} modelo${metrics.modelsInStock !== 1 ? "s" : ""} en stock`}
                />
                <KpiCard
                    label="Valor del inventario"
                    value={fmtCRC(metrics.inventoryValue)}
                    icon={Package}
                    color="#f0a45a"
                    sub={`Costo: ${fmtCRC(metrics.inventoryCost)}`}
                />
                <KpiCard
                    label="Clientes activos"
                    value={metrics.clients.length}
                    icon={Users}
                    color="#8b5cf6"
                    sub={`${metrics.clients.filter(c => c.type === "DISTRIBUTOR").length} distribuidores`}
                />
            </div>

            {/* ── Second row: Financial + Orders pipeline ─────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Financial summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Resumen financiero</h2>
                    <div className="space-y-3">
                        <FinancialRow label="Ingresos totales" value={fmtCRC(metrics.totalRevenue)} color="text-emerald-600" />
                        <FinancialRow label="Costo de mercancía vendida" value={fmtCRC(metrics.totalCost)} color="text-slate-600" />
                        <div className="border-t border-slate-100 pt-3">
                            <FinancialRow
                                label="Utilidad bruta"
                                value={fmtCRC(metrics.grossProfit)}
                                color={metrics.grossProfit >= 0 ? "text-emerald-600" : "text-red-500"}
                                bold
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {metrics.margin >= 0
                                ? <TrendingUp size={14} className="text-emerald-500" />
                                : <TrendingDown size={14} className="text-red-500" />
                            }
                            <span className="text-sm text-slate-500">
                                Margen: <span className={`font-semibold ${metrics.margin >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    {metrics.margin.toFixed(1)}%
                                </span>
                            </span>
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-3 flex items-center gap-2">
                            <Euro size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-400">
                                Inversión en proveedor: {fmtCRC(metrics.totalSupplierInvestment)} ({metrics.supplierOrders.length} pedido{metrics.supplierOrders.length !== 1 ? "s" : ""})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Orders pipeline */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Pipeline de ventas</h2>
                    <div className="space-y-3">
                        <PipelineRow label="Pendientes" count={metrics.pending.length} total={metrics.orders.length} color="bg-amber-400" />
                        <PipelineRow label="Confirmadas" count={metrics.confirmed.length} total={metrics.orders.length} color="bg-blue-400" />
                        <PipelineRow label="Completadas" count={metrics.completed.length} total={metrics.orders.length} color="bg-emerald-400" />
                        <PipelineRow label="Canceladas" count={metrics.canceled.length} total={metrics.orders.length} color="bg-red-400" />
                    </div>
                    <button
                        onClick={() => navigate("/ventas")}
                        className="flex items-center gap-1.5 mt-4 text-sm text-[#34c3d6] font-medium hover:text-[#28b4c8] transition-colors"
                    >
                        Ver todas las ventas <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* ── Monthly charts ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Revenue chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Ingresos mensuales</h2>
                    <div className="flex items-end gap-2 h-40">
                        {metrics.monthlySales.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                                    {m.revenue > 0 ? fmtShort(m.revenue) : ""}
                                </span>
                                <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                                    <div
                                        className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#34c3d6] to-[#34c3d6]/60 transition-all duration-500"
                                        style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 8 : 2)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400">{fmtMonthLabel(m.month)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Products sold chart */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Productos vendidos por mes</h2>
                    <div className="flex items-end gap-2 h-40">
                        {metrics.monthlySales.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                                    {m.products > 0 ? m.products : ""}
                                </span>
                                <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                                    <div
                                        className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#ef7d2d] to-[#f0a45a]/60 transition-all duration-500"
                                        style={{ height: `${Math.max((m.products / maxProducts) * 100, m.products > 0 ? 8 : 2)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400">{fmtMonthLabel(m.month)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Third row: Top models + Low stock + Activity ─────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Top selling models */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Modelos más vendidos</h2>
                    {metrics.topModels.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Sin ventas registradas</p>
                    ) : (
                        <div className="space-y-3">
                            {metrics.topModels.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${i === 0 ? "bg-[#f0a45a]/20 text-[#ef7d2d]" : "bg-slate-100 text-slate-500"}
                                    `}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                                        <p className="text-xs text-slate-400">{m.count} vendido{m.count !== 1 ? "s" : ""}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 tabular-nums">
                                        {fmtCRC(m.revenue)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => navigate("/modelos")}
                        className="flex items-center gap-1.5 mt-4 text-sm text-[#34c3d6] font-medium hover:text-[#28b4c8] transition-colors"
                    >
                        Ver modelos <ArrowRight size={14} />
                    </button>
                </div>

                {/* Low stock alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Stock bajo</h2>
                    </div>
                    {metrics.lowStockModels.length === 0 && metrics.modelsNoStock === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Todo el inventario está abastecido</p>
                    ) : (
                        <div className="space-y-2">
                            {/* No stock models */}
                            {metrics.modelsNoStock > 0 && (
                                <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                                    <p className="text-xs font-medium text-red-600">
                                        {metrics.modelsNoStock} modelo{metrics.modelsNoStock !== 1 ? "s" : ""} sin stock
                                    </p>
                                </div>
                            )}
                            {/* Low stock models */}
                            {metrics.lowStockModels.map(m => (
                                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
                                    <span className="text-xs font-medium text-amber-800 truncate">{m.name}</span>
                                    <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">
                                        {m.stockCount} ud{m.stockCount !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => navigate("/inventario")}
                        className="flex items-center gap-1.5 mt-4 text-sm text-[#34c3d6] font-medium hover:text-[#28b4c8] transition-colors"
                    >
                        Ver inventario <ArrowRight size={14} />
                    </button>
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Actividad reciente</h2>
                    {metrics.recentMovements.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Sin movimientos</p>
                    ) : (
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                            {metrics.recentMovements.map(mov => (
                                <div key={mov.id} className="flex items-start gap-2.5 py-1.5">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                        mov.eventType === "PRODUCT_ADDED" ? "bg-emerald-400" :
                                            mov.eventType === "PRODUCT_SOLD" ? "bg-blue-400" :
                                                mov.eventType === "PRODUCT_SALE_CANCELED" ? "bg-amber-400" :
                                                    "bg-purple-400"
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-600">
                                            {eventLabels[mov.eventType] || mov.eventType}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {mov.description || "—"}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                        {fmtDateTime(mov.createdAt)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quick actions ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Acciones rápidas</h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <QuickAction label="Nueva Venta" icon={ShoppingCart} onClick={() => navigate("/registrar-venta")} color="#34c3d6" />
                    <QuickAction label="Agregar Producto" icon={Package} onClick={() => navigate("/productos")} color="#ef7d2d" />
                    <QuickAction label="Nuevo Cliente" icon={Users} onClick={() => navigate("/clientes")} color="#8b5cf6" />
                    <QuickAction label="Ver Pedidos" icon={Truck} onClick={() => navigate("/pedidos-proveedor")} color="#64748b" />
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color, sub }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums leading-none">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1.5">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function FinancialRow({ label, value, color, bold }) {
    return (
        <div className="flex justify-between items-center">
            <span className={`text-sm ${bold ? "font-semibold text-slate-700" : "text-slate-500"}`}>{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
        </div>
    );
}

function PipelineRow({ label, count, total, color }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums">{count}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function QuickAction({ label, icon: Icon, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2.5 py-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: `${color}10` }}
            >
                <Icon size={18} style={{ color }} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
        </button>
    );
}