import React, { useRef } from 'react';
import { Activity, Building2, MapPin, AlertTriangle, ShieldCheck, Calendar, User, Briefcase, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PatientDossier({ result }) {
    const dossierRef = useRef(null);

    if (!result || !result.entities || result.entities.length === 0) {
        return null;
    }

    const { entities } = result;
    const getEntitiesByLabel = (label) => entities.filter((e) => e.label === label);

    const patientId = getEntitiesByLabel('PATIENT_ID').map((e) => e.word).join(', ') || null;
    const name = getEntitiesByLabel('NAME').map((e) => e.word).join(', ') || null;
    const age = getEntitiesByLabel('AGE').map((e) => e.word).join(', ') || null;
    const gender = getEntitiesByLabel('GENDER').map((e) => e.word).join(', ') || null;
    const job = getEntitiesByLabel('JOB').map((e) => e.word).join(', ') || null;
    const locations = Array.from(new Set(getEntitiesByLabel('LOCATION').map((e) => e.word)));
    const hospitals = Array.from(new Set(getEntitiesByLabel('ORGANIZATION').map((e) => e.word)));
    const symptoms = Array.from(new Set(getEntitiesByLabel('SYMPTOM').map((e) => e.word)));
    const diseases = Array.from(new Set(getEntitiesByLabel('DISEASE').map((e) => e.word)));
    const dates = Array.from(new Set(getEntitiesByLabel('DATE').map((e) => e.word)));

    const handleExportPDF = async () => {
        if (!dossierRef.current) return;

        try {
            // Capture the dossier element as canvas
            const canvas = await html2canvas(dossierRef.current, {
                scale: 2, // Higher quality
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`benh-an-${patientId || 'patient'}-${Date.now()}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
        }
    };

    return (
        <div
            ref={dossierRef}
            className="animate-fade-up"
            style={{
                background: 'var(--surface-card)',
                borderRadius: '16px',
                border: '1px solid var(--hairline)',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(20,20,19,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
            }}
        >
            {/* Card Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--hairline)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px', height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(204,120,92,0.12)',
                        border: '1px solid rgba(204,120,92,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--coral)',
                        flexShrink: 0,
                    }}>
                        <ShieldCheck style={{ width: 20, height: 20 }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '20px',
                                fontWeight: 500,
                                color: 'var(--ink)',
                                lineHeight: 1.2,
                            }}>
                                Hồ Sơ Bệnh Án Trích Xuất
                            </h3>
                        </div>
                        <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '12px',
                            color: 'var(--muted)',
                            marginTop: '2px',
                        }}>
                            Hệ thống AI tổng hợp tự động từ văn bản bệnh án lâm sàng
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleExportPDF}
                        title="Xuất PDF"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'var(--coral)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#b86e54';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--coral)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <FileDown style={{ width: 16, height: 16 }} />
                        Xuất PDF
                    </button>

                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--coral)',
                        background: 'rgba(204,120,92,0.1)',
                        border: '1px solid rgba(204,120,92,0.25)',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                    }}>
                        {patientId ? patientId : 'E-DOSSIER'}
                    </span>
                </div>
            </div>

            {/* Demographics Grid (Cell cards inside) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
            }}>
                {/* Cell 1: Patient ID / Name */}
                <div style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                        <User style={{ width: 12, height: 12 }} />
                        <span>Họ &amp; Tên / Mã BN</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--body-strong)' }}>
                        {name || patientId || 'Chưa rõ'}
                    </div>
                </div>

                {/* Cell 2: Age */}
                <div style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        <span>Tuổi</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--body-strong)' }}>
                        {age || 'Chưa rõ'}
                    </div>
                </div>

                {/* Cell 3: Gender */}
                <div style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                        <User style={{ width: 12, height: 12 }} />
                        <span>Giới tính</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--body-strong)', textTransform: 'capitalize' }}>
                        {gender || 'Chưa rõ'}
                    </div>
                </div>

                {/* Cell 4: Occupation */}
                <div style={{
                    background: 'var(--canvas)',
                    border: '1px solid var(--hairline)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                        <Briefcase style={{ width: 12, height: 12 }} />
                        <span>Nghề nghiệp</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--body-strong)' }}>
                        {job || 'Chưa rõ'}
                    </div>
                </div>
            </div>

            {/* Clinical Details Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingTop: '6px',
            }}>
                {/* Symptoms */}
                {symptoms.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        background: 'rgba(232,165,90,0.08)',
                        border: '1px solid rgba(232,165,90,0.25)',
                        borderRadius: '12px',
                    }}>
                        <AlertTriangle style={{ width: 16, height: 16, color: 'var(--amber)', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--amber)', marginBottom: '2px' }}>
                                Triệu chứng lâm sàng ({symptoms.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {symptoms.map((sym, i) => (
                                    <span key={i} style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: 'var(--ink)',
                                        background: 'var(--canvas)',
                                        border: '1px solid var(--hairline)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                    }}>
                                        {sym}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Diseases */}
                {diseases.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px 14px',
                        background: 'rgba(198,69,69,0.08)',
                        border: '1px solid rgba(198,69,69,0.2)',
                        borderRadius: '12px',
                    }}>
                        <Activity style={{ width: 16, height: 16, color: 'var(--error)', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--error)', marginBottom: '2px' }}>
                                Chẩn đoán bệnh / Vi-rút ({diseases.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {diseases.map((dis, i) => (
                                    <span key={i} style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--error)',
                                        background: 'var(--canvas)',
                                        border: '1px solid rgba(198,69,69,0.2)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                    }}>
                                        {dis}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Facilities & Locations Row */}
                {(hospitals.length > 0 || locations.length > 0 || dates.length > 0) && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px',
                    }}>
                        {hospitals.length > 0 && (
                            <div style={{
                                flex: 1,
                                minWidth: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                background: 'rgba(93,184,166,0.08)',
                                border: '1px solid rgba(93,184,166,0.25)',
                                borderRadius: '12px',
                            }}>
                                <Building2 style={{ width: 15, height: 15, color: 'var(--teal)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Cơ sở y tế / Bệnh viện</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body-strong)' }}>{hospitals.join(' · ')}</span>
                                </div>
                            </div>
                        )}

                        {locations.length > 0 && (
                            <div style={{
                                flex: 1,
                                minWidth: '180px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                background: 'var(--canvas)',
                                border: '1px solid var(--hairline)',
                                borderRadius: '12px',
                            }}>
                                <MapPin style={{ width: 15, height: 15, color: 'var(--muted)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Địa điểm / Lịch trình</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--body-strong)' }}>{locations.join(', ')}</span>
                                </div>
                            </div>
                        )}

                        {dates.length > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                background: 'var(--canvas)',
                                border: '1px solid var(--hairline)',
                                borderRadius: '12px',
                            }}>
                                <Calendar style={{ width: 15, height: 15, color: 'var(--coral)', flexShrink: 0 }} />
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Thời gian ghi nhận</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--body-strong)' }}>{dates.join(', ')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
