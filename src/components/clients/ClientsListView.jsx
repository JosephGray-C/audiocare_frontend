import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { getClients, deleteClient } from "../../services/ClientService";
import { useAlert } from "../../context/AlertContext";
import { handleApiError } from "../../utils/apiErrorHandler";
import usePermissions from "../../hooks/usePermissions";
import useListPagination from "../../hooks/useListPagination";
import ModulePanelHeader from "../ui/ModulePanelHeader";
import AppToolTip from "../ui/AppToolTip";
import ListPagination from "../ui/ListPagination";
import TruncatedCell from "../ui/TruncatedCell";
import SearchableSelect from "../ui/SearchableSelect";

const TYPE_LABELS = {
  PRIVATE: "Privado",
  DISTRIBUTOR: "Distribuidor",
};

const TYPE_STYLES = {
  PRIVATE: "bg-[#34c3d6]/10 text-[#34c3d6] border-[#34c3d6]/20",
  DISTRIBUTOR: "bg-[#ef7d2d]/10 text-[#ef7d2d] border-[#ef7d2d]/20",
};

const CLIENT_TYPE_OPTIONS = [
  { value: "PRIVATE", label: "Privado" },
  { value: "DISTRIBUTOR", label: "Distribuidor" },
];

export default function ClientsListView({
  refreshKey = 0,
  onStartCreate,
  onStartEdit,
}) {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { showAlert, showConfirm } = useAlert();
  const alertRef = useRef(showAlert);
  const { canWrite } = usePermissions();
  const hasWriteAccess = canWrite("clients");

  useEffect(() => {
    alertRef.current = showAlert;
  }, [showAlert]);

  const fetchClients = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      handleApiError(error, alertRef.current);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients, refreshKey]);

  useEffect(() => {
    let result = clients;

    if (typeFilter !== "ALL") {
      result = result.filter((client) => client.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(q) ||
          (client.lastName1 && client.lastName1.toLowerCase().includes(q)) ||
          (client.lastName2 && client.lastName2.toLowerCase().includes(q)) ||
          client.identityNumber.toLowerCase().includes(q) ||
          (client.email && client.email.toLowerCase().includes(q)),
      );
    }

    setFiltered(result);
  }, [clients, search, typeFilter]);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedClients,
    totalPages,
    visibleStart,
    visibleEnd,
  } = useListPagination(filtered);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, refreshKey, setCurrentPage]);

  function handleOpenDelete(client) {
    showConfirm({
      title: "Eliminar cliente",
      message: `¿Está seguro de eliminar al cliente "${client.name}"? Si tiene órdenes registradas, la eliminación fallará.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      severity: "error",
      onConfirm: async () => {
        try {
          await deleteClient(client.id);
          showAlert("Cliente eliminado correctamente", "success");
          await fetchClients();
        } catch (error) {
          handleApiError(error, showAlert);
        }
      },
    });
  }

  function fullName(client) {
    if (client.type === "DISTRIBUTOR") return client.name;
    return [client.name, client.lastName1, client.lastName2]
      .filter(Boolean)
      .join(" ");
  }

  function renderClientActions(client) {
    if (!hasWriteAccess) return null;

    return (
      <div className="flex items-center justify-center gap-1">
        <AppToolTip message="Editar" position="top">
          <button
            type="button"
            onClick={() => onStartEdit?.(client)}
            aria-label="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#34c3d6]/10 hover:text-[#34c3d6]"
          >
            <Pencil size={14} />
          </button>
        </AppToolTip>

        <AppToolTip message="Eliminar" position="top">
          <button
            type="button"
            onClick={() => handleOpenDelete(client)}
            aria-label="Eliminar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </AppToolTip>
      </div>
    );
  }

  const privateCount = clients.filter(
    (client) => client.type === "PRIVATE",
  ).length;
  const distributorCount = clients.filter(
    (client) => client.type === "DISTRIBUTOR",
  ).length;
  const hasActiveFilters = search.trim() || typeFilter !== "ALL";

  const headerActions = hasWriteAccess ? (
    <button
      type="button"
      onClick={onStartCreate}
      className="
                flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#34c3d6] text-white text-sm font-semibold
                hover:bg-[#28b4c8] transition-colors
            "
    >
      <Plus size={16} />
      Nuevo Cliente
    </button>
  ) : null;

  return (
    <div className="space-y-5">
      <ModulePanelHeader
        title="Clientes"
        subtitle={`${clients.length} cliente${clients.length !== 1 ? "s" : ""} — ${privateCount} privado${privateCount !== 1 ? "s" : ""}, ${distributorCount} distribuidor${distributorCount !== 1 ? "es" : ""}`}
        icon={Users}
        variant="list"
        actions={headerActions}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cédula o correo..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#34c3d6] focus:ring-4 focus:ring-[#34c3d6]/10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-none">
            <SearchableSelect
              options={CLIENT_TYPE_OPTIONS}
              value={typeFilter === "ALL" ? null : typeFilter}
              onChange={(nextValue) => setTypeFilter(nextValue || "ALL")}
              placeholder="Tipo"
              searchPlaceholder="Buscar tipo..."
              icon={Filter}
              variant="filter"
              showSearch={false}
              clearAriaLabel="Limpiar tipo"
              className="w-full sm:w-[12rem]"
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("ALL");
                }}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {loadingData ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Cargando clientes...</span>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Users size={32} strokeWidth={1.5} />
                <span className="text-sm">
                  {hasActiveFilters
                    ? "No se encontraron resultados"
                    : "No hay clientes registrados"}
                </span>
              </div>
            </div>
          ) : (
            paginatedClients.map((client) => (
              <article key={client.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {client.identityNumber}
                    </span>
                    <p className="text-sm font-semibold text-slate-800">
                      {fullName(client)}
                    </p>
                  </div>

                  <span
                    className={`
                                            inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium shadow-none
                                            ${TYPE_STYLES[client.type] || "border-slate-200 bg-slate-50 text-slate-500"}
                                        `}
                  >
                    {TYPE_LABELS[client.type] || client.type}
                  </span>
                </div>

                <div className="grid gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Correo</p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {client.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">Teléfono</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {client.phone || "—"}
                    </p>
                  </div>
                </div>

                {hasWriteAccess && (
                  <div className="border-t border-slate-100 pt-2">
                    {renderClientActions(client)}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block xl:hidden">
          <table className="w-full table-fixed text-[13px]">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="w-[8.5rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>
                <th className="w-[7rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Tipo
                </th>
                <th className="w-[13rem] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Correo
                </th>
                <th className="w-[6rem] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {search || typeFilter !== "ALL"
                          ? "No se encontraron resultados"
                          : "No hay clientes registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-flex max-w-full rounded bg-slate-100 px-2 py-0.5">
                        <TruncatedCell
                          value={client.identityNumber}
                          className="max-w-[7.25rem]"
                          contentClassName="max-w-full font-mono text-sm text-slate-700"
                        />
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="min-w-0">
                        <TruncatedCell
                          value={fullName(client)}
                          className="w-full"
                          contentClassName="max-w-full text-sm font-medium text-slate-800"
                        />
                        <TruncatedCell
                          value={client.phone}
                          className="mt-1 w-full"
                          contentClassName="max-w-full text-xs text-slate-400"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center align-top">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium shadow-none ${
                          TYPE_STYLES[client.type] ||
                          "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {TYPE_LABELS[client.type] || client.type}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <TruncatedCell
                        value={client.email}
                        className="w-full"
                        contentClassName="max-w-full text-sm text-slate-600"
                      />
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      {renderClientActions(client)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                  Correo
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                  Teléfono
                </th>
                <th className="px-5 py-3 text-center font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="text-sm">Cargando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users size={32} strokeWidth={1.5} />
                      <span className="text-sm">
                        {search || typeFilter !== "ALL"
                          ? "No se encontraron resultados"
                          : "No hay clientes registrados"}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex max-w-full rounded bg-slate-100 px-2 py-0.5">
                        <TruncatedCell
                          value={client.identityNumber}
                          className="max-w-[10.5rem]"
                          contentClassName="max-w-full font-mono text-sm text-slate-700"
                        />
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <TruncatedCell
                        value={fullName(client)}
                        className="w-full"
                        contentClassName="max-w-[16rem] text-sm font-medium text-slate-800"
                      />
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`
                                                    inline-block px-2.5 py-1 rounded-full
                                                    text-xs font-medium border
                                                    ${TYPE_STYLES[client.type] || "bg-slate-50 text-slate-500 border-slate-200"}
                                                `}
                      >
                        {TYPE_LABELS[client.type] || client.type}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <TruncatedCell
                        value={client.email}
                        className="w-full"
                        contentClassName="max-w-[16rem] text-sm text-slate-600"
                      />
                    </td>

                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-600 text-sm">
                        {client.phone || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {renderClientActions(client)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingData && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {visibleStart}–{visibleEnd} de {filtered.length} cliente
              {filtered.length !== 1 ? "s" : ""}
            </p>

            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="ml-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
