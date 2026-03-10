import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import TitleBar from "../components/window/TitleBar";

export default function MainLayout() {
    return (
        <div className='flex h-screen'>
            {/* Sidebar */}
            <Sidebar />

            {/* App Area */}
            <div className='flex flex-col flex-1'>
                {/* Top bar */}
                <TitleBar />

                {/* Pages */}
                <main className='scroll-area flex-1 p-6 bg-gray-50 overflow-auto'>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
