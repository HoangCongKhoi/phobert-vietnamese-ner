import React from "react";
import { Tag, Zap, AlertCircle } from "lucide-react";

export default function NerHighlighter({ result, activeFilters, isLoading }) {
    if (isLoading) {
        return (
            <div className="glass-panel p-8 text-center min-h-[220px] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-300">PhoBERT đang phân tích cú pháp & trích xuất thực thể...</p>
            </div>
        );
    }

    if (!result || !result.spans) {
        return (
            <div className="glass-panel p-8 text-center text-slate-400 min-h-[200px] flex flex-col items-center justify-center border-dashed">
                <Tag className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium">Nhập văn bản tiếng Việt hoặc chọn câu mẫu bên trên để bắt đầu phân tích NER.</p>
            </div>
        );
    }

    const { spans, entities, inference_time_ms, model_type } = result;

    return (
        <div className="glass-panel p-6 mb-6">
            {/* Header Info & Performance */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-bold font-heading text-slate-100">
                        Kết quả Trích xuất NER (displaCy Style)
                    </h2>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="bg-slate-800 px-2.5 py-1 rounded border border-slate-700 text-slate-300 font-mono">
                        ⚡ {inference_time_ms} ms
                    </span>
                    <span className="bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800/50 text-indigo-300 font-medium">
                        Thực thể tìm thấy: <strong className="text-white">{entities?.length || 0}</strong>
                    </span>
                </div>
            </div>

            {/* Main displaCy-inspired Interactive Text Container */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 leading-relaxed text-slate-200 font-normal text-base shadow-inner min-h-[140px] whitespace-pre-wrap select-text">
                {spans.map((span, idx) => {
                    if (!span.is_entity) {
                        return <span key={idx}>{span.text}</span>;
                    }

                    const isVisible = activeFilters[span.label] !== false;
                    const meta = span.metadata || {};

                    if (!isVisible) {
                        return <span key={idx}>{span.text}</span>;
                    }

                    return (
                        <span
                            key={idx}
                            className="ner-entity-badge group relative cursor-pointer"
                            style={{
                                backgroundColor: meta.bg || '#334155',
                                color: meta.color || '#F8FAFC',
                                borderColor: meta.border || '#475569',
                            }}
                        >
                            <span className="font-semibold">{span.text}</span>
                            <span
                                className="ner-entity-tag"
                                style={{
                                    backgroundColor: meta.color ? `${meta.color}22` : 'rgba(0,0,0,0.15)',
                                    color: meta.color || '#FFFFFF',
                                }}
                            >
                                {span.label}
                            </span>

                            {/* Hover Tooltip */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-950 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none z-20">
                                <span className="font-bold text-white">{meta.name || span.label}</span>
                                <span className="text-slate-400 ml-1.5 font-mono">({Math.round((span.confidence || 0.95) * 100)}% conf)</span>
                            </span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}