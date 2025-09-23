const fs = require('fs');

function fixAllMultilineArrows() {
  try {
    console.log('📄 HTML 파일 읽기 중...');
    const htmlContent = fs.readFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', 'utf8');

    console.log('🔍 모든 다중 라인 화살표 함수 패턴 찾기...');

    // 여러 가지 다중 라인 화살표 함수 패턴들
    const patterns = [
      // filter(name => \n  condition\n)
      {
        regex: /\.filter\((\w+) =>\s*\n\s*([^\)]+)\s*\n\s*\)/g,
        replacement: '.filter($1 => $2)'
      },
      // map(item => {\n  return {...};\n})
      {
        regex: /\.map\((\w+) => \{\s*\n\s*return \{([^}]+)\};\s*\n\s*\}\)/g,
        replacement: '.map($1 => ({ $2 }))'
      },
      // some(item => \n  condition\n)
      {
        regex: /\.some\((\w+) =>\s*\n\s*([^\)]+)\s*\n\s*\)/g,
        replacement: '.some($1 => $2)'
      },
      // every(item => \n  condition\n)
      {
        regex: /\.every\((\w+) =>\s*\n\s*([^\)]+)\s*\n\s*\)/g,
        replacement: '.every($1 => $2)'
      },
      // find(item => \n  condition\n)
      {
        regex: /\.find\((\w+) =>\s*\n\s*([^\)]+)\s*\n\s*\)/g,
        replacement: '.find($1 => $2)'
      }
    ];

    let fixedContent = htmlContent;
    let totalFixes = 0;

    patterns.forEach((pattern, index) => {
      const matches = [...fixedContent.matchAll(pattern.regex)];
      if (matches.length > 0) {
        console.log(`🔧 패턴 ${index + 1}: ${matches.length}개 발견 및 수정`);
        matches.forEach(match => {
          console.log(`   - 원본: ${match[0].replace(/\n/g, '\\n')}`);
          console.log(`   - 수정: ${match[0].replace(pattern.regex, pattern.replacement)}`);
        });

        fixedContent = fixedContent.replace(pattern.regex, pattern.replacement);
        totalFixes += matches.length;
      }
    });

    // 수동으로 더 복잡한 패턴들을 찾아서 수정
    console.log('🎯 추가 패턴 검색...');

    // 특별한 케이스들 처리
    const specialCases = [
      // 두 줄 조건 filter
      {
        regex: /\.filter\((\w+) =>\s*\n\s*([^&\n]+) &&\s*\n\s*([^\)]+)\s*\n\s*\)/g,
        replacement: '.filter($1 => $2 && $3)'
      }
    ];

    specialCases.forEach((pattern, index) => {
      const matches = [...fixedContent.matchAll(pattern.regex)];
      if (matches.length > 0) {
        console.log(`🔧 특별 패턴 ${index + 1}: ${matches.length}개 발견 및 수정`);
        fixedContent = fixedContent.replace(pattern.regex, pattern.replacement);
        totalFixes += matches.length;
      }
    });

    if (totalFixes > 0) {
      console.log(`💾 총 ${totalFixes}개 수정사항 적용 중...`);
      fs.writeFileSync('C:/AI-tech/Claude-code-v2/virtual_data/index.html', fixedContent, 'utf8');
      console.log('✅ 파일 저장 완료');
    } else {
      console.log('ℹ️  수정할 다중 라인 화살표 함수를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error.message);
  }
}

fixAllMultilineArrows();