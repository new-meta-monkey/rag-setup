import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Settings, Database, Menu, X, FileText, MessageCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                    isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                )
            }
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
};

export const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex w-72 flex-col border-r border-zinc-800 bg-zinc-900/30 backdrop-blur-xl fixed h-full z-20">
                <div className="p-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">RAG Studio</h1>
                            <p className="text-xs text-zinc-500 font-medium">Local Knowledge Base</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Menu
                    </div>
                    <SidebarItem to="/ingest" icon={FileText} label="Ingest Data" />
                    <SidebarItem to="/query" icon={MessageCircle} label="Query Knowledge" />
                    <SidebarItem to="/documents" icon={Database} label="Knowledge Base" />

                    <div className="px-4 py-2 mt-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        System
                    </div>
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-zinc-800/50">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                            <span className="text-xs font-medium text-zinc-400">System Online</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-base">RAG Studio</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-zinc-400 hover:text-white"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-20 bg-zinc-950/90 backdrop-blur-sm pt-20 px-4">
                    <nav className="space-y-2">
                        <SidebarItem to="/ingest" icon={FileText} label="Ingest Data" />
                        <SidebarItem to="/query" icon={MessageCircle} label="Query Knowledge" />
                        <SidebarItem to="/documents" icon={Database} label="Knowledge Base" />
                        <SidebarItem to="/settings" icon={Settings} label="Settings" />
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-72 min-h-screen relative">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-0 right-0 w-full h-96 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 p-4 md:p-8 pt-20 md:pt-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
