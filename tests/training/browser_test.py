"""Local Chromium UI/API smoke tests. All identities and records are SYNTHETIC."""
import json, os, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE = 'http://127.0.0.1:4173'
OUT = Path(os.environ.get('ARTIFACT_DIR', 'test-results/training-ui'))
OUT.mkdir(parents=True, exist_ok=True)

def onboard(page):
    page.request.post(BASE + '/__test/reset')
    page.goto(BASE + '/tests/training/ui.html?lang=en')
    page.locator('input[name="nickname"]').fill('SYNTHETIC PILOT MEMBER')
    page.locator('input[name="age"]').fill('25')
    page.locator('select[name="goal"]').select_option('hypertrophy')
    page.locator('select[name="experience"]').select_option('intermediate')
    page.locator('select[name="health"]').select_option('false')
    page.locator('input[name="adult"]').check()
    page.locator('input[name="consent"]').check()
    page.get_by_role('button', name='Save profile', exact=True).click()
    expect(page.get_by_label("Ask about today's training", exact=True)).to_be_visible()

def create_plan(page, start=True):
    page.get_by_label("Ask about today's training", exact=True).fill('I have 35 minutes and want to train legs')
    page.get_by_role('button', name='Understand request', exact=True).click()
    expect(page.get_by_text('I have prepared the request fields.', exact=False)).to_be_visible()
    expect(page.get_by_label('Available minutes', exact=True)).to_have_value('35')
    page.get_by_role('combobox', name='Energy (1 very low - 5 high)', exact=True).select_option('4')
    page.get_by_role('combobox', name='Do you currently have pain?', exact=True).select_option('false')
    page.get_by_label('I confirm these are my current self-reported answers', exact=False).check()
    page.get_by_role('button', name='Create my plan', exact=True).click()
    expect(page.get_by_text('Personalized general structure', exact=True)).to_be_visible()
    assert page.locator('.training-plan h4').count() == 0
    expect(page.get_by_role('button', name='Start session / open actual log', exact=True)).to_be_enabled()
    if start:
        page.get_by_role('button', name='Start session / open actual log', exact=True).click()
        expect(page.get_by_label('Actual exercise name', exact=True)).to_be_visible()

def fill_actual(page):
    page.get_by_label('Actual exercise name', exact=True).fill('SYNTHETIC member-reported activity')
    page.get_by_label('Legs', exact=True).last.check()
    page.get_by_label('Actual reps', exact=True).fill('10')
    page.get_by_label('External kg (blank = unknown; 0 = none)', exact=True).fill('0')
    page.get_by_label('Actual session minutes', exact=True).fill('25')
    page.get_by_label('I confirm that these are sets I actually completed.', exact=True).check()

