import React, { useState } from "react";
import { Code, Table, Copy, Check } from 'lucide-react';

export default function RawJsonView({ result }) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('table'); // 'table' or 'json'

    if (!result || !result.entities) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-panel p-6 mb-8">
            {/* Header Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'table'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Table className="w-3.5 h-3.5" />
                        <span>Bảng thống kê Thực thể ({result.entities.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'json'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        <Code className="w-3.5 h-3.5" />
                        <span>JSON API Payload</span>
                    </button>
                </div>

                {activeTab === 'json' && (
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép!' : 'Copy JSON'}</span>
                    </button>
                )}
            </div>

            {/* Tab 1: Entity Breakdown Table */}
            {activeTab === 'table' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="py-2.5 px-4">#</th>
                                <th className="py-2.5 px-4">Từ / Cụm từ thực thể</th>
                                <th className="py-2.5 px-4">Loại Nhãn (Entity Tag)</th>
                                <th className="py-2.5 px-4">Vị trí (Start - End)</th>
                                <th className="py-2.5 px-4">Độ tin cậy (Confidence)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono">
                            {result.entities.map((ent, idx) => {
                                const meta = result.metadata?.[ent.label] || {};
                                return (
                                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-2.5 px-4 text-slate-500 font-bold">{idx + 1}</td>
                                        <td className="py-2.5 px-4 font-sans font-semibold text-white">{ent.word}</td>
                                        <td className="py-2.5 px-4">
                                            <span
                                                className="inline-block px-2 py-0.5 rounded text-[11px] font-bold"
                                                style={{
                                                    backgroundColor: meta.bg || '#334155',
                                                    color: meta.color || '#F8FAFC',
                                                    border: `1px solid ${meta.border || '#475569'}`,
                                                }}
                                            >
                                                {ent.label} ({meta.name || ent.label})
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-400">{ent.start} - {ent.end}</td>
                                        <td className="py-2.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-full rounded-full"
                                                        style={{ width: `${Math.round((ent.confidence || 0.9) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-indigo-300 font-bold">
                                                    {Math.round((ent.confidence || 0.9) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab 2: Raw JSON code block */}
            {activeTab === 'json' && (
                <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-80 shadow-inner">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}