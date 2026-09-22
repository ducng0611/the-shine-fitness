import React, { lazy, Suspense } from 'react';
import LegacyChatbot from './ChatbotLegacy';
export * from './ChatbotLegacy';
const BuddyChat = lazy(() => import('./buddy/BuddyChat'));

/** Default-off rollout. The original component is preserved byte-for-byte for rollback. */
export default function Chatbot(props: React.ComponentProps<typeof LegacyChatbot>) {
  if (import.meta.env.VITE_SHINE_CHAT_ENABLED !== 'true') return <LegacyChatbot {...props} />;
  return <Suspense fallback={null}><BuddyChat {...props} /></Suspense>;
}
