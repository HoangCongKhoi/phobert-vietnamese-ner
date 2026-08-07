import React from "react";
import { Zap, Tag, Search } from "lucide-react";

export default function NerHighlighter({ result, activeFilters, isLoading }) {
    if (isLoading) {
        return (
            <div style={{
                background: 'var(--surface-card)',
                borderRadius: '12px',
                border: '1px solid var(--hairline)',
                padding: '48px 32px',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
            }}>
                <div style={{
                    width: '36px', height: '36px',
                    border: '2.5px solid var(--hairline)',
                    borderTopColor: 'var(--coral)',
                    borderRadius: '50%',
                }}
                    className="animate-spin"
                />
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--body-strong)',
                        marginBottom: '4px',
                    }}>
                        PhoBERT đang phân tích...
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--muted-soft)',
                    }}>
                        vinai/phobert-base-v2 · Tokenizing & running NER head
                    </p>
                </div>
            </div>
        );
    }

    if (!result || !result.spans) {
        return (
            <div style={{
                background: 'var(--surface-card)',
                borderRadius: '12px',
                border: '1px dashed var(--hairline)',
                padding: '48px 32px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
            }}>
                <Tag style={{ width: 28, height: 28, color: 'var(--muted-soft)' }} />
                <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    maxWidth: '320px',
                    lineHeight: 1.55,
                }}>
                    Nhập văn bản tiếng Việt hoặc chọn câu mẫu bên trái để bắt đầu phân tích NER.
                </p>
            </div>
        );
    }

    const { spans, entities, inference_time_ms } = result;

    return (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Stat Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap style={{ width: 14, height: 14, color: 'var(--amber)' }} />
                    <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--body-strong)',
                    }}>
                        displaCy Visualizer
                    </span>
                </div>

                <div style={{ flex: 1 }} />

                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '6px',
                    padding: '3px 10px',
                }}>
                    ⚡ {inference_time_ms} ms
                </span>

                <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--coral)',
                    background: 'rgba(204,120,92,0.08)',
                    border: '1px solid rgba(204,120,92,0.2)',
                    borderRadius: '9999px',
                    padding: '3px 12px',
                }}>
                    {entities?.length || 0} thực thể
                </span>
            </div>

            {/* Main displaCy text block */}
            <div style={{
                background: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                borderRadius: '12px',
                padding: '24px',
                lineHeight: 2.1,
                fontSize: '15px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--body-strong)',
                minHeight: '140px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}>
                {spans.map((span, idx) => {
                    if (!span.is_entity) {
                        return <span key={idx} style={{ color: 'var(--ink)' }}>{span.text}</span>;
                    }

                    const isVisible = activeFilters[span.label] !== false;
                    const meta = result.metadata?.[span.label] || span.metadata || {};

                    if (!isVisible) {
                        return <span key={idx} style={{ color: 'var(--ink)' }}>{span.text}</span>;
                    }

                    return (
                        <span
                            key={idx}
                            className="ner-entity-badge group"
                            style={{
                                backgroundColor: meta.bg || '#efe9de',
                                color: meta.color || '#141413',
                                borderColor: meta.border || '#e6dfd8',
                                position: 'relative',
                            }}
                            title={`${meta.name || span.label} · ${Math.round((span.confidence || 0.95) * 100)}% confidence`}
                        >
                            <span style={{ fontWeight: 600 }}>{span.text}</span>
                            <span
                                className="ner-entity-tag"
                                style={{
                                    backgroundColor: meta.color ? `${meta.color}18` : 'rgba(20,20,19,0.1)',
                                    color: meta.color || 'var(--ink)',
                                }}
                            >
                                {span.label}
                            </span>

                            {/* Tooltip */}
                            <span style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 8px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--surface-dark)',
                                color: 'var(--on-dark)',
                                fontSize: '11px',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: 500,
                                padding: '5px 10px',
                                borderRadius: '6px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                opacity: 0,
                                transition: 'opacity 0.15s',
                                zIndex: 20,
                                boxShadow: '0 4px 16px rgba(20,20,19,0.18)',
                            }}
                                className="entity-tooltip"
                            >
                                <span style={{ color: 'var(--on-dark)' }}>{meta.name || span.label}</span>
                                <span style={{ color: 'var(--on-dark-soft)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                                    {Math.round((span.confidence || 0.95) * 100)}%
                                </span>
                            </span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
}