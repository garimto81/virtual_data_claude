/**
 * console.log를 logger로 자동 교체하는 스크립트
 *
 * 사용법:
 * node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');

console.log('📝 console.log를 logger로 교체 중...');
console.log(`파일: ${filePath}`);

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

// 백업 생성
const backupPath = filePath + '.backup-console-logs';
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ 백업 생성: ${backupPath}`);

// 교체 카운터
let replacements = {
  debug: 0,
  info: 0,
  warn: 0,
  error: 0
};

// 교체 규칙
const rules = [
  // console.error → logger.error
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    type: 'error'
  },
  // console.warn → logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    type: 'warn'
  },
  // console.info → logger.info
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
    type: 'info'
  },
  // console.log with [DEBUG], [v3.x.x], etc → logger.debug
  {
    pattern: /console\.log\(\s*`%c\[DEBUG\]/g,
    replacement: 'logger.debug(`',
    type: 'debug'
  },
  {
    pattern: /console\.log\(\s*`%c\[v\d+\.\d+\.\d+\]/g,
    replacement: 'logger.debug(`',
    type: 'debug'
  },
  {
    pattern: /console\.log\(\s*'\[DEBUG\]/g,
    replacement: 'logger.debug(\'',
    type: 'debug'
  },
  {
    pattern: /console\.log\(\s*"\[DEBUG\]/g,
    replacement: 'logger.debug("',
    type: 'debug'
  },
  // 일반 console.log → logger.debug (개발용)
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug(',
    type: 'debug'
  }
];

// 규칙 적용
rules.forEach(rule => {
  const matches = content.match(rule.pattern);
  if (matches) {
    replacements[rule.type] += matches.length;
    content = content.replace(rule.pattern, rule.replacement);
  }
});

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');

// 결과 출력
console.log('\n✅ 교체 완료!');
console.log('\n📊 교체 통계:');
console.log(`  logger.debug: ${replacements.debug}개`);
console.log(`  logger.info:  ${replacements.info}개`);
console.log(`  logger.warn:  ${replacements.warn}개`);
console.log(`  logger.error: ${replacements.error}개`);
console.log(`  총 ${Object.values(replacements).reduce((a, b) => a + b, 0)}개 교체됨`);

console.log('\n💡 백업 파일에서 복원하려면:');
console.log(`  cp ${backupPath} ${filePath}`);
