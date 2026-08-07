import React, { useState } from "react";
import { Code, Table, Copy, Check } from 'lucide-react';

export default function RawJsonView({ result }) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('table');

    if (!result || !result.entities) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div className="tab-bar" style={{ flex: 1 }}>
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`tab-item ${activeTab === 'table' ? 'active' : ''}`}
                        id="tab-entity-table"
                    >
                        <Table style={{ width: 13, height: 13 }} />
                        <span>Bảng thực thể ({result.entities.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`tab-item ${activeTab === 'json' ? 'active' : ''}`}
                        id="tab-json-payload"
                    >
                        <Code style={{ width: 13, height: 13 }} />
                        <span>JSON Payload</span>
                    </button>
                </div>

                {activeTab === 'json' && (
                    <button
                        onClick={handleCopy}
                        className="btn-secondary"
                        style={{ height: '34px', padding: '0 14px', fontSize: '12px', gap: '5px' }}
                    >
                        {copied
                            ? <Check style={{ width: 13, height: 13, color: 'var(--success)' }} />
                            : <Copy style={{ width: 13, height: 13 }} />
                        }
                        {copied ? 'Đã sao chép' : 'Copy JSON'}
                    </button>
                )}
            </div>

            {/* Entity Table */}
            {activeTab === 'table' && (
                <div style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                        }}>
                            <thead>
                                <tr style={{
                                    background: 'var(--surface-card)',
                                    borderBottom: '1px solid var(--hairline)',
                                }}>
                                    {['#', 'Cụm từ thực thể', 'Loại nhãn', 'Vị trí', 'Độ tin cậy'].map((h, i) => (
                                        <th key={i} style={{
                                            padding: '10px 16px',
                                            textAlign: 'left',
                                            fontFamily: 'var(--font-sans)',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: 'var(--muted)',
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {result.entities.map((ent, idx) => {
                                    const meta = result.metadata?.[ent.label] || {};
                                    const conf = Math.round((ent.confidence || 0.9) * 100);
                                    return (
                                        <tr
                                            key={idx}
                                            style={{
                                                borderBottom: idx < result.entities.length - 1 ? '1px solid var(--hairline-soft)' : 'none',
                                                transition: 'background 0.1s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-soft)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted-soft)', fontWeight: 700 }}>
                                                {idx + 1}
                                            </td>
                                            <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--body-strong)' }}>
                                                {ent.word}
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    padding: '2px 10px',
                                                    borderRadius: '9999px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    fontFamily: 'var(--font-sans)',
                                                    background: meta.bg || 'var(--surface-card)',
                                                    color: meta.color || 'var(--muted)',
                                                    border: `1px solid ${meta.border || 'var(--hairline)'}`,
                                                }}>
                                                    {ent.label}
                                                    <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '10px' }}>
                                                        {meta.name ? `· ${meta.name}` : ''}
                                                    </span>
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
                                                {ent.start}–{ent.end}
                                            </td>
                                            <td style={{ padding: '10px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '64px', height: '4px',
                                                        background: 'var(--hairline)',
                                                        borderRadius: '9999px',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${conf}%`,
                                                            background: conf > 85 ? 'var(--teal)' : conf > 65 ? 'var(--amber)' : 'var(--error)',
                                                            borderRadius: '9999px',
                                                            transition: 'width 0.4s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: conf > 85 ? 'var(--teal)' : conf > 65 ? 'var(--amber)' : 'var(--error)',
                                                    }}>
                                                        {conf}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* JSON view — dark code-window-card style */}
            {activeTab === 'json' && (
                <div style={{
                    background: 'var(--surface-dark)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(250,249,245,0.06)',
                }}>
                    {/* Window chrome */}
                    <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid rgba(250,249,245,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--surface-dark-elevated)',
                    }}>
                        {['#c64545', '#e8a55a', '#5db872'].map((c, i) => (
                            <span key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
                        ))}
                        <span style={{
                            marginLeft: '8px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--on-dark-soft)',
                        }}>
                            api_response.json
                        </span>
                    </div>

                    <pre className="code-block" style={{
                        background: 'var(--surface-dark-soft)',
                        borderRadius: 0,
                        maxHeight: '360px',
                        overflow: 'auto',
                        color: '#a8d4a8',
                        border: 'none',
                        margin: 0,
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}