import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EntityLegend from './components/EntityLegend';
import NerHighlighter from './components/NerHighlighter';
import SampleSelector from './components/SampleSelector';
import RawJsonView from './components/RawJsonView';
import { Send, Eraser, Sparkles, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [inputText, setInputText] = useState(
    'Bệnh nhân 1234 nam 35 tuổi sinh sống tại Hà Nội, làm nghề tài xế. Ngày 15/08, bệnh nhân xuất hiện triệu chứng sốt cao, ho và đau họng nên đã đến Bệnh viện Bạch Mai khám và được điều trị cách ly.'
  );
  const [result, setResult] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // fetch health
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      }
    } catch {
      setHealthInfo({ status: 'offline', engine: 'FastAPI Backend offline' });
    }
  };

  // dự đoán trước 
  useEffect(() => {
    if (inputText) {
      analyzeText(inputText);
    }
  }, []);

  const analyzeText = async (textToAnalyze) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        throw new Error('API request failed');
      }

    } catch {
      console.warn('Backend not responding, using direct browser fallback for demo');
      //  Fallback engine in browser if backend API is not running yet
      simulateBrowserPrediction(text);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateBrowserPrediction = (text) => {
    // Client-side fallback so UI works seamlessly even before backend is started
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
      PATIENT_ID: { name: 'Mã bệnh nhân', color: '#2563EB', bg: '#DBEAFE', border: '#93C5FD' },
      NAME: { name: 'Tên người', color: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
      AGE: { name: 'Tuổi', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
      GENDER: { name: 'Giới tính', color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
      LOCATION: { name: 'Địa điểm', color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
      ORGANIZATION: { name: 'Tổ chức / Bệnh viện', color: '#0891B2', bg: '#CFFAFE', border: '#67E8F9' },
      DATE: { name: 'Thời gian / Ngày', color: '#4F46E5', bg: '#E0E7FF', border: '#A5B4FC' },
      JOB: { name: 'Nghề nghiệp', color: '#DB2777', bg: '#FCE7F3', border: '#FBCFE8' },
      SYMPTOM: { name: 'Triệu chứng', color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
      DISEASE: { name: 'Tên bệnh / Vi-rút', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
    };

    patterns.forEach(({ pat, label }) => {
      let match;
      while ((match = pat.exec(text)) !== null) {
        mockEntities.push({
          word: match[0],           // từ được tìm thấy
          label,                  // nhãn thực thể
          start: match.index,       // chỉ số bắt đầu
          end: match.index + match[0].length, // chỉ số kết thúc
          confidence: 0.95
        });
      }
    });

    // sắp xếp các thực thể tìm theo thứ tự xuất hiện từ trái qua phải trong câu
    mockEntities.sort((a, b) => a.start - b.start);

    // build spans
    const spans = [];
    let lastIdx = 0;
    mockEntities.forEach((ent) => {
      // nếu có đoạn chữ thường nằm trước đẩy nó vào mảng spans
      if (ent.start > lastIdx) {
        spans.push({
          text: text.slice(lastIdx, ent.start),
          is_entity: false
        });
      }
      spans.push({
        text: ent.word,
        is_entity: true,
        label: ent.label,
      });
      lastIdx = ent.end;
    });

    // nếu còn thừa chút chữ ở cuối đẩy nốt vào mảng spans
    if (lastIdx < text.length) {
      spans.push({ text: text.slice(lastIdx), is_entity: false });
    }

    setResult({
      text,
      entities: mockEntities,
      spans,
      metadata,
      inference_time_ms: 12.4,
      model_type: 'PhoBERT NER Engine (Demo Client Fallback)',
    });
  };

  const handleToggleFilter = (labelKey) => {
    setActiveFilters((prev) => ({
      ...prev,
      [labelKey]: prev[labelKey] === false ? true : false,
    }));
  };

  const handleSelectAll = () => setActiveFilters({});
  const handleDeselectAll = () => {
    const allOff = {};
    if (result?.metadata) {
      Object.keys(result.metadata).forEach((k) => (allOff[k] = false));
    }
    setActiveFilters(allOff);
  };

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <Navbar healthInfo={healthInfo} />

      {/* Main Input Text Area Card */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <label className="text-sm font-bold font-heading text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Văn bản tiếng Việt đầu vào (Vietnamese Input Text)</span>
          </label>

          <span className="text-xs text-slate-500 font-mono">
            {inputText.length} ký tự
          </span>
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập đoạn văn bản tiếng Việt chứa thông tin bệnh nhân, triệu chứng, địa điểm..."
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans leading-relaxed resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setInputText('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Xóa văn bản</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => checkHealth()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="Kiểm tra kết nối Backend API"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => analyzeText()}
                disabled={isLoading || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Trích xuất NER</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Sample Presets */}
      <SampleSelector
        onSelectSample={(sampleText) => {
          setInputText(sampleText);
          analyzeText(sampleText);
        }}
      />

      {/* Filter Legend */}
      <EntityLegend
        metadata={result?.metadata}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* DisplaCy Interactive NER Visualizer */}
      <NerHighlighter
        result={result}
        activeFilters={activeFilters}
        isLoading={isLoading}
      />

      {/* Table & JSON Payload Inspector */}
      <RawJsonView result={result} />

      <footer className="text-center text-xs text-slate-500 mt-12">
        <p>PhoBERT Vietnamese NER Demo • Powering NLP COVID-19 Clinical Entity Recognition</p>
      </footer>
    </div>
  );
}

// run
