import React, { useState } from 'react';
import { type Data, companionApi, fieldClass, buttonClass, secondaryClass } from './client';

type Props = { draft: Data; busy: boolean; onConfirm: (body: Data) => void };
const normalize = (f: Data): Data => ({ ...f, name: f.name ?? '', searchTerm: f.searchTerm ?? '', candidates: f.candidates ?? [],
  grams: f.grams ?? '', gramsMin: f.gramsMin ?? '', gramsMax: f.gramsMax ?? '', fdcId: '', kcalPer100g: '', source: '' });
export default function MealDraft({ draft, busy, onConfirm }: Props) {
  const [foods, setFoods] = useState<Data[]>((draft.foods ?? []).map(normalize));
  const [requestId] = useState(() => crypto.randomUUID());
  const [occurredAt] = useState(() => new Date().toISOString());
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState(''), [searching, setSearching] = useState(false);
  function change(index: number, name: string, value: unknown) {
    setConfirmed(false); setFoods(items => items.map((f, i) => i === index ? { ...f, [name]: value } : f));
  }
  async function search(index: number) {
    setError(''); setSearching(true);
    try {
      const result = await companionApi(`/foods/search?q=${encodeURIComponent(foods[index].searchTerm || foods[index].name)}`);
      change(index, 'candidates', result.foods); change(index, 'fdcId', '');
      if (!result.configured) setError('Chưa cấu hình USDA. Bạn có thể nhập số liệu từ nhãn hoặc công thức đã biết.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Tìm món thất bại.'); }
    finally { setSearching(false); }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!confirmed || !foods.length) { setError('Cần ít nhất một món và xác nhận đã ăn.'); return; }
    if (foods.some(f => !String(f.name).trim() || f.grams === '' || (!f.fdcId && (f.kcalPer100g === '' || !String(f.source).trim())))) {
      setError('Mỗi món cần tên, lượng ăn và một bản ghi USDA phù hợp hoặc kcal/100 g từ nhãn/công thức. Không điền 0 khi chưa biết.'); return;
    }
    onConfirm({ confirmed: true, requestId, occurredAt, items: foods.map(f => ({ name: f.name, grams: Number(f.grams),
      gramsMin: f.gramsMin === '' ? Number(f.grams) : Number(f.gramsMin), gramsMax: f.gramsMax === '' ? Number(f.grams) : Number(f.gramsMax),
      ...(f.fdcId ? { fdcId: Number(f.fdcId) } : { kcalPer100g: Number(f.kcalPer100g), source: f.source }) })) });
  }
  return <form className="space-y-4 rounded-2xl border border-orange-400/60 p-4" onSubmit={submit}>
    <header><span className="text-xs font-bold uppercase tracking-wider text-orange-300">Nhật ký dinh dưỡng</span><h3 className="text-xl font-bold">Bản nháp · Chưa cộng kcal</h3><p className="mt-2 text-sm text-slate-300">{draft.question || 'Kiểm tra lượng thực sự đã ăn, cách nấu và nguồn dinh dưỡng trước khi lưu.'}</p></header>
    {foods.map((food, i) => <article key={i} className="space-y-3 rounded-xl bg-slate-900 p-3">
      <label className="grid gap-1 text-sm">Món ăn<input required className={fieldClass} maxLength={150} value={food.name} onChange={e => change(i, 'name', e.target.value)} /></label>
      <label className="grid gap-1 text-sm">Khẩu phần thực sự đã ăn (g)<input required className={fieldClass} type="number" min="1" max="3000" value={food.grams} onChange={e => change(i, 'grams', e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-xs">Ước lượng thấp (g)<input className={fieldClass} type="number" min="1" max="3000" value={food.gramsMin} onChange={e => change(i, 'gramsMin', e.target.value)} /></label><label className="grid gap-1 text-xs">Ước lượng cao (g)<input className={fieldClass} type="number" min="1" max="4000" value={food.gramsMax} onChange={e => change(i, 'gramsMax', e.target.value)} /></label></div>
      <p className="text-xs text-slate-400">Có cân thực phẩm: nhập cùng một khối lượng ở ba ô. Chưa cân: giữ khoảng ước lượng; đừng xem đó là số đo.</p>
      <label className="grid gap-1 text-sm">Từ khóa tra cứu (tiếng Anh, ghi rõ cooked/raw)<input className={fieldClass} value={food.searchTerm} onChange={e => change(i, 'searchTerm', e.target.value)} maxLength={150} /></label>
      <button type="button" className={secondaryClass} disabled={busy || searching} onClick={() => void search(i)}>{searching ? 'Đang tra cứu…' : 'Tìm bản ghi dinh dưỡng'}</button>
      <label className="grid gap-1 text-sm">Chọn đúng món và cách chế biến<select className={fieldClass} value={food.fdcId} onChange={e => change(i, 'fdcId', e.target.value)}><option value="">Nhập từ nhãn / công thức thay vì USDA</option>{food.candidates.map((c: Data) => <option key={c.fdcId} value={c.fdcId}>{c.description}</option>)}</select></label>
      {!food.fdcId && <><label className="grid gap-1 text-sm">kcal / 100 g theo nhãn hoặc công thức<input required className={fieldClass} type="number" min="0" max="950" value={food.kcalPer100g} onChange={e => change(i, 'kcalPer100g', e.target.value)} /></label><label className="grid gap-1 text-sm">Nguồn số liệu<input required className={fieldClass} maxLength={300} placeholder="Ví dụ: nhãn dinh dưỡng sản phẩm tôi vừa ăn" value={food.source} onChange={e => change(i, 'source', e.target.value)} /></label></>}
      <button type="button" className={secondaryClass} disabled={busy || searching} onClick={() => { setConfirmed(false); setFoods(items => items.filter((_, j) => i !== j)); }}>Bỏ món này</button>
    </article>)}
    <button type="button" className={secondaryClass} disabled={busy || searching || foods.length >= 20} onClick={() => { setConfirmed(false); setFoods(items => [...items, normalize({})]); }}>Thêm món / thành phần</button>
    <p className="text-xs text-slate-400">Ảnh không đo được chính xác khối lượng, dầu, đường hoặc phần khuất. Kết quả là ước lượng, không phải xét nghiệm. Không tự suy đoán món an toàn cho người dị ứng.</p>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Tôi đã ăn các món này và đã kiểm tra khẩu phần, nguồn số liệu.</label>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <button className={buttonClass} disabled={busy || searching || !confirmed}>Xác nhận đã ăn · Lưu nhật ký</button>
  </form>;
}
