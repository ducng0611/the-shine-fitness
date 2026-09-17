import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix App.tsx duplicate
content = content.replace("import { Dumbbell, Calendar, Users } from 'lucide-react';\n", "", 1)
with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()
# Add openRegistration
content = content.replace("export const ContactPage = ({ lang, t }) => {", "export const ContactPage = ({ lang, t, openRegistration }) => {")
with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(content)

with open('src/pages/ServicesPage.tsx', 'r') as f:
    content = f.read()
content = content.replace("import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse } from 'lucide-react';", "import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';")
with open('src/pages/ServicesPage.tsx', 'w') as f:
    f.write(content)

with open('src/pages/ReviewsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("export const ReviewsPage = ({ lang, t, reviews, fbReviews, tiktokVideos, showAllClips, setShowAllClips, isAutoPlayEnabled, setIsAutoPlayEnabled, setSelectedVideoModal }) => {", "export const ReviewsPage = ({ lang, t, reviews, fbReviews, tiktokVideos, showAllClips, setShowAllClips, isAutoPlayEnabled, setIsAutoPlayEnabled, setSelectedVideoModal, loadingReviews, getGoogleReviewText, getGoogleReviewTime, getFacebookAuthor, getFacebookReviewText, fallbackThumbnails }) => {")
content = content.replace("import { Star, Quote, Play, ChevronDown, ChevronUp, Video } from 'lucide-react';", "import { Star, Quote, Play, ChevronDown, ChevronUp, Video, MapPin, Facebook, MessageCircle } from 'lucide-react';")

# Clean GymFloorPlan
idx = content.find('{/* 8.5')
if idx != -1:
    content = content[:idx] + "  </div>\n  );\n};\n"

with open('src/pages/ReviewsPage.tsx', 'w') as f:
    f.write(content)
