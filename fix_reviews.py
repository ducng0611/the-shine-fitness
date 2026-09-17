import re

with open('src/pages/ReviewsPage.tsx', 'r') as f:
    content = f.read()

# I need to remove the GymFloorPlan component from ReviewsPage if it's there
idx = content.find('{/* 8.5 FITNESS')
if idx != -1:
    proper_end = """
    </div>
  );
};
"""
    new_content = content[:idx] + proper_end
    with open('src/pages/ReviewsPage.tsx', 'w') as f:
        f.write(new_content)

# And add the necessary imports
if "import { ChevronDown" not in content:
    with open('src/pages/ReviewsPage.tsx', 'r') as f:
        content = f.read()
    content = content.replace("import { Star, Quote, Play } from 'lucide-react';", "import { Star, Quote, Play, ChevronDown, ChevronUp, Video } from 'lucide-react';")
    with open('src/pages/ReviewsPage.tsx', 'w') as f:
        f.write(content)

