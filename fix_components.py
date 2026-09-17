import os
import re

# Let's fix ServicesPage.tsx
with open('src/pages/ServicesPage.tsx', 'r') as f:
    services = f.read()
if "import { ArrowRight, CheckCircle2" not in services:
    services = services.replace("import { Dumbbell", "import { Dumbbell, ArrowRight, CheckCircle2, Flame ")
with open('src/pages/ServicesPage.tsx', 'w') as f:
    f.write(services)

# Let's fix SpecialsPage.tsx
with open('src/pages/SpecialsPage.tsx', 'r') as f:
    specials = f.read()
if "import { Flame" not in specials:
    specials = specials.replace("import { Gift }", "import { Gift, Flame, ArrowRight, CheckCircle2, ChevronDown }")
with open('src/pages/SpecialsPage.tsx', 'w') as f:
    f.write(specials)

