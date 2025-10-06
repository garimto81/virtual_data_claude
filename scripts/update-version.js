#!/usr/bin/env node
/**
 * 버전 자동 업데이트 스크립트
 *
 * Usage:
 *   npm run version:update 3.15.0 "Step 4 확장 완료"
 *
 * 업데이트 대상 (3곳):
 *   1. src/core/store.js - config.version (1곳)
 *   2. src/core/store.js - constants.APP.VERSION (1곳)
 *   3. src/core/store.js - constants.APP.VERSION_DATE (1곳)
 *   4. index.html - APP_VERSION (1곳)
 *   5. index.html - VERSION_DATE (1곳)
 *   6. index.html - 헤더 (2곳)
 *   7. package.json (2곳)
 *
 * 총 9곳 자동 업데이트
 */

const fs = require('fs');
const path = require('path');

// 인자 파싱
const [,, newVersion, description] = process.argv;

if (!newVersion) {
  console.error('❌ 버전 번호가 필요합니다.');
  console.error('Usage: npm run version:update 3.15.0 "설명"');
  process.exit(1);
}

const versionTag = `v${newVersion}`;
const versionDate = new Date().toISOString().split('T')[0];

console.log(`\n📦 버전 업데이트: ${versionTag}`);
console.log(`📅 날짜: ${versionDate}`);
console.log(`📝 설명: ${description || '(없음)'}\n`);

let updateCount = 0;

// 1. store.js 업데이트 (3곳)
const storePath = path.join(__dirname, '../src/core/store.js');
let storeContent = fs.readFileSync(storePath, 'utf8');

// 1-1. config.version 업데이트
const before1 = storeContent;
storeContent = storeContent.replace(
  /(version: typeof APP_VERSION !== 'undefined' \? APP_VERSION : )'[\d.]+'/,
  `$1'${newVersion}'`
);
if (before1 !== storeContent) {
  updateCount++;
  console.log(`✅ [1/9] store.js - config.version → ${newVersion}`);
}

// 1-2. constants.APP.VERSION 업데이트
const before2 = storeContent;
storeContent = storeContent.replace(
  /(VERSION: )'v[\d.]+'/,
  `$1'${versionTag}'`
);
if (before2 !== storeContent) {
  updateCount++;
  console.log(`✅ [2/9] store.js - constants.APP.VERSION → ${versionTag}`);
}

// 1-3. constants.APP.VERSION_DATE 업데이트
const before3 = storeContent;
storeContent = storeContent.replace(
  /(VERSION_DATE: )'\d{4}-\d{2}-\d{2}'/,
  `$1'${versionDate}'`
);
if (before3 !== storeContent) {
  updateCount++;
  console.log(`✅ [3/9] store.js - constants.APP.VERSION_DATE → ${versionDate}`);
}

fs.writeFileSync(storePath, storeContent, 'utf8');

// 2. index.html 업데이트 (4곳)
const indexPath = path.join(__dirname, '../index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 2-1. APP_VERSION 업데이트
const before4 = indexContent;
indexContent = indexContent.replace(
  /(const APP_VERSION = )'v[\d.]+ - [^']+'/,
  `$1'${versionTag}'`
);
if (before4 !== indexContent) {
  updateCount++;
  console.log(`✅ [4/9] index.html - APP_VERSION → ${versionTag}`);
}

// 2-2. VERSION_DATE 업데이트
const before5 = indexContent;
indexContent = indexContent.replace(
  /(const VERSION_DATE = )'\d{4}-\d{2}-\d{2}'/,
  `$1'${versionDate}'`
);
if (before5 !== indexContent) {
  updateCount++;
  console.log(`✅ [5/9] index.html - VERSION_DATE → ${versionDate}`);
}

// 2-3. 헤더 Version 라인 업데이트
const before6 = indexContent;
indexContent = indexContent.replace(
  /Version: v[\d.]+ - [^\n]+/,
  `Version: ${versionTag} - ${description || '버전 업데이트'}`
);
if (before6 !== indexContent) {
  updateCount++;
  console.log(`✅ [6/9] index.html - 헤더 Version`);
}

// 2-4. 헤더 Last Modified 업데이트
const before7 = indexContent;
indexContent = indexContent.replace(
  /Last Modified: \d{4}-\d{2}-\d{2}/,
  `Last Modified: ${versionDate}`
);
if (before7 !== indexContent) {
  updateCount++;
  console.log(`✅ [7/9] index.html - Last Modified`);
}

// 2-5. Change Log에 새 항목 추가
if (description) {
  const changelogEntry = `  - ${versionTag} (${versionDate}): ${description}`;
  indexContent = indexContent.replace(
    /(Change Log:\n)/,
    `$1${changelogEntry}\n`
  );
  console.log(`✅ [8/9] index.html - Change Log 추가`);
  updateCount++;
}

fs.writeFileSync(indexPath, indexContent, 'utf8');

// 3. package.json 업데이트 (1곳)
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = newVersion;
if (description) {
  packageJson.description = `> 실시간 포커 핸드 기록 및 분석 시스템 ${versionTag} - ${description}`;
}
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`✅ [9/9] package.json - version & description`);
updateCount++;

console.log(`\n🎉 총 ${updateCount}곳 업데이트 완료!\n`);
console.log('📋 업데이트된 파일:');
console.log('  - src/core/store.js (3곳)');
console.log('  - index.html (5곳)');
console.log('  - package.json (1곳)');
console.log('\n다음 명령어로 커밋하세요:');
console.log(`  git add -A`);
console.log(`  git commit -m "chore: ${versionTag} 버전 업데이트"`);
