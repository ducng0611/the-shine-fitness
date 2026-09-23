import { auth } from '../../lib/firebase';

export type Data = Record<string, any>;

/** Identity is established by Firebase, never by a UID supplied in the request body. */
export async function companionApi(path: string, body?: unknown, method?: string): Promise<Data> {
  const user = auth.currentUser;
  if (!user) throw new Error('Hãy đăng nhập bằng tài khoản Firebase thật. Mã OTP mô phỏng không mở được hồ sơ riêng.');
  const token = await user.getIdToken();
  const response = await fetch(`/api/companion/member${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90000), cache: 'no-store',
  });
  if (auth.currentUser?.uid !== user.uid) throw new Error('Tài khoản đã thay đổi. Hãy mở lại trợ lý.');
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new Error('Máy chủ không trả về dữ liệu hợp lệ. Chưa thể xác nhận thao tác.');
  const data = await response.json();
  if (auth.currentUser?.uid !== user.uid) throw new Error('Tài khoản đã thay đổi.');
  if (!response.ok) throw new Error(`${data.code ?? response.status}: ${data.error ?? 'Không hoàn tất được yêu cầu.'}`);
  return data;
}

/** Redraw on a fresh canvas: original file and EXIF/location metadata are not uploaded. */
export async function prepareFoodPhoto(file: File) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 12000000) {
    throw new Error('Chọn JPEG, PNG hoặc WebP dưới 12 MB. HEIC cần chuyển sang JPEG trước.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không chuẩn bị được ảnh.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.78).split(',')[1];
    if (data.length > 1333333) throw new Error('Ảnh sau nén vẫn quá lớn. Hãy cắt gọn vào phần món ăn.');
    return { mimeType: 'image/jpeg', data };
  } finally { bitmap.close(); }
}

export const fieldClass = 'w-full min-h-11 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400';
export const buttonClass = 'min-h-11 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryClass = 'min-h-11 rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-100 hover:border-orange-400 disabled:opacity-50';
export const groupNames: Record<string, string> = { auto: 'Gợi ý theo lịch sử', full_body: 'Toàn thân', legs: 'Chân', push: 'Ngực · vai · tay sau', pull: 'Lưng · tay trước', core: 'Cơ trung tâm' };
