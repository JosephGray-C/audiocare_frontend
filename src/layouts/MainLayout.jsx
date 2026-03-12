import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import TitleBar from "../components/window/TitleBar";

export default function MainLayout() {
    return (
        <div className='flex flex-col h-screen bg-[#f4f4f4] overflow-hidden'>
            {/* Top bar across the whole app */}
            <TitleBar />

            {/* Main app area */}
            <div className='flex flex-1 min-h-0'>
                <Sidebar />

                <main className='scroll-area flex-1 min-w-0 overflow-auto bg-[#f4f4f4] px-4 py-4 lg:px-6 lg:py-6 xl:px-8'>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
