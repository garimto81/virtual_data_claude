/**
 * 🎰 Virtual Data v4.0.0 Phoenix
 * Module Loader System
 *
 * 동적 모듈 로딩 및 의존성 관리
 */

import { Logger } from '../utils/logger.js';

export class ModuleLoader {
  constructor(app) {
    this.app = app;
    this.logger = new Logger('ModuleLoader');

    // 로드된 모듈들
    this.loadedModules = new Map();

    // 로딩 중인 모듈들 (중복 로딩 방지)
    this.loadingModules = new Map();

    // 모듈 경로 매핑
    this.modulePaths = {
      'table': '../modules/table/table-module.js',
      'player': '../modules/player/player-module.js',
      'hand': '../modules/hand/hand-module.js',
      'ui': '../modules/ui/ui-module.js'
    };

    // 모듈 의존성 정의
    this.dependencies = {
      'ui': ['table', 'player', 'hand'],
      'hand': ['player'],
      'player': ['table'],
      'table': []
    };
  }

  /**
   * 모듈 로드
   */
  async load(moduleName) {
    // 이미 로드된 경우
    if (this.loadedModules.has(moduleName)) {
      this.logger.debug(`모듈 '${moduleName}' 이미 로드됨`);
      return this.loadedModules.get(moduleName);
    }

    // 로딩 중인 경우 대기
    if (this.loadingModules.has(moduleName)) {
      this.logger.debug(`모듈 '${moduleName}' 로딩 중, 대기...`);
      return await this.loadingModules.get(moduleName);
    }

    // 새로운 모듈 로딩 시작
    const loadPromise = this._loadModule(moduleName);
    this.loadingModules.set(moduleName, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(moduleName, module);
      this.loadingModules.delete(moduleName);

      this.logger.success(`✅ 모듈 '${moduleName}' 로드 완료`);
      return module;

    } catch (error) {
      this.loadingModules.delete(moduleName);
      this.logger.error(`❌ 모듈 '${moduleName}' 로드 실패:`, error);
      throw error;
    }
  }

  /**
   * 여러 모듈 병렬 로드
   */
  async loadMultiple(moduleNames) {
    const promises = moduleNames.map(name => this.load(name));
    return await Promise.all(promises);
  }

  /**
   * 모듈 언로드
   */
  async unload(moduleName) {
    const module = this.loadedModules.get(moduleName);
    if (!module) {
      this.logger.warn(`모듈 '${moduleName}' 로드되지 않음`);
      return false;
    }

    try {
      // 모듈 정리
      if (typeof module.destroy === 'function') {
        await module.destroy();
      }

      // 앱에서 제거
      this.app.modules.delete(moduleName);
      this.loadedModules.delete(moduleName);

      this.logger.info(`🗑️ 모듈 '${moduleName}' 언로드 완료`);
      return true;

    } catch (error) {
      this.logger.error(`❌ 모듈 '${moduleName}' 언로드 실패:`, error);
      return false;
    }
  }

  /**
   * 모듈 재로드
   */
  async reload(moduleName) {
    await this.unload(moduleName);
    return await this.load(moduleName);
  }

