import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronDown, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

export default function ProfileDropdown() {
    const [open, setOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const dropdownRef = useRef(null);

    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleLogout() {
        setOpen(false);
        logout();
        navigate("/login", { replace: true });
    }

    function handleChangePassword() {
        setOpen(false);
        setShowPasswordModal(true);
    }

    const displayName = auth?.name || "Admin";
    const displayEmail = auth?.email || "";
    const isMaster = auth?.isMaster;

    return (
        <>
            <div ref={dropdownRef} className="relative">
                {/* Trigger button */}
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="
                        flex items-center gap-2 h-full px-3
                        text-slate-600 hover:text-slate-800
                        transition-colors duration-150
                    "
                >
                    <div className="w-6 h-6 rounded-full bg-[#34c3d6]/15 flex items-center justify-center">
                        <User size={13} className="text-[#34c3d6]" />
                    </div>

                    <span className="text-xs font-medium max-w-[120px] truncate hidden sm:inline">
                        {displayName}
                    </span>

                    <ChevronDown
                        size={13}
                        className={`
                            text-slate-400 transition-transform duration-200
                            ${open ? "rotate-180" : ""}
                        `}
                    />
                </button>

                {/* Dropdown menu */}
                {open && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                        {/* Profile info */}
                        <div className="px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#34c3d6]/15 flex items-center justify-center shrink-0">
                                    <User size={16} className="text-[#34c3d6]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {displayName} {auth?.lastName1 || ""}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {displayEmail}
                                    </p>
                                </div>
                            </div>
                            {isMaster && (
                                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ef7d2d] bg-[#ef7d2d]/10 rounded-full">
                                    Master Admin
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="py-1">
                            <button
                                onClick={handleChangePassword}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                            >
                                <KeyRound size={15} className="text-slate-400" />
                                Cambiar contraseña
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={15} />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Change password modal */}
            <ChangePasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    );
}