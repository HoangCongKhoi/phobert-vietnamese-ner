import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const SAMPLES = [
  {
    title: 'Ca nhiễm COVID-19',
    category: 'Bài báo y tế',
    text: 'Bệnh nhân 1234 nam 35 tuổi sinh sống tại Hà Nội, làm nghề tài xế. Ngày 15/08, bệnh nhân xuất hiện triệu chứng sốt cao, ho và đau họng nên đã đến Bệnh viện Bạch Mai khám và được điều trị cách ly.'
  },
  {
    title: 'Hồ sơ bệnh án',
    category: 'Lâm sàng',
    text: 'Bệnh nhân Nguyễn Văn A nữ 42 tuổi nhập viện Viện Pasteur TP. Hồ Chí Minh với biểu hiện mệt mỏi, khó thở và mất vị giác. Bác sĩ chẩn đoán nghi nhiễm COVID-19.'
  },
  {
    title: 'Bản tin y tế Đà Nẵng',
    category: 'Bản tin xã hội',
    text: 'Bộ Y tế thông báo ca bệnh BN5678 là công nhân 28 tuổi tại Quảng Ninh, vừa di chuyển từ Đà Nẵng về Hải Phòng ngày 10/10 với các triệu chứng sổ mũi và đau đầu.'
  }
];

export default function SampleSelector({ onSelectSample }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Mẫu câu thử nghiệm nhanh (1-Click Presets)
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {SAMPLES.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSample(sample.text)}
            className="glass-card p-2.5 text-left flex items-center justify-between gap-3 group cursor-pointer hover:border-indigo-500/50 transition-all bg-slate-900/60"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {sample.title}
                </span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                  {sample.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-full">
                {sample.text}
              </p>
            </div>
            <div className="flex-shrink-0 text-indigo-400 group-hover:translate-x-0.5 transition-transform p-1 rounded-md bg-indigo-950/40 border border-indigo-800/40">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
