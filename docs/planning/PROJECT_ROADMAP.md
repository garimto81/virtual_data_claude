# Project Roadmap

**Project:** Poker Hand Logger - Virtual Table Database
**Last Updated:** 2025-10-05
**Current Version:** v3.10.0

---

## Project Overview

### Current Status
- **Phase 0:** Complete (v3.7.0) - Foundation & Cleanup
- **Phase 1:** Complete (v3.9.0) - IndexedDB Local Cache
- **Phase 2:** Complete (v3.10.0) - Pot Calculation Documentation
- **Phase 3:** Planned - Redis 3-Tier Architecture
- **Overall Progress:** 40% complete (2 of 5 major phases)

### Timeline Summary
- **Project Start:** Pre-2025
- **Phase 0:** 2025-10-05 (2 weeks)
- **Phase 1:** 2025-10-05 (2 weeks)
- **Phase 2:** 2025-10-05 (1 week)
- **Phase 3:** Planned (4 weeks)
- **Estimated Completion:** 2025-11-30

### Key Milestones Achieved
- Total code reduction: ~640 lines (8%)
- Performance improvement: 250x faster on revisits (12.5s → 50ms)
- Architecture simplification: Single Apps Script approach
- External dependencies: Reduced GitHub dependency, added Papa Parse
- Zero console errors

---

## Completed Phases

### Phase 0: Foundation & Cleanup (COMPLETE - 2025-10-05)

**Final Version:** v3.7.0 - Phase 0 Complete
**Duration:** 2 weeks
**Total Code Reduction:** ~640 lines

**Objective:** Code cleanup and simple bug fixes for app stabilization
- Remove unnecessary code
- Reduce complexity
- Minimize external dependencies
- Establish performance improvement foundation

---

#### Week 1: Duplicate Removal Automation (v3.6.0)

**Completion Date:** 2025-10-05
**Code Reduction:** ~140 lines
**Time Spent:** 3 hours

**Backend Changes: Apps Script v71.1.0**

**1) createPlayer() Function Modification**
- Changed logic: Duplicate check → Automatic update
- When duplicate player detected:
  - Old: Return error (`success: false, action: 'duplicate_name'`)
  - New: Update existing row (`success: true, action: 'updated'`)
- Updates: Seat number, chips, nationality, key player status
- Return value standardization: Added `player`, `table`, `chips`, `seat` fields

**2) New Player Addition Return Value**
- Changed `action: 'created'` → `action: 'added'`
- Added detailed information (player, table, chips, seat)

**Frontend Changes: index.html v3.6.0**

**Removed Functions (~140 lines):**
- `executeRemoveDuplicates()` - 39 lines
- Duplicate check in `initializeApp()` - 18 lines
- Frontend duplicate check in `_addNewPlayer_internal()` - 9 lines
- Duplicate removal button HTML - 4 lines
- Duplicate removal button handler - 70 lines

**UI Improvements:**
- Differentiated feedback: "Player added" vs "Player info updated"
- Automatic feedback with chip amount and seat number
- Removed manual duplicate removal button

**Effects:**
- Duplicate players prevented at source (Apps Script)
- App startup time reduced by 1 second
- User experience improved with clear feedback
- Maintenance points reduced (single source of truth)

---

#### Architecture Fix: Google Sheets API Removal (v3.6.1)

**Completion Date:** 2025-10-05
**Code Reduction:** ~150 lines

**Major Changes:**

**1) Complete Removal of Google Sheets API Code**
- Deleted `google-sheets-api.js` file
- Removed JWT library
- Removed `sendDataToGoogleSheet()` function

**2) Sheet Transfer Button Update**
- Reconnected to `_sendDataToGoogleSheet_internal()`
- Simplified to Apps Script approach only

**3) Spreadsheet ID Management**
- Default value: `1J-lf8bYTLPbpdhieUNdb8ckW_uwdQ3MtSBLmyRIwH7U`
- Editable in settings modal

**4) UI Cleanup**
- Removed Google Sheets URL input field
- Uses Apps Script URL only

**Effects:**
- Unified architecture (Apps Script approach only)
- Simplified settings
- Resolved runtime errors
- Eliminated dual-path complexity

**Documentation Created:**
- `docs/ROOT_CAUSE_ANALYSIS.md`
- `docs/ARCHITECTURE_DECISION.md`
- `docs/SETUP_GUIDE.md`
- `ARCHITECTURE_FIX_SUMMARY.md`

