"""Production-built local UI + real password auth/SQLite. Data file stays outside Git."""
import os, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.getenv('SHINE_LOCAL_TEST_ORIGIN','http://127.0.0.1:4176')
ACCOUNTS=json.loads(Path(os.environ['SHINE_LOCAL_ACCOUNTS']).read_text())['accounts']
PASSWORD=os.environ['SHINE_LOCAL_QA_PASSWORD']
OUT=Path(os.getenv('SHINE_LOCAL_TEST_OUT','test-results/local/browser'));OUT.mkdir(parents=True,exist_ok=True)
results=[]
def login(page,account):
    page.get_by_label('Email',exact=True).fill(account['email'])
    page.locator('input[type=password]').fill(PASSWORD)
    page.locator('button.local-primary').click()
    expect(page.locator('.local-account h2')).to_have_text(account['label'])
def ask(page,text):
    page.locator('.buddy-compose textarea').fill(text)
    page.locator('.buddy-compose button[type=submit]').click()
    expect(page.locator('.buddy-message.assistant').last).not_to_contain_text('Responding')
    page.wait_for_function("!document.querySelector('.buddy-compose button[type=button]')")
    return page.locator('.buddy-message.assistant').last.inner_text()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1280,'height':900});page=ctx.new_page();errors=[];external=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    ctx.on('request',lambda r:external.append(r.url) if not r.url.startswith(BASE) and not r.url.startswith('data:') else None)
    try:
        page.goto(BASE)
        expect(page.locator('.buddy-panel')).to_be_visible()
        text=ask(page,'Protein l\u00e0 g\u00ec?')
        assert 'Protein' in text or 'protein' in text
        page.screenshot(path=str(OUT/'desktop-local.png'),full_page=True)
        results.append({'name':'Guest education with built UI, no Firebase', 'passed':True})
        for account in ACCOUNTS:
            login(page,account)
            text=ask(page,'TDEE kh\u00e1c BMR th\u1ebf n\u00e0o?')
            assert 'BMR' in text and 'TDEE' in text
            page.get_by_role('button',name='H\u1ed3 s\u01a1 v\u00e0 l\u1ecbch s\u1eed QA',exact=True).click()
            expect(page.locator('.local-source h2')).to_have_text(account['label'])
            assert page.locator('.local-source').inner_text()
            page.get_by_role('button',name='\u0110\u0103ng xu\u1ea5t',exact=True).click()
            expect(page.locator('input[type=password]')).to_be_visible()
            expect(page.locator('.buddy-message.assistant')).to_have_count(0)
        results.append({'name':'All provisioned accounts login, own source view and logout clearing', 'passed':True,'accounts':len(ACCOUNTS)})
        page.set_viewport_size({'width':390,'height':844})
        expect(page.locator('.buddy-panel')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        ask(page,'Protein l\u00e0 g\u00ec?')
        page.screenshot(path=str(OUT/'mobile-local.png'),full_page=True)
        results.append({'name':'390px responsive layout and guest chat', 'passed':True})
        login(page,ACCOUNTS[0]);page.reload()
        expect(page.locator('.local-account h2')).to_have_text(ACCOUNTS[0]['label'])
        expect(page.locator('.buddy-message.assistant')).to_have_count(0)
        assert page.evaluate('localStorage.length')==0
        results.append({'name':'Cookie login persists on reload without transcript in localStorage', 'passed':True})
        # Hold a real response; then change account in another tab before delivery.
        held=[]
        def hold(route):
            response=route.fetch()
            held.append((route,response))
        page.route('**/api/local/buddy/chat/stream',hold)
        page.locator('.buddy-compose textarea').fill('T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i')
        page.locator('.buddy-compose button[type=submit]').click()
        page.wait_for_timeout(500)
        assert held
        other=ctx.new_page();other.goto(BASE)
        expect(other.locator('.local-account h2')).to_have_text(ACCOUNTS[0]['label'])
        other.get_by_role('button',name='\u0110\u0103ng xu\u1ea5t',exact=True).click()
        expect(page.locator('input[type=password]')).to_be_visible()
        login(other,ACCOUNTS[1]);expect(page.locator('.local-account h2')).to_have_text(ACCOUNTS[1]['label'])
        for route,response in held:
            try:route.fulfill(response=response)
            except Exception:pass # expected when the old account request was already aborted
        page.wait_for_timeout(250)
        expect(page.locator('.buddy-message.assistant')).to_have_count(0)
        page.unroute('**/api/local/buddy/chat/stream')
        results.append({'name':'Cross-tab logout/login aborts a delayed previous-account response', 'passed':True})
        other.get_by_role('button',name='\u0110\u0103ng xu\u1ea5t',exact=True).click()
        assert not external,external
        assert not errors,errors
        results.append({'name':'No external/Firebase network request and no page errors', 'passed':True})
        (OUT/'result.json').write_text(json.dumps({'results':results,'pageErrors':errors,'externalRequests':external,'realLocalAuth':True},indent=2))
        print(json.dumps({'passed':len(results),'pageErrors':errors,'externalRequests':external}))
    except Exception:
        page.screenshot(path=str(OUT/'failure.PRIVATE.png'),full_page=True)
        (OUT/'failure.PRIVATE.html').write_text(page.content())
        raise
    finally:browser.close()
