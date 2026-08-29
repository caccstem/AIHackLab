import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const pages = ['index.html','connect.html','long-table-festival.html','leadership.html','join.html','careers.html'];
const files = Object.fromEntries(await Promise.all(pages.map(async page => [page, await readFile(page,'utf8')])));
const styles = await readFile('styles.css', 'utf8');
for (const [page, html] of Object.entries(files)) {
  assert.match(html, /<title>.+<\/title>/, `${page} has a title`);
  assert.match(html, /<meta name="viewport"/, `${page} is responsive`);
  assert.match(html, /<footer/, `${page} has a footer`);
  for (const match of html.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)) {
    assert.ok(pages.includes(match[1]), `${page} links to existing page ${match[1]}`);
  }
}
assert.match(files['connect.html'], /Community &amp; Social/);
assert.match(files['connect.html'], /Sports &amp; Recreation/);
assert.match(files['connect.html'], /Youth &amp; Family/);
assert.match(files['connect.html'], /Volunteer &amp; Service/);
assert.match(files['connect.html'], /Culture &amp; Heritage/);
assert.match(files['long-table-festival.html'], /youtube\.com\/embed\/UTW7woubzBY/);
assert.match(files['join.html'], /data-demo-form/);
assert.match(files['careers.html'], /Director of Partnerships/);
assert.match(files['careers.html'], /Director of Volunteer Engagement/);
assert.doesNotMatch(files['connect.html'], /Pleasanton, California/);
assert.match(files['connect.html'], /Bay Area, California/);
assert.match(files['connect.html'], /Connect with neighbors/);
for (const asset of ['community-social.png','sports-recreation.png','youth-family.png','volunteer-service.png','culture-heritage.png']) {
  await readFile(`assets/${asset}`);
  assert.match(styles, new RegExp(asset.replace('.', '\\.')));
}
for (const page of ['connect.html','long-table-festival.html','leadership.html','join.html','careers.html']) {
  const nav = files[page].match(/<nav id="main-nav">([\s\S]*?)<\/nav>/)?.[1] ?? '';
  for (const label of ['Programs','Events','Leadership','Careers','Volunteer','CACC Home']) assert.match(nav, new RegExp(`>${label}<`), `${page} has consistent ${label} navigation`);
}
assert.match(files['connect.html'], /Christmas Parade &amp; Easter Egg Hunt/);
assert.match(files['connect.html'], /Photography Club/);
assert.match(files['connect.html'], /Join our WeChat group/);
assert.match(files['connect.html'], /assets\/wechat-invite-qr\.png/);
assert.doesNotMatch(files['connect.html'], /Find your people\. Find your place\./);
assert.doesNotMatch(files['connect.html'], /demo-qr/);
assert.equal((files['index.html'].match(/class="title-line"/g) ?? []).length, 2);
await readFile('assets/wechat-invite-qr.png');
assert.doesNotMatch(files['connect.html'], /<h4>Christmas Parade<\/h4>|<h4>Easter Egg Hunt<\/h4>/);
const uniqueCardAssets = [
  'community-social.png','holiday-parade-hunt.png','photography-club.png',
  'sports-recreation.png','soccer-basketball.png','community-hikes.png',
  'book-club.png','youth-family.png','lake-tahoe-camping.png',
  'volunteer-service.png','youth-service.png','city-volunteer.png',
  'chinese-new-year-gala.png','mid-autumn-bbq.png','culture-heritage.png'
];
assert.equal(new Set(uniqueCardAssets).size, 15);
for (const asset of uniqueCardAssets) {
  await readFile(`assets/${asset}`);
  assert.match(styles, new RegExp(asset.replace('.', '\\.')), `styles use unique activity asset ${asset}`);
}
await readFile('assets/cacc-connect-logo.png');
for (const page of ['connect.html','long-table-festival.html','leadership.html','join.html','careers.html']) {
  assert.match(files[page], /assets\/cacc-connect-logo\.png/, `${page} uses Connect-only logo`);
}
console.log(`Passed ${pages.length} page checks and source-requirement checks.`);
