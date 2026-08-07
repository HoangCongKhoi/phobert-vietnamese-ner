import React from 'react';
import { SquarePen, Clock, PanelLeftOpen, PanelLeftClose, Trash2, Sun, Moon, MessageSquare } from 'lucide-react';

export default function Sidebar({
  isOpen,
  onToggleSidebar,
  onNewAnalysis,
  history,
  onSelectHistory,
  onClearHistory,
  healthInfo,
  isDark,
  onToggleTheme,
}) {
  const isOnline = healthInfo?.is_real_model_loaded;
  const engineLabel = healthInfo?.engine || 'Kết nối API...';

  return (
    <aside
      className="sidebar"
      style={{
        width: isOpen ? '272px' : '56px',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.22s ease, border-color 0.22s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '0 14px',
        height: '60px',
        borderBottom: isOpen ? '1px solid var(--sidebar-border)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isOpen ? 'space-between' : 'center',
        flexShrink: 0,
        transition: 'border-color 0.22s ease',
      }}>
        {isOpen ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflow: 'hidden',
              flex: 1,
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.2s ease 0.05s',
            }}>
              {/* Coral Logo Mark */}
              <div style={{
                width: '34px', height: '34px',
                aspectRatio: '1 / 1',
                background: 'var(--coral)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(204,120,92,0.25)',
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '17px', lineHeight: 1 }}>✦</span>
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '17px',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: 'var(--sidebar-text)',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  PhoBERT NER
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--sidebar-muted)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: '1px',
                }}>
                  Clinical AI Studio
                </div>
              </div>
            </div>

            {/* Panel Left Close Toggle Button (Expanded mode) */}
            <button
              onClick={onToggleSidebar}
              title="Thu gọn sidebar"
              style={{
                width: '34px', height: '34px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--sidebar-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-item-hover)'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-muted)'; }}
            >
              <PanelLeftClose style={{ width: 18, height: 18, strokeWidth: 1.8 }} />
            </button>
          </>
        ) : (
          /* Collapsed Header: Sidebar Expand Button */
          <button
            onClick={onToggleSidebar}
            title="Mở rộng sidebar"
            style={{
              width: '38px', height: '38px',
              aspectRatio: '1 / 1',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--sidebar-text)',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-item-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <PanelLeftOpen style={{ width: 18, height: 18, strokeWidth: 1.8 }} />
          </button>
        )}
      </div>

      {/* ── Action Button (Phân tích mới) ── */}
      <div style={{
        padding: isOpen ? '8px 10px' : '8px 14px',
        display: 'flex',
        justifyContent: isOpen ? 'flex-start' : 'center',
        flexShrink: 0,
      }}>
        {isOpen ? (
          /* Expanded: Left aligned, no color background, text + icon */
          <button
            onClick={onNewAnalysis}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              background: 'transparent',
              color: 'var(--sidebar-text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Phân tích mới"
            id="btn-new-analysis"
          >
            <SquarePen style={{ width: 18, height: 18, strokeWidth: 1.8, color: 'var(--sidebar-text)', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s ease' }}>Phân tích mới</span>
          </button>
        ) : (
          /* Collapsed: New Analysis Button */
          <button
            onClick={onNewAnalysis}
            style={{
              width: '38px', height: '38px',
              aspectRatio: '1 / 1',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--sidebar-text)',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-item-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            title="Phân tích mới"
            id="btn-new-analysis-collapsed"
          >
            <SquarePen style={{ width: 18, height: 18, strokeWidth: 1.8 }} />
          </button>
        )}
      </div>

      {/* ── History List Area ── */}
      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 10px 16px' }}>
        {isOpen && history && history.length > 0 ? (
          <div style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.2s ease 0.05s' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px 8px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--sidebar-muted)',
                fontFamily: 'var(--font-sans)',
              }}>
                <Clock style={{ width: 12, height: 12 }} />
                LỊCH SỬ ({history.length})
              </div>

              <button
                onClick={onClearHistory}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--sidebar-muted)', padding: '3px',
                  display: 'flex', alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#c64545'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-muted)'}
                title="Xóa tất cả lịch sử"
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectHistory(item.text)}
                  className="sidebar-item"
                  style={{
                    width: '100%',
                    border: 'none',
                    textAlign: 'left',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    color: 'var(--sidebar-text)',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1,
                  }}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : isOpen ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'var(--sidebar-muted)',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            opacity: 0.6,
          }}>
            Chưa có lịch sử phân tích
          </div>
        ) : null}
      </div>

      {/* ── Footer: Theme Toggle & API Status ── */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--sidebar-border)',
        background: 'var(--sidebar-bg)',
        flexShrink: 0,
      }}>
        {/* Theme Toggle Switch */}
        <div style={{ marginBottom: '10px' }}>
          {isOpen ? (
            <button
              onClick={onToggleTheme}
              id="btn-theme-toggle"
              title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--sidebar-icon-border)',
                background: 'var(--sidebar-icon-bg)',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--sidebar-icon-bg)'}
            >
              {isDark
                ? <Sun style={{ width: 14, height: 14, color: 'var(--amber)', flexShrink: 0 }} />
                : <Moon style={{ width: 14, height: 14, color: 'var(--sidebar-muted)', flexShrink: 0 }} />
              }
              <span style={{
                flex: 1,
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--sidebar-text)',
                textAlign: 'left',
              }}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
              <div style={{
                width: '32px', height: '18px',
                borderRadius: '9999px',
                background: isDark ? 'var(--coral)' : 'var(--hairline)',
                border: '1px solid var(--hairline)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: isDark ? '14px' : '2px',
                  width: '12px', height: '12px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </button>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={onToggleTheme}
                id="btn-theme-toggle-collapsed"
                title={isDark ? 'Light Mode' : 'Dark Mode'}
                style={{
                  width: '38px', height: '38px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sidebar-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-item-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {isDark
                  ? <Sun style={{ width: 16, height: 16, color: 'var(--amber)' }} />
                  : <Moon style={{ width: 16, height: 16 }} />
                }
              </button>
            </div>
          )}
        </div>

        {/* API Status Badge */}
        {isOpen ? (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--sidebar-icon-bg)',
              borderRadius: '8px',
              padding: '8px 10px',
              border: '1px solid var(--sidebar-icon-border)',
            }}>
              <span className={isOnline ? 'dot-online animate-pulse-dot' : 'dot-demo animate-pulse-dot'} />
              <span style={{
                fontSize: '11px', fontWeight: 500,
                color: 'var(--sidebar-muted)',
                fontFamily: 'var(--font-sans)',
                flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {engineLabel}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={isOnline ? 'dot-online animate-pulse-dot' : 'dot-demo animate-pulse-dot'} />
          </div>
        )}
      </div>
    </aside>
  );
}
