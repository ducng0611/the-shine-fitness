// Only run with node --import tsx. No private source data enters CI.
import {writeFileSync} from 'node:fs';
import {syntheticManifest} from '../../tests/local/fixtures.ts';
if(!process.argv[2])throw new Error('Destination required');
writeFileSync(process.argv[2],JSON.stringify(syntheticManifest),{mode:0o600,flag:'wx'});