  /**
   * 로드된 모듈 목록
   */
  getLoadedModules() {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * 모듈 로딩 상태
   */
  getLoadingStatus() {
    return {
      loaded: Array.from(this.loadedModules.keys()),
      loading: Array.from(this.loadingModules.keys()),
      available: Object.keys(this.modulePaths)
    };
  }

  // ==================== Private Methods ====================

  /**
   * 실제 모듈 로딩 수행
   */
  async _loadModule(moduleName) {
    this.logger.info(`📦 모듈 '${moduleName}' 로딩 시작...`);

    // 경로 확인
    const modulePath = this.modulePaths[moduleName];
    if (!modulePath) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    // 의존성 먼저 로드
    await this._loadDependencies(moduleName);

    try {
      // 모듈 파일 동적 임포트
      const moduleExports = await import(modulePath);

      // 기본 export 또는 이름 있는 export 찾기
      const ModuleClass = moduleExports.default || moduleExports[this._getModuleClassName(moduleName)];

      if (!ModuleClass) {
        throw new Error(`Module class not found in ${modulePath}`);
      }

      // 모듈 인스턴스 생성
      const moduleInstance = new ModuleClass(this.app);

      // 모듈 검증
      this._validateModule(moduleInstance, moduleName);

      // 모듈 초기화
      if (typeof moduleInstance.init === 'function') {
        await moduleInstance.init();
      }

      // 앱에 등록
      this.app.registerModule(moduleName, moduleInstance);

      return moduleInstance;

    } catch (error) {
      // 동적 임포트 실패 시 폴백 생성
      if (error.message.includes('Failed to fetch') || error.message.includes('not found')) {
        this.logger.warn(`⚠️ 모듈 파일 없음, 기본 모듈 생성: ${moduleName}`);
        return await this._createFallbackModule(moduleName);
      }

      throw error;
    }
  }

  /**
   * 의존성 로드
   */
  async _loadDependencies(moduleName) {
    const deps = this.dependencies[moduleName] || [];

    if (deps.length === 0) {
      return;
    }

    this.logger.debug(`🔗 모듈 '${moduleName}' 의존성 로드: ${deps.join(', ')}`);

    // 의존성들을 병렬로 로드
    await Promise.all(deps.map(dep => this.load(dep)));
  }

  /**
   * 모듈 클래스명 추정
   */
  _getModuleClassName(moduleName) {
    return moduleName.charAt(0).toUpperCase() + moduleName.slice(1) + 'Module';
  }

  /**
   * 모듈 유효성 검사
   */
  _validateModule(moduleInstance, moduleName) {
    // 필수 메소드 확인
    const requiredMethods = ['init', 'destroy'];

    for (const method of requiredMethods) {
      if (typeof moduleInstance[method] !== 'function') {
        this.logger.warn(`⚠️ 모듈 '${moduleName}'에 ${method}() 메소드 없음`);
      }
    }

    // 모듈명 설정
    if (!moduleInstance.name) {
      moduleInstance.name = moduleName;
    }
  }

  /**
   * 폴백 모듈 생성 (파일이 없는 경우)
   */
  async _createFallbackModule(moduleName) {
    this.logger.info(`🔧 기본 '${moduleName}' 모듈 생성`);

    // 기본 모듈 클래스
    class FallbackModule {
      constructor(app) {
        this.app = app;
        this.name = moduleName;
        this.enabled = false;
      }

      async init() {
        this.app.logger.info(`💡 기본 ${this.name} 모듈 초기화`);
      }

      async destroy() {
        // 정리 작업
      }
    }

    const moduleInstance = new FallbackModule(this.app);
    await moduleInstance.init();

    // 앱에 등록
    this.app.registerModule(moduleName, moduleInstance);

    return moduleInstance;
  }

  /**
   * 순환 의존성 검사
   */
  _checkCircularDependency(moduleName, visited = new Set(), path = []) {
    if (visited.has(moduleName)) {
      if (path.includes(moduleName)) {
        const cycle = [...path.slice(path.indexOf(moduleName)), moduleName];
        throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`);
      }
      return;
    }

    visited.add(moduleName);
    path.push(moduleName);

    const deps = this.dependencies[moduleName] || [];
    for (const dep of deps) {
      this._checkCircularDependency(dep, visited, [...path]);
    }
  }

  /**
   * 모듈 의존성 그래프 생성
   */
  getDependencyGraph() {
    const graph = {};

    for (const [module, deps] of Object.entries(this.dependencies)) {
      graph[module] = deps;
    }

    return graph;
  }

  /**
   * 로딩 순서 계산 (위상 정렬)
   */
  getLoadOrder(modules) {
    const order = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (module) => {
      if (visited.has(module)) return;
      if (visiting.has(module)) {
        throw new Error(`Circular dependency involving ${module}`);
      }

      visiting.add(module);

      const deps = this.dependencies[module] || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(module);
      visited.add(module);
      order.push(module);
    };

    for (const module of modules) {
      visit(module);
    }

    return order;
  }
}