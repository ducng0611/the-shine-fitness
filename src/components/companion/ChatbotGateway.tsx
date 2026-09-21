import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LegacyChatbot from '../Chatbot';
import CompanionChat from './CompanionChat';

/** Drop-in replacement: legacy props and guest experience remain intact. */
export default function ChatbotGateway(props: React.ComponentProps<typeof LegacyChatbot>) {
  const [user, setUser] = useState(auth.currentUser);
  const [services, setServices] = useState(false);
  useEffect(() => onAuthStateChanged(auth, next => { setUser(next); setServices(false); }), []);
  const enabled = import.meta.env.VITE_SHINE_COMPANION_ENABLED === 'true';
  const selectedUid = props.currentUser?.uid ?? props.currentUser?.id;
  const eligible = enabled && Boolean(user && selectedUid === user.uid);
  if (!eligible || services) return <>
    <LegacyChatbot {...props} />
    {eligible && services && <button className="fixed bottom-24 right-5 z-50 min-h-11 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-slate-950" onClick={() => setServices(false)}>Về Shine Companion</button>}
  </>;
  // An account change unmounts all previous member drafts and conversation state.
  return <CompanionChat key={user!.uid} lang={props.lang} onToggle={props.onToggle} onService={() => setServices(true)} />;
}
