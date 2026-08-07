import React from "react";
import { Activity } from 'lucide-react';

export default function Navbar({ healthInfo }) {
    const isOnline = healthInfo?.is_real_model_loaded;

    return (
        <nav style={{
            background: 'var(--canvas)',
            borderBottom: '1px solid var(--hairline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: '60px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
        }}>
            {/* Left: Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        fontWeight: 500,
                        letterSpacing: '-0.025em',
                        color: 'var(--ink)',
                        lineHeight: 1.15,
                    }}>
                        Clinical AI Studio
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '11px',
                        color: 'var(--muted)',
                        lineHeight: 1.3,
                        letterSpacing: '0.02em',
                    }}>
                        PhoBERT Vietnamese NER · PhoNER COVID-19
                    </p>
                </div>
            </div>

            {/* Right: Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    border: '1px solid var(--hairline)',
                    background: 'var(--surface-soft)',
                }}>
                    <Activity style={{
                        width: 12, height: 12,
                        color: isOnline ? 'var(--success)' : 'var(--amber)',
                    }}
                        className={isOnline ? 'animate-pulse-dot' : ''}
                    />
                    <span style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--muted)',
                    }}>
                        {healthInfo?.engine || 'Kết nối API...'}
                    </span>
                </div>

                <span style={{
                    display: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--muted-soft)',
                    padding: '4px 12px',
                    border: '1px solid var(--hairline)',
                    borderRadius: '9999px',
                    background: 'var(--canvas)',
                }}>
                    vinai/phobert-base-v2
                </span>
            </div>
        </nav>
    );
}