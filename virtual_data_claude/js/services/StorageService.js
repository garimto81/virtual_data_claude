/**
 * StorageService - 로컬 스토리지 관리 서비스
 * LocalStorage, SessionStorage, IndexedDB 통합 관리
 */

export class StorageService {
    constructor() {
        this.prefix = 'pokerHandLogger_';
        this.dbName = 'PokerHandLoggerDB';
        this.dbVersion = 1;
        this.db = null;
        this.isIndexedDBAvailable = 'indexedDB' in window;
        this.initIndexedDB();
    }

    /**
     * IndexedDB 초기화
     */
    async initIndexedDB() {
        if (!this.isIndexedDBAvailable) {
            console.warn('IndexedDB is not available');
            return;
        }

        try {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                this.isIndexedDBAvailable = false;
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB initialized successfully');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 스토어 생성
                if (!db.objectStoreNames.contains('states')) {
                    const statesStore = db.createObjectStore('states', { keyPath: 'id', autoIncrement: true });
                    statesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('backups')) {
                    const backupsStore = db.createObjectStore('backups', { keyPath: 'timestamp' });
                    backupsStore.createIndex('version', 'version', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('hands')) {
                    const handsStore = db.createObjectStore('hands', { keyPath: 'handNumber' });
                    handsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    handsStore.createIndex('table', 'table', { unique: false });
                }
            };
        } catch (error) {
            console.error('IndexedDB initialization failed:', error);
            this.isIndexedDBAvailable = false;
        }
    }

    /**
     * LocalStorage 메서드
     */
    async setItem(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);
            
            // 크기 확인
            if (this.getSize(serialized) > 5 * 1024 * 1024) { // 5MB
                // 큰 데이터는 IndexedDB에 저장
                if (this.isIndexedDBAvailable) {
                    return await this.setIndexedDBItem('settings', { key, value });
                }
                throw new Error('Data too large for LocalStorage');
            }
            
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('Failed to save to LocalStorage:', error);
            
