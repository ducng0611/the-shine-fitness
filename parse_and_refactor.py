import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

def get_block(start_marker, end_marker):
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if start_marker in line and start_idx == -1:
            start_idx = i
        if end_marker in line and start_idx != -1 and i > start_idx:
            end_idx = i
            break
    if start_idx != -1 and end_idx != -1:
        return "".join(lines[start_idx:end_idx+1])
    return ""

def get_block_by_line(start, end):
    return "".join(lines[start-1:end])

# Create pages dir
import os
os.makedirs('src/pages', exist_ok=True)

# 1. Services Page
services_content = """import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Dumbbell, Calendar, Users, Target, Activity, HeartPulse } from 'lucide-react';
import { HealthCalculator } from '../components/HealthCalculator';

export const ServicesPage = ({ lang, t, openRegistration, isServicesLoading, icons }) => {
  return (
    <div className="pt-20">
""" + get_block_by_line(703, 750) + get_block_by_line(751, 826) + """
      <HealthCalculator lang={lang} onOpenBooking={openRegistration} />
    </div>
  );
};
"""
with open('src/pages/ServicesPage.tsx', 'w') as f:
    f.write(services_content)

# 2. Specials Page
specials_content = """import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Gift } from 'lucide-react';

export const SpecialsPage = ({ lang, t, openRegistration }) => {
  return (
    <div className="pt-20">
""" + get_block_by_line(827, 1120) + """
    </div>
  );
};
"""
with open('src/pages/SpecialsPage.tsx', 'w') as f:
    f.write(specials_content)

# 3. Reviews Page
reviews_content = """import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Star, Quote, Play } from 'lucide-react';

export const ReviewsPage = ({ lang, t, reviews, fbReviews, tiktokVideos, showAllClips, setShowAllClips, isAutoPlayEnabled, setIsAutoPlayEnabled, setSelectedVideoModal }) => {
  return (
    <div className="pt-20">
""" + get_block_by_line(1127, 1233) + get_block_by_line(1234, 1427) + """
    </div>
  );
};
"""
with open('src/pages/ReviewsPage.tsx', 'w') as f:
    f.write(reviews_content)

# 4. News Page
news_content = """import React from 'react';
import { BlogSection } from '../components/BlogSection';

export const NewsPage = ({ lang }) => {
  return (
    <div className="pt-20">
      <BlogSection lang={lang} />
    </div>
  );
};
"""
with open('src/pages/NewsPage.tsx', 'w') as f:
    f.write(news_content)

# 5. Contact Page
contact_content = """import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { MapPin, Phone, MessageCircle } from 'lucide-react';

export const ContactPage = ({ lang, t }) => {
  return (
    <div className="pt-20">
""" + get_block_by_line(1431, 1530) + """
    </div>
  );
};
"""
with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(contact_content)

