import React from "react";
import { Filter, Check, EyeOff } from "lucide-react";

export default function EntityLengend({ metadata, activeFilters, onToggleFilter, onSelectAll, onDeselectAll }) {
    if (!metadata) return null;

    const labels = Object.keys(metadata);
    const activeCount = labels.filter((l) => activeFilters[l] !== false).length;

    return (
        <div className="glass-panel p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                        Danh mục Thực thể ({activeCount}/{labels.length})
                    </h3>
                    <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                        (Click để ẩn/hiện loại thực thể trong đoạn văn)
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <button
                        onClick={onSelectAll}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                        Hiện tất cả
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                        Ẩn tất cả
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
                {labels.map((labelKey) => {
                    const item = metadata[labelKey];
                    const isActive = activeFilters[labelKey] !== false;

                    return (
                        <button
                            key={labelKey}
                            onClick={() => onToggleFilter(labelKey)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${isActive
                                ? 'opacity-100 scale-100 shadow-sm'
                                : 'opacity-40 grayscale hover:grayscale-0 scale-95 border-slate-700 bg-slate-900/50 text-slate-500'
                                }`}
                            style={{
                                backgroundColor: isActive ? item.bg : undefined,
                                color: isActive ? item.color : undefined,
                                borderColor: isActive ? item.border : undefined,
                            }}
                        >
                            {isActive ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{item.name}</span>
                            <span className="text-[10px] uppercase font-bold opacity-80 bg-black/10 px-1 rounded">
                                {labelKey}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}