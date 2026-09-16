const fs = require('fs');

// 1. Update translations.ts
let trans = fs.readFileSync('src/translations.ts', 'utf8');
trans = trans.replace(
  "notesPlaceholder: 'Ví dụ: Tôi muốn hỏi thêm về lớp Yoga sáng, hoặc có người hướng dẫn...',",
  "notesPlaceholder: 'Ví dụ: Cần tư vấn Yoga, PT kèm riêng...',"
);
trans = trans.replace(
  "notesPlaceholder: 'e.g. I want to ask about morning Yoga or personal trainer availability...',",
  "notesPlaceholder: 'e.g. Need morning Yoga info, PT requests...',"
);
fs.writeFileSync('src/translations.ts', trans);
console.log('translations.ts patched.');

// 2. Update RegistrationModal.tsx
let modal = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

// Change max-w-xl to max-w-2xl
modal = modal.replace('max-w-xl max-h-[95vh]', 'max-w-2xl max-h-[95vh]');

// Change textarea to input
const textareaTarget = `<textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.notesPlaceholder}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors resize-none"
              />`;
const inputReplacement = `<input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.notesPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
              />`;
modal = modal.replace(textareaTarget, inputReplacement);
fs.writeFileSync('src/components/RegistrationModal.tsx', modal);
console.log('RegistrationModal.tsx patched.');

