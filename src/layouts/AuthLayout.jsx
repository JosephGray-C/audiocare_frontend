import { Outlet } from "react-router-dom";
import TitleBar from "../components/window/TitleBar";

export default function AuthLayout() {
    return (
        <div className='flex flex-col h-screen bg-[#f4f4f4] overflow-hidden'>
            <TitleBar />

            <main className='flex-1 flex items-center justify-center px-4 py-6'>
                <Outlet />
            </main>
        </div>
    );
}
