import os

with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { MapPin, Phone, MessageCircle } from 'lucide-react';", "import { MapPin, Phone, MessageCircle, Clock, ExternalLink, Calendar } from 'lucide-react';")

with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(content)

with open('src/pages/SpecialsPage.tsx', 'r') as f:
    content = f.read()
if 'import { GymFloorPlan' not in content:
    content = content.replace("import { FadeIn } from '../components/FadeIn';", "import { FadeIn } from '../components/FadeIn';\nimport { GymFloorPlan } from '../components/GymFloorPlan';")
with open('src/pages/SpecialsPage.tsx', 'w') as f:
    f.write(content)

with open('src/App.tsx', 'r') as f:
    content = f.read()
if "import { Dumbbell, Calendar, Users }" not in content:
    content = "import { Dumbbell, Calendar, Users } from 'lucide-react';\n" + content

with open('src/App.tsx', 'w') as f:
    f.write(content)

