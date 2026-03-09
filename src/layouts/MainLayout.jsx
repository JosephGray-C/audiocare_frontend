import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";

export default function MainLayout() {
    return (
        <div className='flex h-screen'>
            <Sidebar />

            <main className='bg-slate-100 flex-1 p-6 bg-gray-50 overflow-auto'>
                <Outlet />
            </main>
        </div>
    );
}