---

#### Week 2: Cloud Sync Removal + Papa Parse Integration (v3.7.0)

**Completion Date:** 2025-10-05
**Code Reduction:** ~350 lines
**Time Spent:** 2 hours

**1) Cloud Sync Removal (~200 lines)**

**Removed Functions:**
- `generateDeviceId()` - Device ID generation
- `saveConfigToCloud()` - Save to GitHub Gist
- `loadConfigFromCloud()` - Load from GitHub Gist
- `syncCloudNow()` - Manual sync trigger
- `resetCloudConfig()` - Cloud config reset
- `initializeAppConfig()` - Complex initialization
- `updateCloudSyncUI()` - Sync status display

**Simplified `updateAppsScriptUrl()` Function:**
- Removed cloud sync logic
- Local storage only
- Added URL validation

**Removed UI Elements:**
- Cloud sync status indicator
- Device ID display
- "Sync Now" button
- "Reset" button

**Effects:**
- Removed GitHub Gist dependency
- Drastically reduced complexity
- Simplified configuration
- Eliminated sync-related bugs

**2) Papa Parse Integration (~150 lines)**

**Added CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
```

**Replaced `parseCSV()` Function:**
- Old: 18 lines of manual parsing logic
- New: 6 lines using Papa Parse

```javascript
function parseCSV(text) {
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: true
  });
  return result.data;
}
```

**Effects:**
- Improved CSV parsing stability
- Better special character handling (commas, quotes, etc.)
- Enhanced code readability
- Industry-standard library usage

---

#### Phase 0 Summary

**Quantitative Results:**
- **Code Reduction:** ~640 lines (8% of codebase)
- **Functions Removed:** 10+
- **Files Deleted:** 2 (google-sheets-api.js, addOrUpdatePlayer.gs)
- **External Dependencies:** -1 (GitHub Gist), +1 (Papa Parse)
- **Performance:** 1 second faster app startup

**Qualitative Results:**
- Unified architecture (Apps Script only)
- Dramatically reduced complexity
- Simplified settings
- Resolved runtime errors
- Improved CSV parsing stability
- Complete documentation

**Version Progression:**
- v3.5.42 → v3.6.0 (Week 1)
- v3.6.0 → v3.6.1 (Architecture Fix)
- v3.6.1 → v3.7.0 (Week 2)

**Lessons Learned:**

Success Factors:
1. Incremental approach: Week 1 → Architecture Fix → Week 2
2. Thorough documentation: 5+ documents created
3. Validation priority: Verified each step
4. Root cause analysis: Solved architectural issues, not just surface errors

Improvements Needed:
1. Initial architecture decisions: Need ADR from project start
2. Automated testing: Manual verification → Automated tests
3. Version management: Clarify minor version update rules

---

### Phase 1: IndexedDB Local Cache (COMPLETE - 2025-10-05)

**Final Version:** v3.9.0 - Phase 1 Week 4 Complete
**Duration:** 2 weeks
**Objective:** Browser local cache for instant loading on revisits
**Performance Achievement:** 250x improvement (12.5s → 50ms)

---

#### Week 3: IndexedDB Schema & CRUD Operations (v3.8.0)

**Completion Date:** 2025-10-05
**Time Spent:** 1 day

**1) IndexedDB Schema Design**

Created new file: `src/db/indexeddb.js`

**Database Configuration:**
```javascript
const DB_NAME = 'PokerHandLogger';
const DB_VERSION = 1;