with sync_playwright() as p:
    executable = os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium')
    browser = p.chromium.launch(executable_path=executable if Path(executable).exists() else None, headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280,'height':900})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    results = []
    try:
        onboard(page)
        create_plan(page)
        page.locator('.training-plan').screenshot(path=str(OUT / 'desktop-plan.png'))
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Mobile layout overflows'
        page.locator('.training-plan').screenshot(path=str(OUT / 'mobile-plan.png'))
        fill_actual(page)
        page.get_by_role('button', name='Confirm and save actual performance', exact=True).click()
        expect(page.get_by_text('Session saved. Your next plan will use the confirmed record.', exact=True)).to_be_visible()
        expect(page.locator('.training-summary strong').first).to_have_text('1')
        page.screenshot(path=str(OUT / 'mobile-history.png'), full_page=True)
        results.append({'name':'onboarding, chat prefill, general plan, actual logging and 390px layout', 'passed':True})
        onboard(page)
        create_plan(page)
        fill_actual(page)
        interrupted = [False]
        def lose_first_response(route):
            if not interrupted[0]:
                interrupted[0] = True
                route.fetch()  # The real local API commits successfully.
                route.abort('failed')  # Simulate a lost success response.
            else:
                route.continue_()
        page.route('**/api/companion/training/plans/*/complete', lose_first_response)
        page.get_by_role('button', name='Confirm and save actual performance', exact=True).click()
        expect(page.get_by_role('button', name='Retry the same completion safely', exact=True)).to_be_visible()
        page.get_by_role('button', name='Retry the same completion safely', exact=True).click()
        expect(page.get_by_text('Already saved; no duplicate was created.', exact=True)).to_be_visible()
        expect(page.locator('.training-summary strong').first).to_have_text('1')
        results.append({'name':'lost success response retried without duplicate history', 'passed':True})
        page.unroute('**/api/companion/training/plans/*/complete')
        onboard(page)
        page.get_by_role('combobox', name='Energy (1 very low - 5 high)', exact=True).select_option('4')
        page.get_by_role('combobox', name='Do you currently have pain?', exact=True).select_option('true')
        page.get_by_label('I confirm these are my current self-reported answers', exact=False).check()
        page.get_by_role('button', name='Create my plan', exact=True).click()
        expect(page.get_by_role('alert')).to_contain_text('Automatic planning is paused')
        assert page.locator('.training-plan').count() == 0
        results.append({'name':'reported pain blocks UI planning', 'passed':True})

        onboard(page)
        create_plan(page, start=False)
        start_button = page.get_by_role('button', name='Start session / open actual log', exact=True)
        page.get_by_role('combobox', name='Do you currently have pain?', exact=True).select_option('true')
        expect(start_button).to_be_disabled()
        expect(page.get_by_text('This plan is stale. Refresh and confirm readiness again.', exact=True)).to_be_visible()
        # Changing an answer back is not renewed confirmation of the old plan.
        page.get_by_role('combobox', name='Do you currently have pain?', exact=True).select_option('false')
        expect(start_button).to_be_disabled()
        page.get_by_label('I confirm these are my current self-reported answers', exact=False).check()
        page.get_by_role('button', name='Create my plan', exact=True).click()
        expect(start_button).to_be_enabled()
        results.append({'name':'readiness edits block stale start until explicit replanning', 'passed':True})

        onboard(page)
        create_plan(page, start=False)
        page.get_by_label("Ask about today's training", exact=True).fill('Toi bi dau lung')
        page.get_by_role('button', name='Understand request', exact=True).click()
        expect(page.get_by_role('alert')).to_contain_text('Automatic planning is paused')
        expect(page.get_by_role('button', name='Start session / open actual log', exact=True)).to_be_disabled()
        expect(page.get_by_role('combobox', name='Do you currently have pain?', exact=True)).to_have_value('')
        expect(page.get_by_label('I confirm these are my current self-reported answers', exact=False)).not_to_be_checked()
        page.reload()
        expect(page.get_by_role('button', name='Start session / open actual log', exact=True)).to_be_disabled()
        page.screenshot(path=str(OUT / 'safety-stale-plan.png'), full_page=True)
        results.append({'name':'safety chat invalidation survives reload without fabricating a pain answer', 'passed':True})

        onboard(page)
        create_plan(page, start=False)
        def lose_safety_response(route):
            route.fetch()  # Commit server-side readiness invalidation.
            route.abort('failed')
        page.route('**/api/companion/training/chat', lose_safety_response)
        page.get_by_label("Ask about today's training", exact=True).fill('Toi bi dau lung')
        page.get_by_role('button', name='Understand request', exact=True).click()
        expect(page.get_by_role('alert')).to_contain_text('connection_uncertain')
        expect(page.get_by_role('button', name='Start session / open actual log', exact=True)).to_be_disabled()
        page.unroute('**/api/companion/training/chat')
        page.reload()
        expect(page.get_by_role('button', name='Start session / open actual log', exact=True)).to_be_disabled()
        results.append({'name':'lost safety response cannot leave old start enabled', 'passed':True})

        assert not errors, errors
        print(json.dumps({'results':results, 'pageErrors':errors}, indent=2))
        (OUT/'result.json').write_text(json.dumps({'results':results,'pageErrors':errors},indent=2))
    except Exception:
        page.screenshot(path=str(OUT/'failure.png'), full_page=True)
        (OUT/'errors.json').write_text(json.dumps({'pageErrors':errors, 'results':results, 'exception':traceback.format_exc()}, indent=2))
        (OUT/'failure.html').write_text(page.content())
        raise
    finally:
        browser.close()
