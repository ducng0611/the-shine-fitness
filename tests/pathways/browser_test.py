"""Synthetic source values only; never read user uploads in CI."""
import json, os, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
base='http://127.0.0.1:4174'
out=Path('test-results/pathway-ui');out.mkdir(parents=True,exist_ok=True)
bundle={'schemaVersion':1,'kind':'private_pathway_source','usage':'source_review_only','privacy':{'directIdentifiersRemoved':True,'containsHealthData':True},
'sources':[{'id':'synthetic-source','kind':'workout_log','subjectGroup':'unlinked-subject','subjectAssociation':'unconfirmed','goal':'not_stated','goalBasis':'not_stated'}],
'observations':[{'id':'synthetic-row','sourceId':'synthetic-source','locator':'Synthetic page / row','section':'RESISTANCE EXERCISE','group':'Synthetic session','rowLabel':'SYNTHETIC ACTIVITY','duplicateGroup':None,'fields':[{'label':'Volume','raw':'2x8','reading':'clear','unit':None},{'label':'Load','raw':'-','reading':'dash','unit':None}]}],
'issues':[{'id':'source-link','sourceIds':['synthetic-source'],'code':'association_unknown','detail':'Synthetic subject association has not been verified.','severity':'blocker','status':'open','resolution':None}]}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 results=[]
 try:
  page.goto(base+'/tests/pathways/ui.html');expect(page.get_by_role('dialog')).to_be_visible()
  page.get_by_label('Source JSON',exact=True).fill(json.dumps(bundle))
  page.get_by_role('button',name='Validate preview (no write)',exact=True).click()
  expect(page.get_by_text('Preview validated. Nothing has been saved.',exact=True)).to_be_visible()
  assert page.request.get(base+'/__test/state').json()['count']==0
  expect(page.get_by_role('button',name='Mark transcription reviewed',exact=True)).to_be_disabled()
  page.get_by_label('I am authorized to process this source',exact=False).check()
  interrupted=[False]
  def lose_response(route):
   if not interrupted[0]: interrupted[0]=True;route.fetch();route.abort('failed')
   else:route.continue_()
  page.route('**/api/admin/pathway-intake/cases/*',lose_response)
  page.get_by_role('button',name='Save private draft',exact=True).click()
  expect(page.get_by_role('alert')).to_contain_text('connection_uncertain')
  page.get_by_role('button',name='Save private draft',exact=True).click()
  expect(page.get_by_text('Already saved. No duplicate was created.',exact=True)).to_be_visible()
  assert page.request.get(base+'/__test/state').json()['count']==1
  page.unroute('**/api/admin/pathway-intake/cases/*')
  results.append({'name':'preview no write, explicit privacy consent, lost-response retry no duplicates','passed':True})
  expect(page.get_by_text('Planner eligibility: NO',exact=True)).to_be_visible()
  expect(page.get_by_role('button',name='Mark transcription reviewed',exact=True)).to_be_disabled()
  results.append({'name':'unlinked source cannot be approved or used as a prescription','passed':True})
  page.screenshot(path=str(out/'desktop.png'))
  page.set_viewport_size({'width':390,'height':844})
  assert page.evaluate('document.querySelector("dialog").scrollWidth <= document.querySelector("dialog").clientWidth + 2')
  page.screenshot(path=str(out/'mobile.png'))
  results.append({'name':'responsive modal at 390px','passed':True})
  page.get_by_label('Source JSON',exact=True).fill('{invalid')
  page.get_by_role('button',name='Validate preview (no write)',exact=True).click()
  expect(page.get_by_role('alert')).to_be_visible()
  assert page.get_by_role('button',name='Save private draft',exact=True).count()==0
  results.append({'name':'edited/invalid JSON cannot reuse a stale preview','passed':True})
  page.get_by_role('button',name='Close pathway intake',exact=True).click()
  expect(page.get_by_role('dialog')).not_to_be_visible()
  assert not errors,errors
  (out/'result.json').write_text(json.dumps({'results':results,'pageErrors':errors},indent=2));print(json.dumps(results))
 except Exception:
  page.screenshot(path=str(out/'failure.png'));(out/'failure.txt').write_text(traceback.format_exc());raise
 finally:browser.close()
