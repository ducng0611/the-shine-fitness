import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Add onToggle to interface
content = content.replace(
    "onOpenTrialModal?: () => void;",
    "onOpenTrialModal?: () => void;\n  onToggle?: (isOpen: boolean) => void;"
)

# Add onToggle to props
content = content.replace(
    "export default function Chatbot({ lang = 'vi', currentUser, onOpenTrialModal }: ChatbotProps) {",
    "export default function Chatbot({ lang = 'vi', currentUser, onOpenTrialModal, onToggle }: ChatbotProps) {"
)

# Call onToggle when state changes. Wait, in Chatbot.tsx, it uses:
# const [isOpen, setIsOpen] = useState(false);
# I'll just patch setIsOpen everywhere or use useEffect.
# The best way is to use a useEffect watching isOpen.
use_effect_block = """
  useEffect(() => {
    if (onToggle) {
      onToggle(isOpen);
    }
  }, [isOpen, onToggle]);
"""
content = content.replace("const [isOpen, setIsOpen] = useState(false);", "const [isOpen, setIsOpen] = useState(false);\n" + use_effect_block)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