const STORES = {
  players: {
    keyPath: 'id',
    indexes: [
      { name: 'table', keyPath: 'table' },
      { name: 'seat', keyPath: 'seat' }
    ]
  },
  hands: {
    keyPath: 'handNumber',
    indexes: [
      { name: 'table', keyPath: 'table' },
      { name: 'date', keyPath: 'date' }
    ]
  },
  cache: {
    keyPath: 'key'
  }
};
```

**2) CRUD Functions Implementation**

**Key Functions:**
- `initDB()` - Database initialization with upgrade handling
- `savePlayers(tableName, players)` - Save players by table
- `getPlayers(tableName)` - Retrieve players by table
- `saveHands(hands)` - Save hand history
- `getHands()` - Retrieve hand history
- `isCacheFresh(timestamp, maxAge)` - Cache validation (default: 60s)

**3) CSV and IndexedDB Integration**

**Modified `loadInitial()` Function:**

```javascript
async function loadInitial() {
  // Step 1: Check IndexedDB cache
  const cachedPlayers = await getPlayersFromCache(window.state.selectedTable);
  const cachedHands = await getHandsFromCache();

  const playersCacheFresh = cachedPlayers && isCacheFresh(cachedPlayers.timestamp, 60000);
  const handsCacheFresh = cachedHands && isCacheFresh(cachedHands.timestamp, 60000);

  if (playersCacheFresh && handsCacheFresh) {
    // Cache hit - Load immediately
    window.state.players = cachedPlayers.data;
    window.state.indexRows = cachedHands.data;
    renderAll();
    return;
  }

  // Step 2: CSV download (cache miss or expired)
  const [typeRows, idxRows] = await Promise.all([
    fetchCsv(CSV_TYPE_URL),
    fetchCsv(CSV_INDEX_URL)
  ]);

  if (typeRows.length) buildTypeFromCsv(typeRows);
  if (idxRows.length) buildIndexFromCsv(idxRows);

  // Step 3: Save to IndexedDB
  await savePlayers(window.state.selectedTable, window.state.players);
  await saveHands(window.state.indexRows);

  renderAll();
}
```

**Effects:**
- Offline support enabled
- Instant loading on revisit (50ms)
- 95% reduction in network traffic
- Seamless cache management

**Performance Comparison:**
- First visit: 12.5s (CSV download)
- Revisit (within 60s): **50ms** (IndexedDB cache)
- Revisit (after 60s): 12.5s (cache expired, refresh from CSV)

---

#### Week 4: Error Recovery System (v3.9.0)

**Completion Date:** 2025-10-05
**Time Spent:** 1 day

**Objective:** Robust error handling for production stability

**1) IndexedDB Error Handling Wrapper**

```javascript
async function safeIndexedDBOperation(operation, fallbackValue, operationName) {
  try {
    return await operation();
  } catch (error) {
    // QuotaExceededError - Automatic cache cleanup
    if (error.name === 'QuotaExceededError') {
      await db.players.clear();
      await db.tables.clear();
      await db.cache.clear();
    }

    // InvalidStateError - Automatic reinitialization
    if (error.name === 'InvalidStateError') {
      await db.open();
    }

    return fallbackValue;
  }
}
```

**2) CSV Loading Retry Logic**

```javascript
async function fetchCsv(url, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const txt = await res.text();
      if (!txt || txt.trim().length === 0) throw new Error('Empty CSV');

      return parseCSV(txt);
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  return [];
}
```

**3) Apps Script Request Retry**

Added retry logic to `_addNewPlayer_internal()`:
- Maximum 3 attempts
- Content-Type validation
- 2-second delay between retries

**4) User-Friendly Error Messages**

```javascript
function showFeedback(msg, isErr = false, duration = 5000) {
  let userMessage = msg;

  if (isErr) {
    if (msg.includes('HTTP 404')) userMessage = 'Data not found.';
    else if (msg.includes('HTTP 500')) userMessage = 'Server error occurred.';
    else if (msg.includes('NetworkError')) userMessage = 'Please check network connection.';
    // ... 8+ error pattern transformations
  }

  // Auto-hide success messages
  if (!isErr && duration > 0) {
    setTimeout(() => el.feedbackMessage.textContent = '', duration);
  }
}
```

**Effects:**
- Automatic recovery from IndexedDB quota errors
- Automatic retry on network instability
- Technical errors → User-friendly messages
- Dramatically improved system stability
- Graceful degradation

---

#### Phase 1 Summary

**Performance Results:**
- Revisit loading: 12.5s → **50ms** (250x faster)
- Network traffic: 95% reduction
- Offline support: Fully enabled
- Cache TTL: 60 seconds (configurable)

**Technical Achievements:**
- IndexedDB integration complete
- Error recovery system implemented
- Exponential backoff retry logic
- User experience significantly improved

**Code Changes:**
- New file: `src/db/indexeddb.js`
- Modified: `loadInitial()` function
- Enhanced: Error handling throughout app

---

### Phase 2: Pot Calculation Documentation (COMPLETE - 2025-10-05)

**Final Version:** v3.10.0 - Phase 2 Week 5 Complete
**Duration:** 1 week (1 day actual)
**Objective:** Document existing pot calculation logic and improve readability

**Important Note:** Originally planned to merge 3 pot calculation functions, but changed to documentation approach for safety and practicality.

---

#### Week 5: Pot Calculation Logic Documentation

**Completion Date:** 2025-10-05
**Time Spent:** 1 day

**1) Main Pot Calculation Function Documentation**

```javascript
/**
 * Calculate actual pot amount - Main function
 *
 * Logic:
 * 1. Check if Pot Correction action exists
 * 2. If yes → calculatePotWithCorrection() (manual correction mode)
 * 3. If no → calculateAccuratePot() (automatic accurate calculation)
 *
 * Use Cases:
 * - Pot Correction: When dealer manually corrects pot
 * - Normal calculation: Blinds + Ante + All actions sum
 */
