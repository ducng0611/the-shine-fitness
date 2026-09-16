import time
import pandas as pd
import re
from playwright.sync_api import sync_playwright

MAPS_URL = "https://www.google.com/maps/place/the+shine+fitness+and+yoga/data=!4m2!3m1!1s0x317529001b03dc27:0xb330cd3c87756a6e?sa=X&ved=1t:242&hl=en&ictx=111"

def scrape_reviews(url, max_scrolls=5):
    reviews_data = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Mở giao diện để tránh bị chặn bot
        page = browser.new_page()
        page.goto(url)
        page.wait_for_timeout(4000)

        # Chuyển qua tab Đánh giá (Reviews) nếu chưa mở
        try:
            review_tab = page.get_by_role("tab", name=re.compile(r"Reviews|Đánh giá", re.I))
            review_tab.click()
            page.wait_for_timeout(2000)
        except Exception:
            pass

        # Cuộn khung danh sách đánh giá để tải thêm nội dung
        review_pane = page.locator('div[role="region"]')
        for _ in range(max_scrolls):
            page.mouse.wheel(0, 3000)
            time.sleep(2)

        # Thu thập các thẻ review
        cards = page.locator('div[data-review-id]').all()
        for card in cards:
            try:
                author = card.locator('.d4r55').inner_text()
            except Exception:
                author = "Ẩn danh"

            try:
                rating_elem = card.locator('span[aria-label*="sao"], span[aria-label*="star"]').first
                rating = rating_elem.get_attribute('aria-label')
            except Exception:
                rating = ""

            try:
                # Bấm "Xem thêm" nếu review quá dài
                more_btn = card.locator('button:has-text("Xem thêm"), button:has-text("More")')
                if more_btn.is_visible():
                    more_btn.click()
                text = card.locator('.wiI7pd').inner_text()
            except Exception:
                text = ""

            if author or text:
                reviews_data.append({
                    "author": author,
                    "rating": rating,
                    "text": text
                })

        browser.close()

    # Xuất ra file CSV
    df = pd.DataFrame(reviews_data)
    df.to_csv("google_reviews.csv", index=False, encoding="utf-8-sig")
    print(f"Đã lưu thành công {len(reviews_data)} đánh giá vào file google_reviews.csv!")

if __name__ == "__main__":
    scrape_reviews(MAPS_URL)
