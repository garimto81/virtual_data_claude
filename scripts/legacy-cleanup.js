#!/usr/bin/env node

/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Legacy Data Cleanup & Optimization Script
 *
 * v3 레거시 데이터 정리 및 최적화 도구
 */

import { promises as fs } from 'fs';
import path from 'path';

class LegacyCleanup {
  constructor() {
    this.basePath = path.resolve('..', 'virtual_data');
    this.stats = {
      deletedFiles: 0,
      deletedDirs: 0,
      freedSpace: 0,
      migratedData: 0
    };

    // 삭제할 파일/디렉토리 목록
    this.toDelete = [
      // Node.js 의존성 (13MB)
      'node_modules',

      // 테스트 관련 파일들
      'test_phase4.html',
      'test_phase4_playwright.js',
      'test_reload_fix.html',
      'run_phase4_tests.js',
      'playwright.config.js',
      'test-setup.js',

      // 임시/디버깅 파일들
      'phase4-functions.js',
      'INFINITE_RELOAD_FIX.md',
      'PHASE4_USER_VERIFICATION_GUIDE.md',
      'README-TESTING.md',

      // Git 관련 (Pages용이므로 제거)
      '.git',
      '.github',
      '.gitignore',
      '.nojekyll',
      '_config.yml',

      // 패키지 관리 파일
      'package.json',
      'package-lock.json',
      'server.js',

      // 기타 임시 파일들
      'test'
    ];

    // 유지할 중요 파일들
    this.toKeep = [
      'README.md',
      'docs',
      'src',
      'backups',
      'archive',
      'apps-script'
    ];

    // 마이그레이션할 데이터 소스
    this.migrationSources = [
      'backups/latest',
      'src/data',
      'localStorage_backup.json'
    ];
  }

  /**
   * 메인 정리 프로세스 실행
   */
  async run() {
    console.log('🧹 Virtual Data v3 레거시 정리 시작...\n');

    try {
      // 1. 기존 디렉토리 확인
      await this._checkLegacyDirectory();

      // 2. 중요 데이터 백업
      await this._backupImportantData();

      // 3. 불필요한 파일/디렉토리 삭제
      await this._cleanupFiles();

      // 4. 디렉토리 구조 최적화
      await this._optimizeStructure();

      // 5. 데이터 마이그레이션 준비
      await this._prepareMigration();

      // 6. 최종 보고서 생성
      await this._generateCleanupReport();

      console.log('\n✅ 정리 작업 완료!');
      this._printStats();

    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
      process.exit(1);
    }
  }

  /**
   * 레거시 디렉토리 존재 확인
   */
  async _checkLegacyDirectory() {
    console.log('📂 레거시 디렉토리 확인 중...');

    try {
      const stats = await fs.stat(this.basePath);
      if (stats.isDirectory()) {
        console.log(`✅ 발견: ${this.basePath}`);

        const files = await fs.readdir(this.basePath);
        console.log(`📋 총 ${files.length}개 항목 발견`);
      }
    } catch (error) {
      throw new Error(`레거시 디렉토리를 찾을 수 없습니다: ${this.basePath}`);
    }
  }

  /**
   * 중요 데이터 백업
   */
  async _backupImportantData() {
    console.log('\n💾 중요 데이터 백업 중...');

    const backupDir = path.join(process.cwd(), 'migration', 'v3-backup');
    await this._ensureDir(backupDir);

    // localStorage 데이터 추출을 위한 스크립트 생성
    const extractScript = `
      // v3 데이터 추출 스크립트
      const data = {};

      // localStorage에서 Virtual Data 관련 데이터 수집
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('vd_') || key.includes('poker') || key.includes('hand')) {
          data[key] = localStorage.getItem(key);
        }
      }

      // 추출된 데이터를 JSON으로 다운로드
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'v3-data-backup.json';
      a.click();

      console.log('v3 데이터 백업 완료:', Object.keys(data).length + ' 항목');
    `;

    await fs.writeFile(
      path.join(backupDir, 'extract-v3-data.js'),
      extractScript,
      'utf8'
    );

    console.log('✅ 백업 스크립트 생성 완료');
  }

