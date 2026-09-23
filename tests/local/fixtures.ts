/** SYNTHETIC CI records only. Not the five private source cases. */
import {parseManifest} from '../../server/src/local/seed';
export const syntheticManifest=parseManifest({schemaVersion:1,qaOnly:true,batch:'synthetic-local-suite',sourcePolicy:'Synthetic test data, not client records',cases:[
  {key:'adult-a',label:'QA Synthetic A',ageAtSource:25,heightCm:170,weightKg:70,goal:'hypertrophy',requiresReview:false,programId:'prog_weight_gain_pt50',sourceStatus:'source_reference_only',sourceNotes:['Synthetic test only']},
  {key:'adult-b',label:'QA Synthetic B',ageAtSource:30,heightCm:175,weightKg:75,goal:'mobility',requiresReview:true,programId:'prog_posture_correction_pt36',sourceStatus:'source_reference_only',sourceNotes:['Synthetic review flag']},
  {key:'minor-c',label:'QA Synthetic Minor',ageAtSource:12,heightCm:150,weightKg:40,goal:'general_fitness',requiresReview:true,programId:'prog_fitness_flexibility_pt30',sourceStatus:'source_reference_only',sourceNotes:['Synthetic minor, not an adult account']}
]});
