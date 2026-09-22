"""Chromium/React/API integration; all accounts and model streams are SYNTHETIC."""
import json, os, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE='http://127.0.0.1:4175'
OUT=Path(os.environ.get('ARTIFACT_DIR','test-results/buddy-browser'))
OUT.mkdir(parents=True,exist_ok=True)

def ask(page,text):
    page.get_by_label('Câu hỏi cho AI Gym Buddy',exact=True).fill(text)
    page.get_by_role('button',name='Gửi',exact=True).click()

def new_chat(page):
    page.get_by_role('button',name='Cuộc trò chuyện mới',exact=True).click()
    expect(page.locator('.buddy-welcome')).to_be_visible()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':920})
    errors=[];results=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.goto(BASE+'/tests/buddy/ui.html')
        ask(page,'Protein là gì?')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('Protein là chất đạm')
        expect(page.get_by_role('button',name='Gửi',exact=True)).to_be_visible()
        page.get_by_text('Nguồn được sử dụng',exact=True).click()
        expect(page.locator('.buddy-sources a')).to_have_attribute('href','https://medlineplus.gov/dietaryproteins.html')
        assert not page.evaluate('Object.keys(localStorage).some(k => k.includes("chat") || k.includes("buddy"))')
        page.screenshot(path=str(OUT/'desktop-education.png'),full_page=True)
        results.append({'name':'guest education, actual source link and no stored browser transcript','passed':True})

        new_chat(page)
        ask(page,'Tiểu đường type 2 là gì?')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('Đái tháo đường type 2')
        ask(page,'Tôi bị tiểu đường, hãy kê thực đơn giảm mỡ')
        expect(page.locator('.buddy-message.assistant').last).to_contain_text('chuyên gia y tế')
        expect(page.locator('.buddy-message.assistant').last).not_to_contain_text('1450')
        ask(page,'Protein là gì?')
        expect(page.locator('.buddy-message.assistant').last).to_contain_text('Protein là chất đạm')
        results.append({'name':'concept versus personal clinical request, then education remains useful','passed':True})

        page.get_by_role('button',name='Account A',exact=True).click()
        expect(page.locator('.buddy-welcome')).to_be_visible()
        ask(page,'Tôi muốn xem hồ sơ của tôi')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('hypertrophy')
        page.get_by_role('button',name='Account B',exact=True).click()
        expect(page.locator('.buddy-welcome')).to_be_visible()
        expect(page.locator('.buddy-panel')).not_to_contain_text('hypertrophy')
        ask(page,'Tôi muốn xem hồ sơ của tôi')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('mobility')
        page.get_by_role('button',name='Guest / Logout',exact=True).click()
        expect(page.locator('.buddy-welcome')).to_be_visible()
        ask(page,'Tôi đã tập gì tuần này?')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('đăng nhập Firebase thật')
        results.append({'name':'A to B to guest clears private UI and enforces context permissions','passed':True})

        new_chat(page)
        ask(page,'Giải thích phối hợp vận động gym')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('phần đầu')
        page.get_by_role('button',name='Account A',exact=True).click()
        expect(page.locator('.buddy-welcome')).to_be_visible()
        page.wait_for_timeout(2100)
        expect(page.locator('.buddy-panel')).not_to_contain_text('phần cuối')
        assert page.request.get(BASE+'/__test/status').json()['aborted']>=1
        results.append({'name':'account switch aborts an active stream; no stale final response','passed':True})

        ask(page,'Giải thích phối hợp vận động gym')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('phần đầu')
        new_chat(page)
        page.wait_for_timeout(2100)
        expect(page.locator('.buddy-panel')).not_to_contain_text('phần cuối')
        ask(page,'Protein là gì?')
        expect(page.locator('.buddy-message.assistant')).to_contain_text('Protein là chất đạm')
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        assert page.locator('.buddy-panel').evaluate('(e)=>e.scrollWidth <= e.clientWidth')
        page.screenshot(path=str(OUT/'mobile-education.png'),full_page=True)
        results.append({'name':'reset cancels stream and responsive 390px layout has no overflow','passed':True})

        page.reload()
        expect(page.locator('.buddy-welcome')).to_be_visible()
        expect(page.locator('.buddy-panel')).not_to_contain_text('hypertrophy')
        expect(page.locator('.buddy-panel')).not_to_contain_text('Protein là chất đạm')
        results.append({'name':'reload does not silently restore previous personal conversation','passed':True})
        assert not errors,errors
        report={'flows':results,'pageErrors':errors,'provider':'synthetic streamed sentences, no live Gemini','auth':'synthetic verifier; not Firebase sign-in UI'}
        (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception:
        page.screenshot(path=str(OUT/'failure.png'),full_page=True)
        (OUT/'failure.html').write_text(page.content())
        (OUT/'failure.json').write_text(json.dumps({'results':results,'errors':errors,'exception':traceback.format_exc()},ensure_ascii=False,indent=2))
        raise
    finally:
        browser.close()
