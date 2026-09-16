const fs = require('fs');
let code = fs.readFileSync('src/components/Chatbot.tsx', 'utf8');

const target = `export default function Chatbot({ lang = 'vi', currentUser, onOpenTrialModal }: ChatbotProps) {
  const t = translations[lang].chatbot;
  const [isOpen, setIsOpen] = useState(false);`;

const replacement = `export default function Chatbot({ lang = 'vi', currentUser, onOpenTrialModal }: ChatbotProps) {
  const t = translations[lang].chatbot;
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open chatbot after 1.5s to suggest helping the customer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Chatbot.tsx', code);
console.log('Chatbot auto-open patched.');
