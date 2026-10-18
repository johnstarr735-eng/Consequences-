import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read=file=>readFile(file,'utf8');
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const config=JSON.parse(await read('android/app/src/main/assets/capacitor.config.json'));
assert.equal(config.webDir,'mobile-dist');
assert.equal(config.appName,'Consequences');
assert(!config.server?.url&&!config.server?.allowNavigation,'A production app must bundle its own interface.');
const html=await read('mobile-dist/index.html');
assert(html.includes('viewport-fit=cover'));
assert(html.includes('connect-src \'self\''),'Practice must not upload local world graphs.');
for(const destination of ['android/app/src/main/assets/public','ios/App/App/public']){
  assert.equal(await hash(`${destination}/index.html`),await hash('mobile-dist/index.html'),`${destination} needs cap sync`);
  for(const name of await readdir('mobile-dist/assets'))assert.equal(await hash(`${destination}/assets/${name}`),await hash(`mobile-dist/assets/${name}`));
}
for(const name of await readdir('mobile-dist/assets'))if(name.endsWith('.js')){
  const text=await read(`mobile-dist/assets/${name}`);
  for(const forbidden of ['OPENAI_API_KEY','OAI-Sites-Authorization','siwc_bypass_bearer_token','api.openai.com'])assert(!text.includes(forbidden),`${forbidden} must never enter native assets`);
}
const pbx=await read('ios/App/App.xcodeproj/project.pbxproj'),privacy=await read('ios/App/App/PrivacyInfo.xcprivacy');
assert(pbx.includes('PrivacyInfo.xcprivacy in Resources'));
assert(pbx.includes('IPHONEOS_DEPLOYMENT_TARGET = 16.4;'));
assert(privacy.includes('NSPrivacyAccessedAPICategoryUserDefaults')&&privacy.includes('CA92.1'));
const android=await read('android/app/src/main/AndroidManifest.xml');
assert(android.includes('android:allowBackup="false"'));
assert(android.includes('android:scheme="consequences-alpha"'));
console.log('Mobile assets are bundled, synchronized and contain no provider or Site service credentials.');
console.log('Native compilation, installation, signing and phone interaction are separate checks; this command does not verify them.');