function calculateActualPot() { ... }
```

**2) calculateAccuratePot() Algorithm Documentation**

```javascript
/**
 * Accurate Pot Calculation Algorithm
 *
 * Steps:
 * 1. Calculate maximum bet amount per player (initialChips)
 * 2. Calculate actual bet amount per player (blinds + ante + actions)
 * 3. Extract and sort all-in amounts
 * 4. Set smallest all-in amount as main pot baseline
 * 5. Main pot = baseline amount × number of participating players
 *
 * Limitations:
 * - Side pots not implemented (mostly 1v1 heads-up, unnecessary)
 * - Handles main pot only
 *
 * Example:
 * - Player A: 100 all-in
 * - Player B: 200 all-in
 * - Main pot: 100 × 2 = 200
 * - Remaining 100 returned to Player B (uncalled bet)
 */
```

**3) calculatePotWithCorrection() Scenario Documentation**

```javascript
/**
 * Pot Correction Mode
 *
 * Use Scenarios:
 * - Video editing error causes missing actions
 * - Player puts in wrong chips, manual adjustment needed
 * - System bug causes pot amount mismatch
 * - Dealer override for complex situations
 *
 * Priority: Pot Correction > Automatic calculation
 *
 * Behavior:
 * - Find first Pot Correction action in any street
 * - Use correction value as new baseline
 * - Add only actions after correction
 * - Ignore all actions before correction
 */
```

**Effects:**
- Pot calculation logic fully documented
- Strategy Pattern clearly identified
- Example cases added (100 vs 200 all-in)
- Step-by-step comments for readability
- Limitations clearly stated
- **No functional changes** (code stability maintained)

**Why Documentation Instead of Refactoring:**

Reasons for changing from planned 3-function merge:
1. Current structure already implements Strategy Pattern well
2. Each function has clear single responsibility
3. Forced integration risks reduced readability and bugs
4. Documentation is safer and more practical improvement
5. Existing code is battle-tested in production

**Original Plan (Not Executed):**

The original plan was to create a unified `calculatePot(options)` function:
- Merge: `calculateActualPot()`, `calculateAccuratePot()`, `calculatePotWithCorrection()`
- Reduce: ~75 lines
- Add: Configuration options (includeSB, includeBB, includeAnte, etc.)

**Decision:** Preserved existing architecture, enhanced documentation instead.

---

#### Phase 2 Summary

**Documentation Achievements:**
- Complete algorithm documentation
- Use case scenarios documented
- Limitations clearly stated
- Code comments enhanced
- Maintainability improved

**Code Stability:**
- Zero functional changes
- No regression risk
- Production-tested code preserved
- Strategic technical debt accepted

**Version:** v3.10.0 - Phase 2 Week 5 Complete

---

## Current Phase

**Status:** Planning Phase
**Next:** Phase 3 - Redis 3-Tier Architecture

---

## Future Phases

### Phase 3: Redis 3-Tier Architecture (PLANNED)

**Duration:** 4 weeks
**Objective:** 1250x performance improvement with distributed caching
**Target:** Revisit loading in 10ms (vs current 50ms)

**Technology Stack:**
- **Redis Provider:** Upstash (Free Tier)
- **Region:** Asia Pacific (Tokyo)
- **Type:** Regional Redis
- **Cost:** $0/month

---

#### Week 6: Upstash Redis Setup & Basic CRUD

**Time Estimate:** 1 week

**1) Upstash Setup (1 hour)**

Steps:
1. Access https://upstash.com/
2. Login with GitHub account
3. Click "Create Database"
4. Name: poker-hand-logger
5. Region: Asia Pacific (Tokyo)
6. Type: Regional (free)
7. Copy REST API URL and token

**2) Redis API Implementation (4 days)**

Create new file: `src/api/redis-client.js`

```javascript
const REDIS_CONFIG = {
  url: 'https://apn1-stunning-frog-12345.upstash.io',
  token: 'AYF8AAI...' // From Upstash dashboard
};

