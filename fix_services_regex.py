import re

with open('src/pages/ServicesPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"import \{.*?\} from 'lucide-react';", "import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';", content)

with open('src/pages/ServicesPage.tsx', 'w') as f:
    f.write(content)
