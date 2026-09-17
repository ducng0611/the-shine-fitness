import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("element={<ReviewsPage lang={lang} t={t} reviews={reviews} fbReviews={fbReviews} tiktokVideos={tiktokVideos} showAllClips={showAllClips} setShowAllClips={setShowAllClips} isAutoPlayEnabled={isAutoPlayEnabled} setIsAutoPlayEnabled={setIsAutoPlayEnabled} setSelectedVideoModal={setSelectedVideoModal} />}", 
"element={<ReviewsPage lang={lang} t={t} reviews={reviews} fbReviews={fbReviews} tiktokVideos={tiktokVideos} showAllClips={showAllClips} setShowAllClips={setShowAllClips} isAutoPlayEnabled={isAutoPlayEnabled} setIsAutoPlayEnabled={setIsAutoPlayEnabled} setSelectedVideoModal={setSelectedVideoModal} loadingReviews={loadingReviews} getGoogleReviewText={getGoogleReviewText} getGoogleReviewTime={getGoogleReviewTime} getFacebookAuthor={getFacebookAuthor} getFacebookReviewText={getFacebookReviewText} fallbackThumbnails={fallbackThumbnails} />}")

with open('src/App.tsx', 'w') as f:
    f.write(content)

