import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<header className="relative pt-32' in line and start_idx == -1:
        start_idx = i
    if '<footer' in line and start_idx != -1:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    routes_code = """
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomePage openRegistration={openRegistration} />} />
          <Route path="/dich-vu" element={<ServicesPage lang={lang} t={t} openRegistration={openRegistration} isServicesLoading={isServicesLoading} icons={[<Dumbbell size={32} className="text-brand-orange" />, <Calendar size={32} className="text-brand-orange" />, <Users size={32} className="text-brand-orange" />]} />} />
          <Route path="/khuyen-mai" element={<SpecialsPage lang={lang} t={t} openRegistration={openRegistration} />} />
          <Route path="/khach-hang" element={<ReviewsPage lang={lang} t={t} reviews={reviews} fbReviews={fbReviews} tiktokVideos={tiktokVideos} showAllClips={showAllClips} setShowAllClips={setShowAllClips} isAutoPlayEnabled={isAutoPlayEnabled} setIsAutoPlayEnabled={setIsAutoPlayEnabled} setSelectedVideoModal={setSelectedVideoModal} />} />
          <Route path="/tin-tuc" element={<NewsPage lang={lang} />} />
          <Route path="/lien-he" element={<ContactPage lang={lang} t={t} />} />
        </Routes>
      </main>
"""
    new_lines = lines[:start_idx] + [routes_code] + lines[end_idx:]
    with open('src/App.tsx', 'w') as f:
        f.write("".join(new_lines))
    print("Replaced body with Routes!")
else:
    print("Could not find boundaries", start_idx, end_idx)

