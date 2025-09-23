/**
 * 오프라인 저장소 모듈 - Phase 3
 * IndexedDB 기반 오프라인 지원 시스템
 * Version: 1.0.0
 */

class OfflineStorage {
  constructor() {
    this.dbName = 'PokerHandLogger';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.stores = {
      players: 'players',
      hands: 'hands',
      actions: 'actions',
      settings: 'settings',
      syncQueue: 'syncQueue'
    };

    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    try {
      await this.openDatabase();
      this.setupOnlineListener();
      this.setupPeriodicSync();
      console.log('✅ 오프라인 저장소 초기화 완료');
    } catch (error) {
      console.error('❌ 오프라인 저장소 초기화 실패:', error);
    }
  }

  /**
   * 데이터베이스 열기
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 플레이어 스토어
        if (!db.objectStoreNames.contains(this.stores.players)) {
          const playerStore = db.createObjectStore(this.stores.players, {
            keyPath: 'id',
            autoIncrement: true
          });
          playerStore.createIndex('name', 'name', { unique: false });
          playerStore.createIndex('status', 'status', { unique: false });
          playerStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // 핸드 스토어
        if (!db.objectStoreNames.contains(this.stores.hands)) {
          const handStore = db.createObjectStore(this.stores.hands, {
            keyPath: 'id',
            autoIncrement: true
          });
          handStore.createIndex('timestamp', 'timestamp', { unique: false });
          handStore.createIndex('gameType', 'gameType', { unique: false });
        }

        // 액션 스토어
        if (!db.objectStoreNames.contains(this.stores.actions)) {
          const actionStore = db.createObjectStore(this.stores.actions, {
            keyPath: 'id',
            autoIncrement: true
          });
          actionStore.createIndex('type', 'type', { unique: false });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 설정 스토어
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' });
        }

        // 동기화 큐 스토어
        if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
          const syncStore = db.createObjectStore(this.stores.syncQueue, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    });
  }

  /**
   * 온라인 상태 감지 설정
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 온라인 상태 - 동기화 시작');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📶 오프라인 상태 - 로컬 저장 모드');
    });
  }

  /**
   * 정기 동기화 설정
   */
  setupPeriodicSync() {
    // 30초마다 동기화 시도
    setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, 30000);

