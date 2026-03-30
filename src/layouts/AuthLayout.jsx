import { Outlet } from "react-router-dom";
import TitleBar from "../components/window/TitleBar";

export default function AuthLayout() {
    return (
        <div className='flex flex-col h-screen bg-[#f4f4f4]'>
            <TitleBar />

            <main className='scroll-area flex-1 overflow-y-auto px-4 py-6'>
                <div className='min-h-full flex items-start justify-center sm:items-center'>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