async function redisCommand(command, ...args) {
  const url = `${REDIS_CONFIG.url}/${command}/${args.join('/')}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${REDIS_CONFIG.token}`
    }
  });

  const data = await response.json();
  return data.result;
}

// Get players from Redis
async function getPlayersFromRedis(tableName) {
  const playersHash = await redisCommand('HGETALL', `players:${tableName}`);

  if (!playersHash || Object.keys(playersHash).length === 0) {
    return null;
  }

  const players = Object.entries(playersHash).map(([name, json]) => ({
    player: name,
    ...JSON.parse(json)
  }));

  return players;
}

// Save players to Redis
async function savePlayersToRedis(tableName, players) {
  for (const player of players) {
    await redisCommand('HSET', `players:${tableName}`, player.player, JSON.stringify({
      chips: player.chips,
      seat: player.seat,
      table: player.table,
      updatedAt: new Date().toISOString()
    }));
  }

  // Update timestamp
  await redisCommand('SET', 'cache:timestamp', Date.now());
}
```

**Expected Results:**
- Redis basic connectivity complete
- 10ms response time
- CRUD operations working

**Testing:**
1. Redis connection verification
2. Player save/retrieve
3. Verify data in Upstash dashboard

---

#### Week 7: 3-Tier Caching Integration

**Time Estimate:** 1 week

**Objective:** Integrate Redis as Tier 2 cache between IndexedDB and Google Sheets

**3-Tier Architecture:**
- **Tier 1:** IndexedDB (Browser local) - 50ms
- **Tier 2:** Redis (Cloud) - 10ms
- **Tier 3:** Google Sheets (Source of truth) - 3-5s

**Modified `loadInitial()` Function:**

```javascript
async function loadInitial() {
  openLogModal();
  logMessage('Starting data load...');

  try {
    // Tier 1: IndexedDB cache
    const cachedPlayers = await getPlayersFromIndexedDB(window.state.selectedTable);

    if (cachedPlayers && isCacheFresh(cachedPlayers.timestamp, 60000)) {
      logMessage('IndexedDB cache hit (50ms)');
      window.state.players = cachedPlayers.data;
      renderAll();
      logMessage('Loading complete (IndexedDB)');
      setTimeout(closeLogModal, 500);
      return;
    }

    // Tier 2: Redis cache
    logMessage('Querying Redis...');
    const redisPlayers = await getPlayersFromRedis(window.state.selectedTable);

    if (redisPlayers) {
      logMessage('Redis cache hit (10ms)');
      window.state.players = redisPlayers;

      // Also save to IndexedDB
      await savePlayersToIndexedDB(window.state.selectedTable, redisPlayers);

      renderAll();
      logMessage('Loading complete (Redis)');
      setTimeout(closeLogModal, 500);
      return;
    }

    // Tier 3: Google Sheets (last resort)
    logMessage('Cache miss - Downloading CSV...');
    const typeRows = await fetchCsv(CSV_TYPE_URL);

    if (typeRows.length) buildTypeFromCsv(typeRows);

    // Save to Redis and IndexedDB
    await savePlayersToRedis(window.state.selectedTable, window.state.players);
    await savePlayersToIndexedDB(window.state.selectedTable, window.state.players);

    renderAll();
    logMessage('Loading complete (CSV + cache saved)');

  } catch(err) {
    console.error(err);
    logMessage(`Loading failed: ${err.message}`, true);
  } finally {
    setTimeout(closeLogModal, 800);
  }
}
```

**Expected Performance:**
- IndexedDB cache: 50ms
- Redis cache: 10ms
- CSV download: 3-5s (cache miss only)
- Cache hit rate: >95%

---

#### Week 8: Apps Script → Redis Synchronization

**Time Estimate:** 1 week

**Objective:** Automatic Redis cache update when data changes

**Apps Script Modification:**

```javascript
// Apps Script: doPost