  /**
   * 불필요한 파일/디렉토리 삭제
   */
  async _cleanupFiles() {
    console.log('\n🗑️ 불필요한 파일 삭제 중...');

    for (const item of this.toDelete) {
      const itemPath = path.join(this.basePath, item);

      try {
        const stats = await fs.stat(itemPath);
        const size = await this._getDirectorySize(itemPath);

        if (stats.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true });
          this.stats.deletedDirs++;
          console.log(`🗂️ 삭제됨: ${item}/ (${this._formatSize(size)})`);
        } else {
          await fs.unlink(itemPath);
          this.stats.deletedFiles++;
          console.log(`📄 삭제됨: ${item} (${this._formatSize(size)})`);
        }

        this.stats.freedSpace += size;

      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`⚠️ 삭제 실패: ${item} - ${error.message}`);
        }
      }
    }
  }

  /**
   * 디렉토리 구조 최적화
   */
  async _optimizeStructure() {
    console.log('\n📁 디렉토리 구조 최적화 중...');

    // 유지할 디렉토리들 정리
    for (const dir of this.toKeep) {
      const dirPath = path.join(this.basePath, dir);

      try {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          console.log(`✅ 유지됨: ${dir}/`);
        }
      } catch (error) {
        console.log(`❌ 없음: ${dir}/`);
      }
    }

    // 빈 디렉토리 제거
    await this._removeEmptyDirectories(this.basePath);
  }

  /**
   * 데이터 마이그레이션 준비
   */
  async _prepareMigration() {
    console.log('\n🔄 데이터 마이그레이션 준비 중...');

    const migrationDir = path.join(process.cwd(), 'migration');
    await this._ensureDir(migrationDir);

    // 마이그레이션 가이드 생성
    const migrationGuide = `
# 📋 v3 → v4 데이터 마이그레이션 가이드

## 1. 준비 단계
1. Chrome/Edge에서 기존 Virtual Data v3 사이트 접속
2. F12 개발자 도구 → Console 탭 열기
3. 다음 스크립트 실행하여 데이터 백업:

\`\`\`javascript
// 1. 백업 스크립트 로드 후 실행
fetch('./migration/v3-backup/extract-v3-data.js')
  .then(r => r.text())
  .then(script => eval(script));
\`\`\`

## 2. v4로 데이터 가져오기
1. Virtual Data v4 사이트 접속
2. 설정 → 데이터 가져오기 → v3 백업 파일 선택
3. 자동 변환 및 검증 완료 대기

## 3. 검증 체크리스트
- [ ] 플레이어 정보 복원 확인
- [ ] 핸드 히스토리 데이터 확인
- [ ] 설정값 복원 확인
- [ ] Apps Script URL 재설정

## 4. v3 정리 작업
완료 후 v3 디렉토리는 안전하게 삭제 가능합니다.
    `;

    await fs.writeFile(
      path.join(migrationDir, 'MIGRATION-GUIDE.md'),
      migrationGuide.trim(),
      'utf8'
    );

    console.log('✅ 마이그레이션 가이드 생성 완료');
  }

  /**
   * 정리 보고서 생성
   */
  async _generateCleanupReport() {
    const reportPath = path.join(process.cwd(), 'migration', 'cleanup-report.md');

    const report = `
# 🧹 Virtual Data v3 정리 보고서

**정리 완료 시간:** ${new Date().toLocaleString()}

## 📊 정리 통계
- **삭제된 파일:** ${this.stats.deletedFiles}개
- **삭제된 디렉토리:** ${this.stats.deletedDirs}개
- **확보된 공간:** ${this._formatSize(this.stats.freedSpace)}

## 🗑️ 삭제된 항목들
${this.toDelete.map(item => `- ${item}`).join('\n')}

## ✅ 유지된 항목들
${this.toKeep.map(item => `- ${item}`).join('\n')}

## 🔄 다음 단계
1. v3 → v4 데이터 마이그레이션 수행
2. v4 기능 검증 완료
3. v3 디렉토리 완전 삭제

---
*자동 생성된 보고서*
    `;

    await fs.writeFile(reportPath, report.trim(), 'utf8');
    console.log('📄 정리 보고서 생성 완료');
  }

  // ==================== 유틸리티 메소드들 ====================

  async _ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  async _getDirectorySize(dirPath) {
    try {
      const stats = await fs.stat(dirPath);

      if (stats.isFile()) {
        return stats.size;
      }

      if (stats.isDirectory()) {
        const files = await fs.readdir(dirPath);
        let total = 0;

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          total += await this._getDirectorySize(filePath);
        }

        return total;
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  async _removeEmptyDirectories(dirPath) {
    try {
      const files = await fs.readdir(dirPath);

      if (files.length === 0) {
        await fs.rmdir(dirPath);
        console.log(`🗂️ 빈 디렉토리 제거: ${path.basename(dirPath)}`);
        return;
      }

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          await this._removeEmptyDirectories(filePath);
        }
      }
    } catch (error) {
      // 무시
    }
  }

  _formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${sizes[i]}`;
  }

  _printStats() {
    console.log('\n📊 정리 완료 통계:');
    console.log(`   삭제된 파일: ${this.stats.deletedFiles}개`);
    console.log(`   삭제된 디렉토리: ${this.stats.deletedDirs}개`);
    console.log(`   확보된 공간: ${this._formatSize(this.stats.freedSpace)}`);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const cleanup = new LegacyCleanup();
  cleanup.run().catch(console.error);
}

export { LegacyCleanup };