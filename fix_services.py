with open('src/pages/ServicesPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';", "import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';")

if "import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse } from 'lucide-react';" in content:
    content = content.replace("import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse } from 'lucide-react';", "import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';")

with open('src/pages/ServicesPage.tsx', 'w') as f:
    f.write(content)
