import React from "react";
import { Cpu, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ healthInfo }) {
    return (
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 flex flex-wrap items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/30">
                    <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                        PhoBERT NER System
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">
                        Nhận dạng Thực thể Tên riêng Tiếng Việt
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-3 sm:mt-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
                    <Activity className={`w-3.5 h-3.5 ${healthInfo?.is_real_model_loaded ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                    <span className="text-slate-300 font-medium">
                        {healthInfo?.engine || 'Đang kết nối API...'}
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>vinai/phobert-base-v2</span>
                </div>
            </div>
        </nav>
    );
}