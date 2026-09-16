import time
import pandas as pd
import re
from playwright.sync_api import sync_playwright

MAPS_URL = "https://www.google.com/maps/place/the+shine+fitness+and+yoga/data=!4m2!3m1!1s0x317529001b03dc27:0xb330cd3c87756a6e?sa=X&ved=1t:242&hl=en&ictx=111"
FB_URL = "https://www.facebook.com/TheShineTanbinh.com.vn/reviews"
TIKTOK_URL = "https://www.tiktok.com/@the.shine.fitness"

def scrape_all(max_scrolls=5):
    print("Khởi động Playwright...")
    with sync_playwright() as p:
        # Bắt buộc dùng headless=False để vượt qua captcha/bot detection của FB và TikTok
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # ==========================================
        # 1. CÀO DỮ LIỆU GOOGLE MAPS
        # ==========================================
        print("Đang cào dữ liệu Google Maps...")
        google_data = []
        try:
            page.goto(MAPS_URL)
            page.wait_for_timeout(4000)

            try:
                review_tab = page.get_by_role("tab", name=re.compile(r"Reviews|Đánh giá", re.I))
                review_tab.click()
                page.wait_for_timeout(2000)
            except Exception:
                pass

            for _ in range(max_scrolls):
                page.mouse.wheel(0, 3000)
                time.sleep(2)

            cards = page.locator('div[data-review-id]').all()
            for card in cards:
                try: author = card.locator('.d4r55').inner_text()
                except: author = "Ẩn danh"
                try:
                    rating_elem = card.locator('span[aria-label*="sao"], span[aria-label*="star"]').first
                    rating = rating_elem.get_attribute('aria-label')
                except: rating = "5"
                try:
                    more_btn = card.locator('button:has-text("Xem thêm"), button:has-text("More")')
                    if more_btn.is_visible(): more_btn.click()
                    text = card.locator('.wiI7pd').inner_text()
                except: text = ""

                if author or text:
                    google_data.append({"author": author, "rating": rating, "text": text})
        except Exception as e:
            print("Lỗi Google Maps:", e)
        
        df_google = pd.DataFrame(google_data)
        df_google.to_csv("google_reviews.csv", index=False, encoding="utf-8-sig")
        print(f"-> Đã lưu {len(google_data)} đánh giá Google Maps.")

        # ==========================================
        # 2. CÀO DỮ LIỆU FACEBOOK
        # ==========================================
        print("Đang cào dữ liệu Facebook...")
        fb_data = []
        try:
            page.goto(FB_URL)
            page.wait_for_timeout(5000)
            
            for _ in range(max_scrolls):
                page.mouse.wheel(0, 4000)
                time.sleep(2)
            
            # Facebook DOM rất phức tạp và thay đổi liên tục, dùng text block chung
            fb_reviews = page.locator('div[dir="auto"]').all()
            for fb_rev in fb_reviews:
                text = fb_rev.inner_text()
                # Lọc các đoạn text dài (khả năng cao là bài post/review)
                if len(text) > 30 and "The Shine" not in text:
                    fb_data.append({"platform": "Facebook", "text": text})
        except Exception as e:
            print("Lỗi Facebook:", e)
            
        df_fb = pd.DataFrame(fb_data)
        df_fb.to_csv("facebook_data.csv", index=False, encoding="utf-8-sig")
        print(f"-> Đã lưu {len(fb_data)} nội dung Facebook.")

        # ==========================================
        # 3. CÀO DỮ LIỆU TIKTOK
        # ==========================================
        print("Đang cào dữ liệu TikTok...")
        tiktok_data = []
        try:
            page.goto(TIKTOK_URL)
            page.wait_for_timeout(5000)
            
            for _ in range(max_scrolls):
                page.mouse.wheel(0, 4000)
                time.sleep(2)
                
            links = page.locator('a[href*="/video/"]').all()
            for link in links:
                href = link.get_attribute('href')
                if href and href not in [x['url'] for x in tiktok_data]:
                    tiktok_data.append({"platform": "TikTok", "url": href})
        except Exception as e:
            print("Lỗi TikTok:", e)
            
        df_tiktok = pd.DataFrame(tiktok_data)
        df_tiktok.to_csv("tiktok_data.csv", index=False, encoding="utf-8-sig")
        print(f"-> Đã lưu {len(tiktok_data)} video TikTok.")

        browser.close()

if __name__ == "__main__":
    scrape_all()
