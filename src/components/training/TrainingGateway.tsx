import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import Chatbot from '../Chatbot';
import type { MemberUser } from '../AuthModal';
import type { Language } from '../../translations';
import { auth } from '../../lib/firebase';
import { TrainingWorkspace } from './TrainingWorkspace';
import { trainingCopy } from './copy';

export const trainingUiEnabled = () => import.meta.env.VITE_SHINE_TRAINING_ENABLED === 'true';
function useMatchingUid(member: MemberUser | null | undefined): string | null {
  const [firebaseUid, setFirebaseUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => onAuthStateChanged(auth, user => setFirebaseUid(user?.uid ?? null)), []);
  const selected = member?.uid || member?.id;
  return firebaseUid && selected === firebaseUid ? firebaseUid : null;
}
export function MemberTrainingTab({ member, lang = 'vi' }: { member: MemberUser; lang?: string }) {
  const uid = useMatchingUid(member), t = trainingCopy(lang);
  if (!trainingUiEnabled()) return <p>{t('training_disabled')}</p>;
  if (!uid) return <div className="shine-training training-alert" role="alert">{t('noAuth')}</div>;
  return <TrainingWorkspace key={uid} uid={uid} lang={lang} />;
}
interface GatewayProps { lang?: Language; currentUser?: MemberUser | null; onToggle?: (open: boolean) => void; onOpenTrialModal?: () => void }
export default function TrainingGateway(props: GatewayProps) {
  const uid = useMatchingUid(props.currentUser), [openForUid, setOpenForUid] = useState<string | null>(null);
  const enabled = trainingUiEnabled(), open = !!uid && uid === openForUid && enabled;
  const modal = useRef<HTMLDivElement>(null);
  const t = useMemo(() => trainingCopy(props.lang ?? 'vi'), [props.lang]);
  useEffect(() => { if (!uid) setOpenForUid(null); }, [uid]);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenForUid(null);
      if (event.key !== 'Tab' || !modal.current) return;
      const candidates = [...modal.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(el => el.offsetParent !== null);
      const first = candidates[0], last = candidates.at(-1);
      if (!first || !last) { event.preventDefault(); modal.current.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open]);
  return <>
    <Chatbot {...props} onOpenTraining={enabled && uid ? () => setOpenForUid(uid) : undefined} />
    {open && <div ref={modal} tabIndex={-1} className="training-overlay" role="dialog" aria-modal="true" aria-label={t('title')}>
      <div className="training-modal-toolbar"><button autoFocus type="button" onClick={() => setOpenForUid(null)}>{t('service')}</button><button type="button" onClick={() => setOpenForUid(null)} aria-label={t('close')}>X</button></div>
      <TrainingWorkspace key={uid} uid={uid!} lang={props.lang} />
    </div>}
  </>;
}