            // 용량 부족 시 오래된 데이터 정리
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldData();
                // 재시도
                try {
                    localStorage.setItem(this.prefix + key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('Failed even after cleanup:', retryError);
                    return false;
                }
            }
            return false;
        }
    }

    async getItem(key) {
        try {
            const fullKey = this.prefix + key;
            const item = localStorage.getItem(fullKey);
            
            if (item === null) {
                // LocalStorage에 없으면 IndexedDB 확인
                if (this.isIndexedDBAvailable) {
                    const dbItem = await this.getIndexedDBItem('settings', key);
                    return dbItem ? dbItem.value : null;
                }
                return null;
            }
            
            return JSON.parse(item);
        } catch (error) {
            console.error('Failed to get from LocalStorage:', error);
            return null;
        }
    }

    async removeItem(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            
            // IndexedDB에서도 제거
            if (this.isIndexedDBAvailable) {
                await this.deleteIndexedDBItem('settings', key);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to remove from LocalStorage:', error);
            return false;
        }
    }

    async clear() {
        try {
            // LocalStorage 정리
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            
            // IndexedDB 정리
            if (this.isIndexedDBAvailable && this.db) {
                const stores = ['states', 'backups', 'settings', 'hands'];
                const transaction = this.db.transaction(stores, 'readwrite');
                
                stores.forEach(storeName => {
                    transaction.objectStore(storeName).clear();
                });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * SessionStorage 메서드
     */
    setSessionItem(key, value) {
        try {
            const fullKey = this.prefix + key;
            sessionStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to SessionStorage:', error);
            return false;
        }
    }

    getSessionItem(key) {
        try {
            const fullKey = this.prefix + key;
            const item = sessionStorage.getItem(fullKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Failed to get from SessionStorage:', error);
            return null;
        }
    }

    removeSessionItem(key) {
        try {
            const fullKey = this.prefix + key;
            sessionStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Failed to remove from SessionStorage:', error);
            return false;
        }
    }

    /**
     * IndexedDB 메서드
     */
    async setIndexedDBItem(storeName, data) {
        if (!this.isIndexedDBAvailable || !this.db) {
            throw new Error('IndexedDB is not available');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getIndexedDBItem(storeName, key) {
        if (!this.isIndexedDBAvailable || !this.db) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllIndexedDBItems(storeName) {
        if (!this.isIndexedDBAvailable || !this.db) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteIndexedDBItem(storeName, key) {
        if (!this.isIndexedDBAvailable || !this.db) {
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 핸드 데이터 저장 (IndexedDB)
     */
    async saveHand(handData) {
        if (!this.isIndexedDBAvailable) {
            // IndexedDB 사용 불가 시 LocalStorage에 저장
            const hands = await this.getItem('hands') || [];
            hands.push(handData);
            
            // 최대 100개 핸드만 유지
            if (hands.length > 100) {
                hands.shift();
            }
            
            return await this.setItem('hands', hands);
        }

        const dataWithTimestamp = {
            ...handData,
            timestamp: new Date().toISOString()
        };

        return await this.setIndexedDBItem('hands', dataWithTimestamp);
    }

    /**
     * 핸드 데이터 조회
     */
    async getHand(handNumber) {
        if (!this.isIndexedDBAvailable) {
            const hands = await this.getItem('hands') || [];
            return hands.find(h => h.handNumber === handNumber);
        }

        return await this.getIndexedDBItem('hands', handNumber);
    }

    /**
     * 모든 핸드 조회
     */
    async getAllHands() {
        if (!this.isIndexedDBAvailable) {
            return await this.getItem('hands') || [];
        }

        return await this.getAllIndexedDBItems('hands');
    }

    /**
     * 백업 저장
     */
    async saveBackup(data) {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '35',
            data: data
        };

        if (!this.isIndexedDBAvailable) {
            // LocalStorage에 저장
            const backups = await this.getItem('backups') || [];
            backups.unshift(backup);
            
            // 최대 5개 백업만 유지
            if (backups.length > 5) {
                backups.pop();
            }
            
            return await this.setItem('backups', backups);
        }

        // IndexedDB에 저장
        await this.setIndexedDBItem('backups', backup);
        
        // 오래된 백업 정리
        await this.cleanupOldBackups();
        
        return true;
    }

    /**
     * 백업 조회
     */
    async getBackups() {
        if (!this.isIndexedDBAvailable) {
            return await this.getItem('backups') || [];
        }

        const backups = await this.getAllIndexedDBItems('backups');
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 특정 백업 복원
     */
    async restoreBackup(timestamp) {
        if (!this.isIndexedDBAvailable) {
            const backups = await this.getItem('backups') || [];
            return backups.find(b => b.timestamp === timestamp);
        }

        return await this.getIndexedDBItem('backups', timestamp);
    }

    /**
     * 저장 공간 정리
     */
    async cleanupOldData() {
        try {
            // LocalStorage 정리
            const keys = Object.keys(localStorage);
            const oldDataKeys = keys
                .filter(key => key.startsWith(this.prefix))
                .sort()
                .slice(0, Math.floor(keys.length * 0.3)); // 오래된 30% 삭제
            
            oldDataKeys.forEach(key => {
                localStorage.removeItem(key);
            });

            // IndexedDB 정리
            if (this.isIndexedDBAvailable) {
                await this.cleanupOldBackups();
                await this.cleanupOldHands();
            }

            console.log('Storage cleanup completed');
            return true;
        } catch (error) {
            console.error('Cleanup failed:', error);
            return false;
        }
    }

    /**
     * 오래된 백업 정리
     */
    async cleanupOldBackups() {
        if (!this.isIndexedDBAvailable || !this.db) return;

        const backups = await this.getAllIndexedDBItems('backups');
        
        // 최신 10개만 유지
        if (backups.length > 10) {
            const sorted = backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = sorted.slice(10);
            
            for (const backup of toDelete) {
                await this.deleteIndexedDBItem('backups', backup.timestamp);
            }
        }
    }

    /**
     * 오래된 핸드 정리
     */
    async cleanupOldHands() {
        if (!this.isIndexedDBAvailable || !this.db) return;

        const hands = await this.getAllIndexedDBItems('hands');
        
        // 최신 500개만 유지
        if (hands.length > 500) {
            const sorted = hands.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = sorted.slice(500);
            
            for (const hand of toDelete) {
                await this.deleteIndexedDBItem('hands', hand.handNumber);
            }
        }
    }

    /**
     * 저장 공간 사용량 확인
     */
    async getStorageInfo() {
        const info = {
            localStorage: {
                used: 0,
                items: 0
            },
            sessionStorage: {
                used: 0,
                items: 0
            },
            indexedDB: {
                available: this.isIndexedDBAvailable,
                databases: []
            }
        };

        // LocalStorage 정보
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                info.localStorage.items++;
                info.localStorage.used += this.getSize(localStorage[key]);
            }
        });

        // SessionStorage 정보
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                info.sessionStorage.items++;
                info.sessionStorage.used += this.getSize(sessionStorage[key]);
            }
        });

        // IndexedDB 정보
        if (this.isIndexedDBAvailable && navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            info.indexedDB.usage = estimate.usage;
            info.indexedDB.quota = estimate.quota;
        }

        return info;
    }

    /**
     * 데이터 크기 계산
     */
    getSize(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return new Blob([str]).size;
    }

    /**
     * 암호화/복호화 (선택사항)
     */
    encrypt(data, key) {
        // 간단한 XOR 암호화 (실제 사용 시 더 강력한 암호화 필요)
        const str = JSON.stringify(data);
        let encrypted = '';
        
        for (let i = 0; i < str.length; i++) {
            encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return btoa(encrypted); // Base64 인코딩
    }

    decrypt(encryptedData, key) {
        try {
            const encrypted = atob(encryptedData); // Base64 디코딩
            let decrypted = '';
            
            for (let i = 0; i < encrypted.length; i++) {
                decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }
}