    // 페이지 언로드 시 마지막 동기화
    window.addEventListener('beforeunload', () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        // 동기 방식으로 마지막 동기화 시도
        navigator.sendBeacon('/api/sync', JSON.stringify(this.syncQueue));
      }
    });
  }

  /**
   * 데이터 저장
   */
  async save(storeName, data) {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // 타임스탬프 추가
      const dataWithTimestamp = {
        ...data,
        lastUpdated: Date.now(),
        synced: false
      };

      const request = store.put(dataWithTimestamp);

      request.onsuccess = () => {
        // 동기화 큐에 추가
        this.addToSyncQueue('save', storeName, dataWithTimestamp);
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 데이터 조회
   */
  async get(storeName, key) {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 모든 데이터 조회
   */
  async getAll(storeName, indexName = null, keyRange = null) {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      let source = store;
      if (indexName) {
        source = store.index(indexName);
      }

      const request = source.getAll(keyRange);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 데이터 삭제
   */
  async delete(storeName, key) {
    if (!this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        // 동기화 큐에 삭제 작업 추가
        this.addToSyncQueue('delete', storeName, { id: key });
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 동기화 큐에 추가
   */
  async addToSyncQueue(operation, storeName, data) {
    const syncItem = {
      operation,
      storeName,
      data,
      timestamp: Date.now(),
      priority: this.getSyncPriority(operation, storeName),
      retryCount: 0
    };

    await this.save(this.stores.syncQueue, syncItem);

    // 온라인 상태면 즉시 동기화 시도
    if (this.isOnline) {
      setTimeout(() => this.processSyncQueue(), 100);
    }
  }

  /**
   * 동기화 우선순위 결정
   */
  getSyncPriority(operation, storeName) {
    const priorities = {
      'settings': 1,      // 가장 높음
      'players': 2,
      'actions': 3,
      'hands': 4          // 가장 낮음
    };

    const operationBonus = operation === 'delete' ? 0 : 1;
    return (priorities[storeName] || 5) + operationBonus;
  }

  /**
   * 동기화 큐 처리
   */
  async processSyncQueue() {
    if (!this.isOnline || !this.db) return;

    try {
      const queueItems = await this.getAll(this.stores.syncQueue);

      if (queueItems.length === 0) return;

      // 우선순위 순으로 정렬
      queueItems.sort((a, b) => a.priority - b.priority);

      console.log(`🔄 동기화 큐 처리 시작: ${queueItems.length}개 항목`);

      for (const item of queueItems) {
        try {
          await this.syncItem(item);
          await this.delete(this.stores.syncQueue, item.id);
        } catch (error) {
          console.warn(`동기화 실패 (재시도 ${item.retryCount + 1}/3):`, error);

          if (item.retryCount < 3) {
            // 재시도 카운트 증가
            await this.save(this.stores.syncQueue, {
              ...item,
              retryCount: item.retryCount + 1
            });
          } else {
            // 최대 재시도 초과 시 실패 로그
            console.error('동기화 최종 실패:', item);
            await this.delete(this.stores.syncQueue, item.id);
          }
        }
      }

      console.log('✅ 동기화 큐 처리 완료');
    } catch (error) {
      console.error('동기화 큐 처리 오류:', error);
    }
  }

  /**
   * 개별 항목 동기화
   */
  async syncItem(item) {
    const { operation, storeName, data } = item;

    // Google Apps Script API 호출
    const endpoint = this.getApiEndpoint(storeName);
    const payload = {
      operation,
      data
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API 동기화 실패: ${response.statusText}`);
    }

    const result = await response.json();

    // 성공 시 로컬 데이터 동기화 상태 업데이트
    if (operation === 'save' && result.success) {
      await this.markAsSynced(storeName, data.id);
    }

    return result;
  }

  /**
   * API 엔드포인트 결정
   */
  getApiEndpoint(storeName) {
    const baseUrl = window.APPS_SCRIPT_URL || '';
    const endpoints = {
      players: `${baseUrl}?action=syncPlayers`,
      hands: `${baseUrl}?action=syncHands`,
      actions: `${baseUrl}?action=syncActions`,
      settings: `${baseUrl}?action=syncSettings`
    };

    return endpoints[storeName] || baseUrl;
  }

  /**
   * 동기화 완료 표시
   */
  async markAsSynced(storeName, id) {
    const item = await this.get(storeName, id);
    if (item) {
      await this.save(storeName, {
        ...item,
        synced: true,
        lastSynced: Date.now()
      });
    }
  }

  /**
   * 오프라인 상태 확인
   */
  isOffline() {
    return !this.isOnline;
  }

  /**
   * 동기화 상태 확인
   */
  async getSyncStatus() {
    const queueItems = await this.getAll(this.stores.syncQueue);
    const unsyncedCount = queueItems.length;

    return {
      isOnline: this.isOnline,
      pendingSync: unsyncedCount,
      lastSyncAttempt: queueItems.length > 0 ?
        Math.max(...queueItems.map(item => item.timestamp)) : null
    };
  }

  /**
   * 캐시 정리
   */
  async clearCache() {
    if (!this.db) return;

    const stores = Object.values(this.stores);

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }

    console.log('🗑️ 오프라인 캐시 정리 완료');
  }

  /**
   * 데이터베이스 크기 확인
   */
  async getStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 'Unknown', quota: 'Unknown' };
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: this.formatBytes(estimate.usage || 0),
      quota: this.formatBytes(estimate.quota || 0),
      usageBytes: estimate.usage || 0,
      quotaBytes: estimate.quota || 0
    };
  }

  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 디스트로이
   */
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * 플레이어 데이터 관리
 */
class PlayerOfflineManager {
  constructor(storage) {
    this.storage = storage;
    this.storeName = 'players';
  }

  async savePlayer(player) {
    return await this.storage.save(this.storeName, player);
  }

  async getPlayer(id) {
    return await this.storage.get(this.storeName, id);
  }

  async getAllPlayers() {
    return await this.storage.getAll(this.storeName);
  }

  async getActivePlayers() {
    return await this.storage.getAll(this.storeName, 'status', 'IN');
  }

  async deletePlayer(id) {
    return await this.storage.delete(this.storeName, id);
  }

  async updatePlayerChips(id, chips) {
    const player = await this.getPlayer(id);
    if (player) {
      return await this.savePlayer({
        ...player,
        chips,
        lastUpdated: Date.now()
      });
    }
  }
}

// 전역 인스턴스 생성
window.offlineStorage = new OfflineStorage();
window.playerOfflineManager = new PlayerOfflineManager(window.offlineStorage);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineStorage, PlayerOfflineManager };
}