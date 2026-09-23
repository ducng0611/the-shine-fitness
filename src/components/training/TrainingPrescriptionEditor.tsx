import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { TRAINING_GOALS } from '../../../shared/training';
import type { ExerciseCatalogueEntry } from '../../types/companion';
import { createTrainingApi } from './api';
import { trainingCopy } from './copy';
import './training.css';

/** No default dosing is supplied: a qualified reviewer enters actual approved values. */
export function TrainingPrescriptionEditor({ exercises, onSaved }: { exercises: ExerciseCatalogueEntry[]; onSaved: () => Promise<void> }) {
  const [selected, setSelected] = useState(''), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const t = trainingCopy('vi'), ex = exercises.find(e => e.id === selected);
  const fields = [ ['sets', 'Sets', 1, 5, 1], ['repsMin', 'Minimum reps', 1, 30, 1], ['repsMax', 'Maximum reps', 1, 30, 1],
    ['restSeconds', 'Rest seconds', 15, 300, 1], ['secondsPerRep', 'Estimated seconds per rep', 1, 15, .5], ['setupSeconds', 'Setup seconds', 0, 300, 1] ] as const;
  return <details className="shine-training"><summary>{'Step 3 - \u0110\u1ecbnh l\u01b0\u1ee3ng b\u00e0i t\u1eadp do HLV duy\u1ec7t'}</summary>
    <p>{'Ch\u1ec9 nh\u1eadp sau khi b\u00e0i t\u1eadp v\u00e0 thi\u1ebft b\u1ecb \u0111\u00e3 \u0111\u01b0\u1ee3c x\u00e1c minh. \u0110\u1ed5i n\u1ed9i dung b\u00e0i t\u1eadp sau khi duy\u1ec7t s\u1ebd y\u00eau c\u1ea7u duy\u1ec7t l\u1ea1i \u0111\u1ecbnh l\u01b0\u1ee3ng. Kh\u00f4ng c\u00f3 gi\u00e1 tr\u1ecb gi\u1ea3 l\u1eadp m\u1eb7c \u0111\u1ecbnh.'}</p>
    <label>{'B\u00e0i t\u1eadp'}<select disabled={busy} value={selected} onChange={e => { setSelected(e.target.value); setStatus(''); }}><option value="">{t('select')}</option>{exercises.filter(e => !e.SAMPLE_DATA_ONLY).map(e => <option key={e.id} value={e.id}>{e.name} (rev {e.revision})</option>)}</select></label>
    {ex && <form key={`${ex.id}-${ex.revision}`} onSubmit={async event => {
      event.preventDefault(); const form = new FormData(event.currentTarget), user = auth.currentUser;
      if (!user) { setStatus(t('noAuth')); return; }
      const api = createTrainingApi(user.uid); setBusy(true); setStatus('');
      try {
        await api.request(`/admin/exercises/${ex.id}/prescription`, 'PUT', { expectedRevision: ex.revision,
          prescription: { ...Object.fromEntries(fields.map(([key]) => [key, Number(form.get(key))])), goals: form.getAll('goal') }, reviewConfirmed: form.get('review') === 'on' });
        setStatus(t('saved')); await onSaved();
      } catch (error) { setStatus(error instanceof Error ? error.message : 'Request failed'); }
      finally { api.abort(); setBusy(false); }
    }}><fieldset disabled={busy}><div className="training-grid">{fields.map(([key, label, min, max, step]) => <label key={key}>{label}<input name={key} type="number" min={min} max={max} step={step} required /></label>)}</div><fieldset><legend>{t('goal')}</legend>{TRAINING_GOALS.map(goal => <label key={goal}><input type="checkbox" name="goal" value={goal} />{t(goal)}</label>)}</fieldset><label><input type="checkbox" required name="review" />{'T\u00f4i x\u00e1c nh\u1eadn n\u1ed9i dung \u0111\u00e3 \u0111\u01b0\u1ee3c ng\u01b0\u1eddi c\u00f3 chuy\u00ean m\u00f4n ki\u1ec3m tra, kh\u00f4ng ph\u1ea3i AI t\u1ef1 duy\u1ec7t.'}</label><button>{'L\u01b0u \u0111\u1ecbnh l\u01b0\u1ee3ng \u0111\u00e3 duy\u1ec7t'}</button></fieldset></form>}
    {status && <p role="status">{status}</p>}
  </details>;
}
