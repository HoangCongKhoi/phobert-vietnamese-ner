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
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Mẫu câu thử nghiệm nhanh (1-Click Presets)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLES.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSample(sample.text)}
            className="glass-card p-3.5 text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors">
                  {sample.title}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                  {sample.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                "{sample.text}"
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-end text-[11px] text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Thử ngay</span>
              <Sparkles className="w-3 h-3 ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