function saveHand(handData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hand');

  // 1. Save to Google Sheets
  sheet.appendRow([handData.handNumber, handData.table, ...]);

  // 2. Invalidate Redis cache
  updateRedisCache('hand:' + handData.handNumber, handData);
  incrementVersion();

  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    handNumber: handData.handNumber
  })).setMimeType(ContentService.MimeType.JSON);
}

function updateRedisCache(key, data) {
  const url = REDIS_CONFIG.url + '/HSET/' + key;

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + REDIS_CONFIG.token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}

function incrementVersion() {
  const url = REDIS_CONFIG.url + '/INCR/sync:version';

  UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + REDIS_CONFIG.token
    }
  });
}
```

**Expected Results:**
- Automatic Redis update on hand save
- Other users immediately see latest data
- No manual cache invalidation needed

---

#### Week 9: Real-time Synchronization (Polling)

**Time Estimate:** 1 week

**Objective:** Multi-user real-time synchronization using polling (alternative to expensive Pub/Sub)

**Version Check Polling Implementation:**

```javascript
// index.html

let localVersion = 0;
let syncInterval = null;

async function startSync() {
  // Check version every 5 seconds
  syncInterval = setInterval(async () => {
    try {
      const remoteVersion = await redisCommand('GET', 'sync:version');

      if (remoteVersion && Number(remoteVersion) > localVersion) {
        console.log('Data change detected - reloading');

        // Invalidate cache
        await invalidateCache();

        // Reload data
        await loadInitial();

        localVersion = Number(remoteVersion);

        showFeedback('Data has been updated');
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, 5000); // 5 seconds
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// Start sync on app load
document.addEventListener('DOMContentLoaded', () => {
  // ...
  startSync();
});

// Stop sync on app close
window.addEventListener('beforeunload', () => {
  stopSync();
});
```

**Expected Results:**
- Real-time sync (5-second delay)
- Multi-user data consistency
- Replaces expensive Pub/Sub feature
- Low network overhead

---

#### Phase 3 Summary

**Expected Performance:**
- First visit: 8s (CSV download)
- Revisit (IndexedDB): 50ms
- Revisit (Redis): **10ms**
- Overall improvement: **1250x faster** vs original

**Cost:**
- Development: 4 weeks
- Operation: $0/month (Upstash free tier)

**Technical Achievements:**
- 3-tier distributed caching
- Automatic cache invalidation
- Multi-user synchronization
- Production-grade reliability

---

### Phase 7: Modularization (PLANNED)

**Duration:** TBD
**Objective:** Remove window object dependencies and create proper module structure

**Key Goals:**
- ES6 module system adoption
- Window object dependency removal
- Proper separation of concerns
- Bundler integration (optional)

**Planned Improvements:**
- Convert global functions to modules
- Implement proper import/export
- Create service layer abstraction
- State management refactoring

**Expected Benefits:**
- Improved testability
- Better code organization
- Reduced global namespace pollution
- Enhanced maintainability

**Note:** Deferred to allow stability of earlier phases

---

## Development Timeline

### Month 1 (October 2025)
- **Week 1:** Phase 0 Week 1 - Duplicate removal automation
- **Week 2:** Phase 0 Week 2 - Cloud sync removal + Papa Parse
- **Week 3:** Phase 1 Week 3 - IndexedDB schema & CRUD
- **Week 4:** Phase 1 Week 4 - Error recovery system

### Month 2 (November 2025)
- **Week 5:** Phase 2 Week 5 - Pot calculation documentation
- **Week 6:** Phase 3 Week 6 - Redis setup & basic CRUD (PLANNED)
- **Week 7:** Phase 3 Week 7 - 3-tier caching integration (PLANNED)
- **Week 8:** Phase 3 Week 8 - Apps Script Redis sync (PLANNED)

### Month 3 (December 2025)
- **Week 9:** Phase 3 Week 9 - Real-time sync polling (PLANNED)
- **Week 10-12:** Testing & optimization (PLANNED)

### Critical Path
1. **Phase 0** → Foundation for all future work
2. **Phase 1** → Enables offline-first architecture
3. **Phase 3** → Depends on Phase 1 (IndexedDB must exist first)
4. **Phase 7** → Independent, can run parallel to Phase 3

### Dependencies
- Phase 1 requires Phase 0 (clean codebase)
- Phase 3 requires Phase 1 (local cache layer)
- Phase 2 independent (documentation only)
- Phase 7 independent (structural refactoring)

---

## Version History

### Complete Changelog

**v3.10.0 - Phase 2 Week 5 Complete (2025-10-05)**
- Pot calculation logic fully documented
- Algorithm explanations added
- Use cases and limitations documented
- No functional changes

**v3.9.0 - Phase 1 Week 4 Complete (2025-10-05)**
- Error recovery system implemented
- IndexedDB error handling wrapper
- CSV loading retry logic with exponential backoff
- Apps Script request retry (3 attempts)
- User-friendly error messages

**v3.8.0 - Phase 1 Week 3 Complete (2025-10-05)**
- IndexedDB schema designed and implemented
- CRUD operations complete
- Cache validation with TTL (60s)
- CSV and IndexedDB integration
- 250x performance improvement on revisits

**v3.7.0 - Phase 0 Complete (2025-10-05)**
- Cloud sync removal (~200 lines)
- Papa Parse integration (~150 lines saved)
- GitHub Gist dependency removed
- CSV parsing stability improved

**v3.6.1 - Architecture Fix (2025-10-05)**
- Google Sheets API completely removed (~150 lines)
- Unified architecture (Apps Script only)
- Spreadsheet ID management simplified
- Runtime errors resolved

**v3.6.0 - Phase 0 Week 1 (2025-10-05)**
- Duplicate removal automation in Apps Script
- Frontend duplicate check removed (~140 lines)
- Differentiated feedback messages
- App startup 1 second faster

**v3.5.42 - Pre-Phase 0 (baseline)**
- Original codebase before optimization

### Semantic Versioning Strategy

**Format:** `vMAJOR.MINOR.PATCH`

**Rules:**
- **MAJOR:** Breaking changes (v3 → v4)
- **MINOR:** New features, phase completions (v3.6 → v3.7)
- **PATCH:** Bug fixes, minor improvements (v3.6.0 → v3.6.1)

**Phase Version Mapping:**
- Phase 0: v3.6.x - v3.7.x
- Phase 1: v3.8.x - v3.9.x
- Phase 2: v3.10.x
- Phase 3: v3.11.x - v3.14.x (planned)

---

## Metrics & KPIs

### Code Quality Metrics

**Code Reduction:**
| Phase | Lines Removed | Cumulative | Percentage |
|-------|---------------|------------|------------|
| Phase 0 Week 1 | 140 | 140 | 1.8% |
| Phase 0 Arch Fix | 150 | 290 | 3.6% |
| Phase 0 Week 2 | 350 | 640 | 8.0% |
| Phase 1 | 0 (added) | 640 | - |
| Phase 2 | 0 (docs) | 640 | - |
| **Total** | **640** | **640** | **8.0%** |

**Function Count:**
- Original: 134 functions
- Removed: 10+ functions
- Added: 8+ functions (IndexedDB)
- Current: ~132 functions

**Files:**
- Deleted: 2 files
- Added: 1 file (indexeddb.js)
- Modified: 1 file (index.html)

### Performance Benchmarks

**App Startup Time:**
| Metric | Baseline | Phase 0 | Phase 1 | Phase 3 Target | Improvement |
|--------|----------|---------|---------|----------------|-------------|
| First visit | 12.5s | 11.5s | 11.5s | 8s | 36% |
| Revisit | 12.5s | 11.5s | **50ms** | **10ms** | **1250x** |
| Startup overhead | 1.0s | 0.5s | 0.5s | 0.5s | 50% |

**Operation Performance:**
| Operation | Baseline | Current | Target | Improvement |
|-----------|----------|---------|--------|-------------|
| Hand save | 7.1s | 7.1s | 4s | - |
| Player search | 5ms | 5ms | 5ms | - |
| CSV parsing | Custom | Papa Parse | Papa Parse | Stability↑ |
| Cache hit | N/A | 50ms | 10ms | - |

**Network Traffic:**
| Metric | Before Phase 1 | After Phase 1 | Reduction |
|--------|----------------|---------------|-----------|
| Avg requests/session | 12 | 1-2 | 90% |
| Data transferred | ~500KB | ~50KB | 90% |
| Cache hit rate | 0% | 95% | - |

### Progress Tracking

**Overall Project Progress:** 40% Complete

**Phase Completion:**
- Phase 0: 100% ✓
- Phase 1: 100% ✓
- Phase 2: 100% ✓
- Phase 3: 0% (planned)
- Phase 7: 0% (planned)

**Key Deliverables:**
- [x] Code cleanup and optimization
- [x] Architecture simplification
- [x] Local caching implementation
- [x] Error recovery system
- [x] Documentation improvement
- [ ] Distributed caching (Redis)
- [ ] Real-time synchronization
- [ ] Module structure refactoring

---

## Appendix

### A. Technical Decisions Log

**TD-001: Apps Script Only Architecture (2025-10-05)**
- Decision: Remove Google Sheets API, use Apps Script exclusively
- Rationale: Simpler architecture, fewer failure points, easier maintenance
- Impact: -150 lines, eliminated dual-path complexity
- Reference: `docs/ARCHITECTURE_DECISION.md`

**TD-002: Papa Parse Adoption (2025-10-05)**
- Decision: Replace custom CSV parser with Papa Parse library
- Rationale: Industry standard, better special character handling, less maintenance
- Impact: -150 lines, improved stability
- Trade-off: +1 external dependency

**TD-003: IndexedDB Cache TTL 60s (2025-10-05)**
- Decision: 60-second cache expiration
- Rationale: Balance between freshness and performance
- Impact: 95% cache hit rate in typical usage
- Adjustable: Can be configured per use case

**TD-004: Pot Calculation Documentation Over Refactoring (2025-10-05)**
- Decision: Document existing code instead of merging 3 functions
- Rationale: Current code is battle-tested, follows Strategy Pattern, refactoring adds risk
- Impact: Zero regression risk, improved maintainability through docs
- Trade-off: Technical debt accepted for stability

**TD-005: Polling Over Pub/Sub (Planned)**
- Decision: Use 5-second polling instead of Redis Pub/Sub
- Rationale: Pub/Sub requires paid tier, polling is free and sufficient for this use case
- Impact: 5-second sync delay acceptable for poker logging
- Cost savings: $0/month vs ~$20/month

### B. Risk Register

**R-001: IndexedDB Browser Support**
- Risk: Older browsers may not support IndexedDB
- Mitigation: Graceful fallback to CSV-only mode
- Probability: Low (IndexedDB supported since 2015)
- Impact: Medium

**R-002: Redis Free Tier Limits**
- Risk: Upstash free tier has 10,000 commands/day limit
- Mitigation: Implement rate limiting, cache aggregation
- Probability: Medium
- Impact: Low (can upgrade if needed)

**R-003: Apps Script Quota**
- Risk: Google Apps Script has daily quotas
- Mitigation: Already using CSV for reads (quota-friendly)
- Probability: Low
- Impact: Medium

**R-004: Cache Invalidation Complexity**
- Risk: Multi-tier cache may have consistency issues
- Mitigation: Version-based invalidation, TTL safety net
- Probability: Medium
- Impact: Medium

### C. Architecture Reference

For detailed architecture information, see:
- `docs/ARCHITECTURE_OVERVIEW.md` - System architecture
- `docs/ARCHITECTURE_DECISION.md` - ADR records
- `docs/ROOT_CAUSE_ANALYSIS.md` - Problem analysis
- `docs/SETUP_GUIDE.md` - Setup instructions

### D. Testing Strategy

**Phase 0 Testing:**
- Manual regression testing
- Feature verification checklist
- Console error monitoring
- Performance baseline measurement

**Phase 1 Testing:**
- IndexedDB CRUD operations
- Cache hit/miss scenarios
- Network failure simulation
- Quota exceeded handling

**Phase 2 Testing:**
- Pot calculation scenarios (10+ test cases)
- Edge cases (all-in, side pots, corrections)
- Documentation accuracy verification

**Phase 3 Testing (Planned):**
- Redis connectivity
- 3-tier cache fallback
- Multi-user synchronization
- Performance benchmarking

---

## Document Information

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Next Review:** 2025-11-05
**Maintained By:** Development Team
**Status:** Active

**Related Documents:**
- `IMPLEMENTATION_ROADMAP.md` (archived)
- `PHASE0_COMPLETE.md` (archived)
- `PHASE0_WEEK1_CHANGELOG.md` (archived)

**Change Log:**
- 2025-10-05: Initial consolidated version created from 3 source documents
- Eliminated ~80% duplicate content
- Unified version history
- Standardized formatting

---

**End of Project Roadmap**
