import React from 'react';
import { ArrowRight, ShieldAlert, Activity, FileText, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
    {
        icon: ShieldAlert,
        title: 'Ca bệnh COVID-19',
        category: 'Dịch tễ',
        desc: 'Trích xuất thông tin bệnh nhân, sốt cao, ho, cách ly tại Bệnh viện Bạch Mai.',
        text: 'Bệnh nhân 1234 nam 35 tuổi sinh sống tại Hà Nội, làm nghề tài xế. Ngày 15/08, bệnh nhân xuất hiện triệu chứng sốt cao, ho và đau họng nên đã đến Bệnh viện Bạch Mai khám và được điều trị cách ly.'
    },
    {
        icon: Activity,
        title: 'Hồ sơ Bệnh án Lâm sàng',
        category: 'Lâm sàng',
        desc: 'Nhận diện bệnh nhân nữ nhập viện Viện Pasteur với biểu hiện mệt mỏi, khó thở.',
        text: 'Bệnh nhân Nguyễn Văn A nữ 42 tuổi nhập viện Viện Pasteur TP. Hồ Chí Minh với biểu hiện mệt mỏi, khó thở và mất vị giác. Bác sĩ chẩn đoán nghi nhiễm COVID-19.'
    },
    {
        icon: FileText,
        title: 'Bản tin Y tế Cộng đồng',
        category: 'Bản tin',
        desc: 'Phân tích lịch trình công nhân di chuyển từ Đà Nẵng về Hải Phòng.',
        text: 'Bộ Y tế thông báo ca bệnh BN5678 là công nhân 28 tuổi tại Quảng Ninh, vừa di chuyển từ Đà Nẵng về Hải Phòng ngày 10/10 với các triệu chứng sổ mũi và đau đầu.'
    }
];

export default function HeroWelcome({ onSelectSample }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            maxWidth: '740px',
            margin: '0 auto',
        }}
            className="animate-fade-up"
        >
            {/* Badge */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 14px',
                borderRadius: '9999px',
                border: '1px solid var(--hairline)',
                background: 'var(--surface-card)',
                marginBottom: '24px',
            }}>
                <Sparkles style={{ width: 13, height: 13, color: 'var(--coral)' }} />
                <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--muted)',
                    letterSpacing: '0.02em',
                }}>
                    PhoBERT v2 · PhoNER COVID-19 · Clinical Entity Recognition
                </span>
            </div>

            {/* Headline */}
            <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '36px',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                lineHeight: 1.15,
                marginBottom: '16px',
            }}>
                Trích xuất Thực thể Y tế
                <br />
                <span style={{ color: 'var(--coral)' }}>Tiếng Việt</span> bằng PhoBERT
            </h2>

            <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                color: 'var(--muted)',
                maxWidth: '520px',
                margin: '0 auto 32px',
                lineHeight: 1.65,
            }}>
                Nhập đoạn văn bản y tế hoặc chọn kịch bản mẫu để tự động nhận diện
                Mã BN, Triệu chứng, Chẩn đoán, Bệnh viện &amp; Địa điểm dịch tễ.
            </p>

            {/* 3 Feature Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                textAlign: 'left',
            }}>
                {SUGGESTIONS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectSample(item.text)}
                            className="feature-card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                border: 'none',
                                textAlign: 'left',
                                padding: '20px',
                                transition: 'box-shadow 0.15s, transform 0.15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,20,19,0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px',
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(204,120,92,0.1)',
                                        border: '1px solid rgba(204,120,92,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--coral)',
                                    }}>
                                        <Icon style={{ width: 15, height: 15 }} />
                                    </div>
                                    <span style={{
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        letterSpacing: '0.07em',
                                        textTransform: 'uppercase',
                                        color: 'var(--muted-soft)',
                                        border: '1px solid var(--hairline)',
                                        borderRadius: '4px',
                                        padding: '2px 6px',
                                    }}>
                                        {item.category}
                                    </span>
                                </div>

                                <h3 style={{
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--body-strong)',
                                    marginBottom: '6px',
                                }}>
                                    {item.title}
                                </h3>

                                <p style={{
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '12px',
                                    color: 'var(--muted)',
                                    lineHeight: 1.55,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {item.desc}
                                </p>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '16px',
                                paddingTop: '14px',
                                borderTop: '1px solid var(--hairline-soft)',
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: 'var(--coral)',
                                }}>
                                    Thử ngay
                                </span>
                                <ArrowRight style={{ width: 14, height: 14, color: 'var(--coral)' }} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
