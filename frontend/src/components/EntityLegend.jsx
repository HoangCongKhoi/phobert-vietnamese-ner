import React from "react";
import { Filter, Check, EyeOff } from "lucide-react";

export default function EntityLegend({ metadata, activeFilters, onToggleFilter, onSelectAll, onDeselectAll }) {
    if (!metadata) return null;

    const labels = Object.keys(metadata);
    const activeCount = labels.filter((l) => activeFilters[l] !== false).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Header row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Filter style={{ width: 13, height: 13, color: 'var(--muted)' }} />
                    <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                    }}>
                        Lọc thực thể
                    </span>
                    <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--muted-soft)',
                        background: 'var(--surface-soft)',
                        borderRadius: '9999px',
                        padding: '1px 8px',
                        border: '1px solid var(--hairline)',
                    }}>
                        {activeCount}/{labels.length}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        onClick={onSelectAll}
                        style={{
                            background: 'none',
                            border: '1px solid var(--hairline)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-soft)'; e.currentTarget.style.color = 'var(--ink)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
                    >
                        Hiện tất cả
                    </button>
                    <button
                        onClick={onDeselectAll}
                        style={{
                            background: 'none',
                            border: '1px solid var(--hairline)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            transition: 'background 0.12s, color 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-soft)'; e.currentTarget.style.color = 'var(--ink)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
                    >
                        Ẩn tất cả
                    </button>
                </div>
            </div>

            {/* Entity chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {labels.map((labelKey) => {
                    const item = metadata[labelKey];
                    const isActive = activeFilters[labelKey] !== false;

                    return (
                        <button
                            key={labelKey}
                            onClick={() => onToggleFilter(labelKey)}
                            className={`entity-chip ${!isActive ? 'inactive' : ''}`}
                            style={{
                                backgroundColor: isActive ? item.bg : undefined,
                                color: isActive ? item.color : undefined,
                                borderColor: isActive ? item.border : undefined,
                            }}
                        >
                            {isActive
                                ? <Check style={{ width: 11, height: 11 }} />
                                : <EyeOff style={{ width: 11, height: 11 }} />
                            }
                            <span>{item.name}</span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                opacity: 0.7,
                                fontFamily: 'var(--font-mono)',
                                marginLeft: '2px',
                            }}>
                                {labelKey}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
