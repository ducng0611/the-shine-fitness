/** Synthetic values only. Never import customer files into tests or CI. */
import type { PathwaySourceBundle } from '../../shared/pathwayIntake.ts';
export function fixture(): PathwaySourceBundle { return {
  schemaVersion:1,kind:'private_pathway_source',usage:'source_review_only',privacy:{directIdentifiersRemoved:true,containsHealthData:true},
  sources:[{id:'source-a',kind:'workout_log',subjectGroup:'subject-a',subjectAssociation:'unconfirmed',goal:'fat_loss',goalBasis:'user_batch_description'}],
  observations:[{id:'row-a',sourceId:'source-a',locator:'Synthetic page / row 1',section:'RESISTANCE EXERCISE',group:'Synthetic session',rowLabel:'Synthetic activity',duplicateGroup:null,
    fields:[{label:'Volume',raw:'3x8',reading:'clear',unit:null},{label:'Load',raw:'-',reading:'dash',unit:null},{label:'Rest',raw:null,reading:'blank',unit:null}]}],
  issues:[{id:'issue-a',sourceIds:['source-a'],code:'identity_unconfirmed',detail:'Synthetic association needs checking.',severity:'blocker',status:'open',resolution:null}]
};}
export function reviewedFixture():PathwaySourceBundle { const b=fixture();b.sources[0].subjectAssociation='human_confirmed';b.issues[0].status='resolved';b.issues[0].resolution='Synthetic human review evidence.';return b; }
