import React, { useState } from 'react';
import { type Data, companionApi as api, fieldClass, buttonClass, secondaryClass } from './client';

/** Admin only. Paste the file exported from the Local Pilot (npm run local:export-members).
 *  "Kiểm tra" writes nothing; "Nhập" creates virtual sign-in accounts and saves the records. */
export default function MemberImportPanel() {
  const [documentText, setDocumentText] = useState(''), [emailBase, setEmailBase] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [result, setResult] = useState<Data | null>(null);
  const run = async (apply: boolean) => {
    if (apply && !window.confirm('Tạo tài khoản đăng nhập và lưu hồ sơ khách lên hệ thống? Mật khẩu mới chỉ hiện MỘT lần sau bước này.')) return;
    setBusy(true); setError(''); setResult(null);
    try { setResult(await api('/admin/member-sources/import', { document: JSON.parse(documentText), emailBase: emailBase.trim(), apply })); }
    catch (e) { setError(e instanceof SyntaxError ? 'Nội dung dán vào không phải JSON hợp lệ.' : e instanceof Error ? e.message : 'Không hoàn tất được.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-2xl border border-slate-700 p-3">
    <h3 className="text-lg font-bold">Nạp hồ sơ khách đã thu thập</h3>
    <p className="text-sm text-slate-300">Dán nội dung file xuất từ Local Pilot. Mỗi khách được tạo một tài khoản đăng nhập dạng <code>hopthu+kh-ma@gmail.com</code>: thư gửi tới đều về hộp thư gốc bên dưới.</p>
    <label className="grid gap-1 text-sm">Hộp thư gốc (của phòng tập)<input className={fieldClass} value={emailBase} onChange={e => setEmailBase(e.target.value)} placeholder="theshinefitness.cskh@gmail.com" /></label>
    <textarea className={fieldClass + ' h-48 font-mono text-xs'} aria-label="Nội dung file hồ sơ khách" spellCheck={false} value={documentText} onChange={e => setDocumentText(e.target.value)} />
    <div className="flex flex-wrap gap-2">
      <button className={secondaryClass} disabled={busy || !documentText || !emailBase} onClick={() => void run(false)}>Kiểm tra (chưa ghi)</button>
      <button className={buttonClass} disabled={busy || !documentText || !emailBase} onClick={() => void run(true)}>Nhập vào hệ thống</button>
    </div>
    {busy && <p role="status" className="text-sm text-orange-300">Đang xử lý…</p>}
    {error && <p role="alert" className="rounded-xl border border-red-500/60 p-3 text-sm text-red-200">{error}</p>}
    {result && <div className="space-y-2 text-sm">
      <p>{({ dry_run: 'Kiểm tra xong, chưa ghi gì.', imported: 'Đã nhập vào hệ thống.', unchanged: 'Không có gì thay đổi so với lần nhập trước.' } as Data)[result.status] ?? result.status} Phiên bản: {result.revision}.</p>
      {result.status === 'imported' && <p className="rounded-xl border border-amber-500/60 p-2 text-amber-200">Chép lại mật khẩu ngay bây giờ: hệ thống không lưu và sẽ không hiện lại.</p>}
      <table className="w-full text-left text-xs"><thead><tr><th>Khách</th><th>Email đăng nhập</th><th>Tài khoản</th><th>Mật khẩu</th></tr></thead>
        <tbody>{result.accounts.map((a: Data) => <tr key={a.uid} className="border-t border-slate-700"><td>{a.label}</td><td className="break-all">{a.email}</td><td>{a.account === 'create' ? 'Tạo mới' : 'Đã có'}</td><td className="font-mono">{a.password ?? '—'}</td></tr>)}</tbody></table>
    </div>}
  </section>;
}
