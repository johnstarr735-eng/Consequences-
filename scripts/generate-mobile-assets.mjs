import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

// Compile the existing code-native brand mark into platform-required sizes.
const mark='<path d="M7 26C7 15 16 8 27 8M13 32c0-11 9-18 20-18M7 26c11 0 20-7 20-18M13 32c11 0 20-7 20-18" fill="none" stroke="#ccb181" stroke-width="1.5"/><circle cx="20" cy="20" r="2" fill="#ccb181"/>';
const icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#111b18"/>${mark}</svg>`;
const splash=`<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="#111b18"/><g transform="translate(1166 1166) scale(10)">${mark}</g></svg>`;
await mkdir('mobile/assets',{recursive:true});
await writeFile('mobile/assets/app-icon.svg',icon+'\n');
for(const size of [192,512])await sharp(Buffer.from(icon)).resize(size,size).removeAlpha().png().toFile(`public/icon-${size}.png`);
await sharp(Buffer.from(icon)).resize(180,180).removeAlpha().png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icon)).resize(1024,1024).removeAlpha().png().toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
await sharp(Buffer.from(splash)).png().toFile('ios/App/App/Assets.xcassets/Splash.imageset/splash.png');
await writeFile('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json',JSON.stringify({images:[{idiom:'universal',filename:'splash.png','scale':'1x'}],info:{author:'xcode',version:1}},null,2)+'\n');
for(const [density,size] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
  for(const name of ['ic_launcher','ic_launcher_round'])await sharp(Buffer.from(icon)).resize(size,size).removeAlpha().png().toFile(`android/app/src/main/res/mipmap-${density}/${name}.png`);
}
const foreground=`<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><group android:translateX="22" android:translateY="22" android:scaleX="1.6" android:scaleY="1.6"><path android:pathData="M7,26C7,15 16,8 27,8M13,32c0,-11 9,-18 20,-18M7,26c11,0 20,-7 20,-18M13,32c11,0 20,-7 20,-18" android:strokeColor="#ccb181" android:strokeWidth="1.5" android:fillColor="#00000000"/><path android:pathData="M22,20a2,2 0,1 1,-4,0a2,2 0,1 1,4,0" android:fillColor="#ccb181"/></group></vector>`;
await writeFile('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml',foreground+'\n');
await writeFile('android/app/src/main/res/drawable/ic_launcher_background.xml','<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#111b18"/></shape>\n');
await writeFile('android/app/src/main/res/values/ic_launcher_background.xml','<resources><color name="ic_launcher_background">#111b18</color></resources>\n');
for(const file of ['ic_launcher.xml','ic_launcher_round.xml'])await writeFile(`android/app/src/main/res/mipmap-anydpi-v26/${file}`,'<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@drawable/ic_launcher_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>\n');
console.log('Compiled the Consequences mark for Apple touch, iOS and Android.');
