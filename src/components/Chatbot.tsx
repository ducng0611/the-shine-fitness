import React, { lazy, Suspense } from 'react';
import LegacyChatbot from './ChatbotLegacy';
export * from './ChatbotLegacy';
const BuddyChat = lazy(() => import('./buddy/BuddyChat'));
const MemberGateway = lazy(() => import('./companion/ChatbotGateway'));

/** Default-off rollout. The original component is preserved byte-for-byte for rollback.
 *  With the member assistant on, guests keep the public service chatbot and signed-in
 *  members get one assistant (Companion tools + AI Gym Buddy Q&A). */
export default function Chatbot(props: React.ComponentProps<typeof LegacyChatbot>) {
  if (import.meta.env.VITE_SHINE_COMPANION_ENABLED === 'true') return <Suspense fallback={null}><MemberGateway {...props} /></Suspense>;
  if (import.meta.env.VITE_SHINE_CHAT_ENABLED !== 'true') return <LegacyChatbot {...props} />;
  return <Suspense fallback={null}><BuddyChat {...props} /></Suspense>;
}
