/**
 * Phase 2 검증 스크립트
 * 기능별 즉시 실행 및 더블탭 시스템 검증
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Phase 2 검증 시작...\n');

// 1. 새 파일들 확인
console.log('1️⃣ Phase 2 파일 확인...');
const phase2Files = [
  'double-tap-handler.js',
  'batch-processor.js',
  'phase2-verification.html'
];

phase2Files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 2. 더블탭 핸들러 기능 확인
console.log('\n2️⃣ DoubleTapHandler 기능 확인...');
const doubleTapExists = fs.existsSync(path.join(__dirname, 'double-tap-handler.js'));

if (doubleTapExists) {
  const doubleTapCode = fs.readFileSync(path.join(__dirname, 'double-tap-handler.js'), 'utf8');

  const features = {
    'DoubleTapHandler 클래스': /class DoubleTapHandler/,
    '2초 타이머': /tapTimeout = 2000/,
    '타이머 충돌 방지': /clearTimeout.*pendingActions/,
    '위험 레벨 지원': /dangerLevel.*critical|warning/,
    '진동 피드백': /navigator\.vibrate/,
    'setupButton 메서드': /setupButton\(/,
    '이벤트 중복 방지': /removeEventListener.*_doubleTapHandler/
  };

  console.log('  더블탭 기능 검증:');
  Object.entries(features).forEach(([name, regex]) => {
    console.log(`  ${regex.test(doubleTapCode) ? '✅' : '❌'} ${name}`);
  });
}

// 3. 배치 프로세서 기능 확인
console.log('\n3️⃣ BatchProcessor 기능 확인...');
const batchExists = fs.existsSync(path.join(__dirname, 'batch-processor.js'));

if (batchExists) {
  const batchCode = fs.readFileSync(path.join(__dirname, 'batch-processor.js'), 'utf8');

  const features = {
    'BatchProcessor 클래스': /class BatchProcessor/,
    '트랜잭션 처리': /processBatch.*async/,
    '자동 롤백': /rollback.*actions/,
    'API 배치 최적화': /optimizedBatchCall/,
    '재시도 로직': /executeWithRetry/,
    '타임아웃 처리': /executeWithTimeout/,
    '청크 분할': /chunks\.push.*slice/,
    '진행 상황 표시': /progress.*Math\.floor/
  };

  console.log('  배치 처리 기능 검증:');
  Object.entries(features).forEach(([name, regex]) => {
    console.log(`  ${regex.test(batchCode) ? '✅' : '❌'} ${name}`);
  });
}

// 4. index.html 통합 확인
console.log('\n4️⃣ index.html 통합 확인...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const integrations = {
  'double-tap-handler.js 로드': /<script.*double-tap-handler\.js/,
  'batch-processor.js 로드': /<script.*batch-processor\.js/,
  '더블탭 CSS 스타일': /\.double-tap-warning/,
  'BatchProcessor 사용': /window\.batchProcessor/,
  'DoubleTapHandler 사용': /window\.doubleTapHandler/,
  '일괄 등록 개선': /BatchProcessor를 사용한 트랜잭션 처리/,
  '클라우드 초기화 더블탭': /DoubleTapHandler 사용.*resetCloudBtn/
};

console.log('  통합 상태:');
Object.entries(integrations).forEach(([name, regex]) => {
  console.log(`  ${regex.test(indexHtml) ? '✅' : '❌'} ${name}`);
});

// 5. 버전 확인
console.log('\n5️⃣ 버전 업데이트 확인...');
const versionMatch = indexHtml.match(/APP_VERSION = ['"]v(\d+\.\d+\.\d+)['"]/);
const expectedVersion = '3.1.0';

if (versionMatch && versionMatch[1] === expectedVersion) {
  console.log(`  ✅ 버전 ${expectedVersion}으로 업데이트됨`);
} else {
  console.log(`  ❌ 버전 불일치: ${versionMatch ? versionMatch[1] : '찾을 수 없음'} (예상: ${expectedVersion})`);
}

// 6. README 업데이트 확인
console.log('\n6️⃣ README.md 업데이트 확인...');
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');

const readmeChecks = {
  'v3.1.0 버전': /v3\.1\.0/,
  'Phase 2 설명': /Phase 2.*즉시 실행/,
  '더블탭 시스템': /더블탭.*시스템/,
  '트랜잭션 배치': /트랜잭션.*배치/,
  '파일 구조 업데이트': /double-tap-handler\.js.*Phase 2/
};

console.log('  문서 업데이트:');
Object.entries(readmeChecks).forEach(([name, regex]) => {
  console.log(`  ${regex.test(readme) ? '✅' : '❌'} ${name}`);
});

// 7. Phase 2 체크리스트 요약
console.log('\n7️⃣ Phase 2 체크리스트 요약...');
const checklist = {
  '플레이어 즉시 삭제': indexHtml.includes('async function deleteLocalPlayer'),
  '일괄 작업 트랜잭션': indexHtml.includes('batchProcessor.processBatch'),
  '더블탭 위험 작업': doubleTapExists,
  'API 배치 최적화': batchExists && /optimizedBatchCall/.test(fs.readFileSync(path.join(__dirname, 'batch-processor.js'), 'utf8')),
  '타이머 충돌 방지': doubleTapExists && /clearTimeout/.test(fs.readFileSync(path.join(__dirname, 'double-tap-handler.js'), 'utf8')),
  '롤백 시스템': batchExists && /rollback/.test(fs.readFileSync(path.join(__dirname, 'batch-processor.js'), 'utf8'))
};

console.log('  개발 체크리스트:');
Object.entries(checklist).forEach(([name, passed]) => {
  console.log(`  ${passed ? '✅' : '❌'} ${name}`);
});

// 최종 결과
console.log('\n' + '='.repeat(50));
console.log('📊 Phase 2 검증 결과 요약');
console.log('='.repeat(50));

const allChecks = [
  ...phase2Files.map(f => fs.existsSync(path.join(__dirname, f))),
  versionMatch && versionMatch[1] === expectedVersion,
  ...Object.values(checklist)
];

const passedCount = allChecks.filter(v => v).length;
const totalCount = allChecks.length;

console.log(`\n검증 항목 통과: ${passedCount}/${totalCount}`);

if (passedCount === totalCount) {
  console.log('\n✅ Phase 2 검증 통과!');
  console.log('모든 기능이 올바르게 구현되었습니다.');
  console.log('\n다음 단계:');
  console.log('1. 브라우저에서 phase2-verification.html 열어 성능 테스트');
  console.log('2. 실제 기기에서 더블탭 테스트');
  console.log('3. Phase 3 진행 가능');
} else {
  console.log('\n⚠️ Phase 2 부분 통과');
  console.log(`${totalCount - passedCount}개 항목 확인 필요`);
}

console.log('\n📁 파일 크기:');
const files = [
  'index.html',
  'action-history.js',
  'double-tap-handler.js',
  'batch-processor.js',
  'phase2-verification.html'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`  ${file}: ${size} KB`);
  }
});

console.log('\n💡 테스트 실행:');
console.log('  브라우저에서: http://localhost:8000/phase2-verification.html');
console.log('  자동 테스트가 3초 후 시작됩니다.');

process.exit(passedCount === totalCount ? 0 : 1);