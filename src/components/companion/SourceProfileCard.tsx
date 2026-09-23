import React from 'react';
import type { Data } from './client';

const LABELS: [string, string][] = [
  ['trainingGoal', 'Mục tiêu tập luyện'], ['medicalHistory', 'Bệnh lý / lưu ý sức khỏe'], ['medications', 'Thuốc đang dùng'],
  ['medicalClearance', 'Xác nhận vận động của bác sĩ'], ['ptNotes', 'Ghi chú của PT'],
];
function value(f: Data | undefined) {
  if (!f || f.status === 'not_recorded') return 'Chưa ghi nhận';
  if (f.status === 'not_disclosed') return 'Khách không khai báo';
  return f.status === 'reported_none' ? `${f.raw} (khách ghi là không có)` : f.raw;
}

/** Read-only: what the gym recorded for this member. Values are shown as written, never inferred. */
export default function SourceProfileCard({ profile }: { profile: Data }) {
  return <section className="space-y-3 rounded-2xl border border-orange-500/40 bg-slate-900 p-4" aria-label="Thông tin phòng tập đã ghi nhận">
    <h3 className="font-bold text-orange-300">Thông tin phòng tập đã ghi nhận</h3>
    <p className="text-sm">{profile.label} · {profile.ageAtSource} tuổi · {profile.heightCm} cm · {profile.weightKg} kg <span className="text-xs text-slate-400">(tại thời điểm ghi nhận)</span></p>
    <dl className="space-y-2 text-sm">
      {LABELS.map(([key, label]) => <div key={key}><dt className="text-xs text-slate-400">{label}</dt><dd className="whitespace-pre-wrap">{value(profile.fields?.[key])}</dd></div>)}
      <div><dt className="text-xs text-slate-400">Lộ trình PT tham chiếu</dt><dd>{profile.program?.name} · {profile.program?.sessionCount} buổi trong tài liệu</dd></div>
    </dl>
    {profile.notes?.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-slate-300">Ghi chú khi tiếp nhận</summary><ul className="mt-2 list-disc space-y-1 pl-5">{profile.notes.map((n: string, i: number) => <li key={i}>{n}</li>)}</ul></details>}
    <p className="text-xs text-slate-400">Đây là thông tin phòng tập đã ghi nhận, không phải chẩn đoán hay giáo án được giao. Cần chỉnh sửa, hãy liên hệ lễ tân hoặc HLV. AI Gym Buddy (tab Hỏi đáp) trả lời theo đúng thông tin này.</p>
  </section>;
}
