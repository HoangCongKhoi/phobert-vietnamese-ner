import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EntityLegend from './components/EntityLegend';
import NerHighlighter from './components/NerHighlighter';
import RawJsonView from './components/RawJsonView';
import PatientDossier from './components/PatientDossier';
import EntityGraph from './components/EntityGraph';
import HeroWelcome from './components/HeroWelcome';
import { Send, Eraser, RefreshCw, Network, Table, Eye, Command, Zap, ChevronDown } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [inputText, setInputText] = useState(
    'Bệnh nhân 1234 nam 35 tuổi sinh sống tại Hà Nội, làm nghề tài xế. Ngày 15/08, bệnh nhân xuất hiện triệu chứng sốt cao, ho và đau họng nên đã đến Bệnh viện Bạch Mai khám và được điều trị cách ly.'
  );
  const [result, setResult] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeTab, setActiveTab] = useState('highlighter'); // 'highlighter' | 'graph' | 'table'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState('phobert');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('phobert_theme') === 'dark'; } catch { return false; }
  });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('phobert_ner_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => { checkHealth(); }, []);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelMenuOpen(false);
      }
    };

    if (isModelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelMenuOpen]);

  // Sync data-theme to <html> for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem('phobert_theme', isDark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      }
    } catch {
      setHealthInfo({ status: 'offline', engine: 'Demo Mode' });
    }
  };

  useEffect(() => {
    if (inputText) analyzeText(inputText);
  }, []);

  const analyzeText = async (textToAnalyze) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    if (!text.trim()) return;

    saveToHistory(text);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          model: selectedModel  // Send selected model to backend
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        await checkHealth();
      } else {
        throw new Error('API request failed');
      }
    } catch {
      simulateBrowserPrediction(text);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (text) => {
    if (!text.trim()) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.text !== text);
      const updated = [{ text, timestamp: Date.now() }, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('phobert_ner_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save history', err);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('phobert_ner_history'); } catch (err) { console.error(err); }
  };

  const handleNewAnalysis = () => {
    setInputText('');
    setResult(null);
  };

  const simulateBrowserPrediction = (text) => {
    const mockEntities = [];
    const patterns = [
      { pat: /(bệnh\s*nhân|BN|ca\s*bệnh)\s*([0-9]{3,6})/gi, label: 'PATIENT_ID' },
      { pat: /([0-9]{1,2})\s*tuổi/gi, label: 'AGE' },
      { pat: /\b(nam|nữ)\b/gi, label: 'GENDER' },
      { pat: /(bác\s*sĩ|y\s*tá|công\s*nhân|kỹ\s*sư|học\s*sinh|sinh\s*viên|tài\s*xế)/gi, label: 'JOB' },
      { pat: /(sốt|ho|khó\s*thở|đau\s*họng|mất\s*vị\s*giác|mệt\s*mỏi|đau\s*đầu|sổ\s*mũi)/gi, label: 'SYMPTOM' },
      { pat: /(COVID-19|Covid|SARS-CoV-2|viêm\s*phổi|cúm\s*A)/gi, label: 'DISEASE' },
      { pat: /(Bệnh\s*viện\s+[A-ZÀ-Ỹa-zà-ỹ0-9\s]+|Viện\s+Pasteur|Bộ\s+Y\s*tế)/gi, label: 'ORGANIZATION' },
      { pat: /(Hà\s*Nội|TP\.?\s*Hồ\s*Chí\s*Minh|Đà\s*Nẵng|Hải\s*Phòng|Quảng\s*Ninh|Bắc\s*Giang|Bắc\s*Ninh)/gi, label: 'LOCATION' },
      { pat: /(ngày\s*[0-9]{1,2}\/[0-9]{1,2}(\/[0-9]{2,4})?)/gi, label: 'DATE' },
    ];

    const metadata = {
      PATIENT_ID: { name: 'Mã bệnh nhân',        color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD' },
      NAME:       { name: 'Tên người',            color: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
      AGE:        { name: 'Tuổi',                 color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
      GENDER:     { name: 'Giới tính',            color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
      LOCATION:   { name: 'Địa điểm',            color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
      ORGANIZATION:{ name: 'Tổ chức / Bệnh viện', color: '#0891B2', bg: '#CFFAFE', border: '#67E8F9' },
      DATE:       { name: 'Thời gian / Ngày',     color: '#4F46E5', bg: '#E0E7FF', border: '#A5B4FC' },
      JOB:        { name: 'Nghề nghiệp',          color: '#DB2777', bg: '#FCE7F3', border: '#FBCFE8' },
      SYMPTOM:    { name: 'Triệu chứng',          color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
      DISEASE:    { name: 'Tên bệnh / Vi-rút',    color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
    };

    patterns.forEach(({ pat, label }) => {
      let match;
      while ((match = pat.exec(text)) !== null) {
        mockEntities.push({ word: match[0], label, start: match.index, end: match.index + match[0].length, confidence: 0.95 });
      }
    });

    mockEntities.sort((a, b) => a.start - b.start);

    const spans = [];
    let lastIdx = 0;
    mockEntities.forEach((ent) => {
      if (ent.start > lastIdx) spans.push({ text: text.slice(lastIdx, ent.start), is_entity: false });
      spans.push({ text: ent.word, is_entity: true, label: ent.label });
      lastIdx = ent.end;
    });
    if (lastIdx < text.length) spans.push({ text: text.slice(lastIdx), is_entity: false });

    setResult({
      text, entities: mockEntities, spans, metadata,
      inference_time_ms: 12.4,
      model_type: 'PhoBERT NER Engine (Demo Fallback)',
    });
  };

  const handleToggleFilter = (labelKey) => {
    setActiveFilters((prev) => ({ ...prev, [labelKey]: prev[labelKey] === false ? true : false }));
  };

  const handleSelectAll = () => setActiveFilters({});
  const handleDeselectAll = () => {
    const allOff = {};
    if (result?.metadata) Object.keys(result.metadata).forEach((k) => (allOff[k] = false));
    setActiveFilters(allOff);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); analyzeText(); }
  };

  const sidebarWidth = isSidebarOpen ? '272px' : '60px';

  const TABS = [
    { id: 'highlighter', label: 'displaCy Visualizer', icon: Eye },
    { id: 'graph',       label: 'Knowledge Graph',     icon: Network },
    { id: 'table',       label: 'Thống kê & JSON',      icon: Table },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)', display: 'flex' }}>

      {/* ── Left Sidebar ── */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectSample={(sampleText) => { setInputText(sampleText); analyzeText(sampleText); }}
        onNewAnalysis={handleNewAnalysis}
        history={history}
        onSelectHistory={(histText) => { setInputText(histText); analyzeText(histText); }}
        onClearHistory={handleClearHistory}
        healthInfo={healthInfo}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* ── Main Content ── */}
      <div style={{
        flex: 1,
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        {/* Top Nav */}
        <Navbar healthInfo={healthInfo} />

        {/* Page Content */}
        <main style={{
          flex: 1,
          maxWidth: '1040px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>

          {/* ── Input Box ── */}
          <div className="panel-soft" style={{ padding: '16px' }}>
            {/* Label Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <label style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                Văn bản tiếng Việt
              </label>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--muted-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}>
                  <Command style={{ width: 10, height: 10 }} /> Enter
                </span>
                để chạy · {inputText.length} ký tự
              </span>
            </div>

            {/* Textarea */}
            <textarea
              id="ner-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập hoặc dán đoạn văn bản tiếng Việt chứa thông tin bệnh nhân, triệu chứng, địa điểm..."
              rows={4}
              className="input-textarea"
              style={{ marginBottom: '12px' }}
            />

            {/* Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--hairline-soft)',
            }}>
              <button
                onClick={() => setInputText('')}
                className="btn-secondary"
                style={{ height: '36px', padding: '0 14px', gap: '5px', fontSize: '13px' }}
                id="btn-clear"
              >
                <Eraser style={{ width: 14, height: 14 }} />
                Xóa
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Refresh Button */}
                <button
                  onClick={checkHealth}
                  className="btn-icon"
                  title="Kiểm tra kết nối API"
                  id="btn-refresh-health"
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                </button>

                {/* Model Selector Dropdown */}
                <div ref={modelDropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="btn-secondary"
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      gap: '6px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    <Zap style={{
                      width: 13,
                      height: 13,
                      color: 'var(--success)',
                      fill: 'var(--success)',
                    }} />
                    <span>PyTorch {selectedModel === 'phobert' ? 'PhoBERT' : 'XLM-RoBERTa'}</span>
                    <ChevronDown style={{
                      width: 13,
                      height: 13,
                      transition: 'transform 0.2s ease',
                      transform: isModelMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} />
                  </button>

                  {/* Dropdown Menu */}
                  {isModelMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      minWidth: '220px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      padding: '6px',
                      zIndex: 1000,
                      animation: 'dropdownFadeIn 0.15s ease-out',
                    }}>
                      <button
                        onClick={() => {
                          setSelectedModel('phobert');
                          setIsModelMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: selectedModel === 'phobert' ? 'var(--surface-soft)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--surface-soft)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedModel !== 'phobert') {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            marginBottom: '2px',
                          }}>
                            PhoBERT
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            color: 'var(--muted)',
                          }}>
                            Vietnamese NER
                          </div>
                        </div>
                        {selectedModel === 'phobert' && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--success)',
                          }} />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedModel('xlm-roberta');
                          setIsModelMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          background: selectedModel === 'xlm-roberta' ? 'var(--surface-soft)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          outline: 'none',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--surface-soft)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedModel !== 'xlm-roberta') {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            marginBottom: '2px',
                          }}>
                            XLM-RoBERTa
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            color: 'var(--muted)',
                          }}>
                            Multilingual NER
                          </div>
                        </div>
                        {selectedModel === 'xlm-roberta' && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--success)',
                          }} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Analyze Button */}
                <button
                  onClick={() => analyzeText()}
                  disabled={isLoading || !inputText.trim()}
                  className="btn-primary"
                  style={{ height: '38px', padding: '0 20px', gap: '6px', fontSize: '14px' }}
                  id="btn-analyze"
                >
                  <Send style={{ width: 14, height: 14 }} />
                  {isLoading ? 'Đang phân tích...' : 'Trích xuất NER'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Hero Welcome (empty state) ── */}
          {!inputText.trim() && !result && (
            <HeroWelcome
              onSelectSample={(sampleText) => { setInputText(sampleText); analyzeText(sampleText); }}
            />
          )}

          {/* ── Results Workspace ── */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. Entity Filter Chips */}
              <EntityLegend
                metadata={result?.metadata}
                activeFilters={activeFilters}
                onToggleFilter={handleToggleFilter}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />

              {/* 2. Visualizer Content Panel (Visualizer / Graph / Table) */}
              {activeTab === 'highlighter' && (
                <NerHighlighter result={result} activeFilters={activeFilters} isLoading={isLoading} />
              )}
              {activeTab === 'graph' && <EntityGraph result={result} />}
              {activeTab === 'table' && <RawJsonView result={result} />}

              {/* 3. View Switcher Tab Bar (Placed BELOW the visualizer) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}>
                <div className="tab-bar">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`tab-item ${activeTab === id ? 'active' : ''}`}
                      id={`tab-${id}`}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="divider-h" />

              {/* 4. Patient Dossier Card (Card bo góc ở dưới cùng) */}
              <PatientDossier result={result} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: '1px solid var(--hairline)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'var(--muted-soft)',
          }}>
            ✦ PhoBERT NER Clinical AI Studio · vinai/phobert-base-v2 · PhoNER COVID-19
          </span>
        </footer>
      </div>

      {/* Dropdown Animation */}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
