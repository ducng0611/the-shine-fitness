const fs = require('fs');
let code = fs.readFileSync('src/components/Chatbot.tsx', 'utf8');

const stateInitTarget = `  const [messages, setMessages] = useState<Message[]>(() => [
    { 
      id: 'initial', 
      role: 'model', 
      text: getPersonalizedGreeting(lang, currentUser)
    }
  ]);`;

const stateInitReplacement = `  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('shine_chatbot_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading chatbot messages from localStorage', e);
    }
    return [
      { 
        id: 'initial', 
        role: 'model', 
        text: getPersonalizedGreeting(lang, currentUser)
      }
    ];
  });

  // Persist the last 3 messages to localStorage
  useEffect(() => {
    try {
      const messagesToSave = messages.slice(-3);
      localStorage.setItem('shine_chatbot_messages', JSON.stringify(messagesToSave));
    } catch (e) {
      console.error('Error saving chatbot messages to localStorage', e);
    }
  }, [messages]);`;

if (code.includes(stateInitTarget)) {
  code = code.replace(stateInitTarget, stateInitReplacement);
  fs.writeFileSync('src/components/Chatbot.tsx', code);
  console.log('Chatbot.tsx patched for persistence.');
} else {
  console.log('Could not find stateInitTarget in Chatbot.tsx');
}

