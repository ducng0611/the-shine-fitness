import React, { useState } from 'react';
import { type Data, fieldClass, buttonClass, secondaryClass } from './client';

type Props = { profile: Data | null; memberName: string; busy: boolean; onSave: (p: Data) => void; onExport: () => void; onDelete: () => void };
const options: Record<string, [string, string][]> = {
  goal: [['general_fitness', 'Sức khỏe và thể lực'], ['build_muscle', 'Phát triển cơ bắp'], ['fat_loss', 'Quản lý cân nặng']],
  experience: [['beginner', 'Mới tập'], ['intermediate', 'Đã có kinh nghiệm'], ['advanced', 'Tập luyện lâu năm']],
  style: [['gentle', 'Nhẹ nhàng · đồng hành'], ['energetic', 'Năng động · tích cực'], ['direct', 'Rõ ràng · đi thẳng vào việc']],
  diet: [['omnivore', 'Không ăn chay'], ['vegetarian', 'Ăn chay có sữa/trứng'], ['vegan', 'Thuần chay']],
};
export default function ProfileForm({ profile, memberName, busy, onSave, onExport, onDelete }: Props) {
  const [form, setForm] = useState<Data>(() => profile ? { ...profile, allergies: profile.allergies.join(', ') } : {
    nickname: memberName, age: '', heightCm: '', weightKg: '', preferredMinutes: 35,
    goal: 'general_fitness', experience: 'beginner', style: 'gentle', diet: 'omnivore', allergies: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
    consent: false, adultConfirmed: false, photoConsent: false, needsProfessionalReview: true,
  });
  const change = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault(); onSave({ ...form, age: Number(form.age), heightCm: Number(form.heightCm), weightKg: Number(form.weightKg),
      preferredMinutes: Number(form.preferredMinutes), allergies: String(form.allergies).split(',').map(a => a.trim()).filter(Boolean) });
  }}>
    <div><h3 className="text-xl font-bold">Một trợ lý hiểu bạn hơn</h3><p className="mt-1 text-sm text-slate-300">Chỉ khai thông tin bạn muốn dùng cho việc tập luyện. Bạn được xuất và xóa dữ liệu Companion.</p></div>
    <label className="grid gap-1 text-sm">Tên muốn được gọi<input required maxLength={60} className={fieldClass} value={form.nickname} onChange={e => change('nickname', e.target.value)} /></label>
    <div className="grid grid-cols-2 gap-3">
      {Object.entries({ age: ['Tuổi (18+)', 18, 100], heightCm: ['Chiều cao (cm)', 100, 240], weightKg: ['Cân nặng (kg)', 30, 350], preferredMinutes: ['Thời gian thường có (phút)', 15, 90] }).map(([key, spec]) => <label className="grid gap-1 text-sm" key={key}>{spec[0]}<input required className={fieldClass} type="number" step={key === 'weightKg' || key === 'heightCm' ? '0.1' : '1'} min={spec[1]} max={spec[2]} value={form[key]} onChange={e => change(key, e.target.value)} /></label>)}
    </div>
    {Object.entries(options).map(([key, values]) => <label className="grid gap-1 text-sm" key={key}>{{ goal: 'Mục tiêu', experience: 'Kinh nghiệm', style: 'Phong cách đồng hành', diet: 'Chế độ ăn' }[key]}<select className={fieldClass} value={form[key]} onChange={e => change(key, e.target.value)}>{values.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>)}
    <label className="grid gap-1 text-sm">Dị ứng thực phẩm (ngăn cách bằng dấu phẩy)<input className={fieldClass} value={form.allergies} onChange={e => change('allergies', e.target.value)} placeholder="Để trống nếu không có dị ứng đã biết" /></label>
    <label className="grid gap-1 text-sm">Múi giờ IANA để tính nhật ký trong ngày<input required className={fieldClass} value={form.timezone} onChange={e => change('timezone', e.target.value)} /></label>
    <div className="space-y-3 rounded-xl border border-slate-700 p-3">
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={form.needsProfessionalReview} onChange={e => change('needsProfessionalReview', e.target.checked)} />Tôi có chấn thương, triệu chứng, đang mang thai hoặc có vấn đề sức khỏe/dinh dưỡng cần chuyên gia đánh giá.</label>
      <p className="text-xs text-slate-400">Mục này được đánh dấu thận trọng từ đầu. Chỉ bỏ chọn khi không thuộc những trường hợp trên. Đây không phải kết luận y khoa.</p>
      <label className="flex gap-3 text-sm"><input required type="checkbox" checked={form.adultConfirmed} onChange={e => change('adultConfirmed', e.target.checked)} />Tôi xác nhận từ 18 tuổi.</label>
    </div>
    <div className="space-y-3 rounded-xl bg-slate-900 p-3">
      <label className="flex gap-3 text-sm"><input required type="checkbox" checked={form.consent} onChange={e => change('consent', e.target.checked)} />Tôi đồng ý lưu hồ sơ, số đo tự báo, nhật ký tập và bữa ăn. Nội dung chat được gửi cho Gemini để xử lý; tính năng này không lưu hội thoại thô trên máy chủ.</label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={form.photoConsent} onChange={e => change('photoConsent', e.target.checked)} />Tùy chọn: cho phép gửi ảnh món ăn đã nén cho Gemini. Ứng dụng không lưu ảnh gốc.</label>
      <p className="text-xs text-slate-400">Việc xử lý/lưu giữ ở nhà cung cấp tuân theo điều khoản dự án Gemini của phòng tập, không phải cam kết “không lưu” của nhà cung cấp. Vị trí sẽ được xin riêng khi tìm quán.</p>
    </div>
    <button disabled={busy} className={buttonClass}>Lưu hồ sơ đồng hành</button>
    {profile && <div className="flex flex-wrap gap-2 border-t border-slate-700 pt-4"><button type="button" disabled={busy} className={secondaryClass} onClick={onExport}>Xuất dữ liệu</button><button type="button" disabled={busy} className={secondaryClass} onClick={onDelete}>Xóa dữ liệu Companion</button></div>}
    <p className="text-xs text-slate-400">Chiều cao và cân nặng không được dùng một mình để quyết định tạ tập hoặc đặt mức thâm hụt kcal.</p>
  </form>;
}
