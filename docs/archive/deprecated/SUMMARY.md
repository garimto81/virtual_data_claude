# 📋 프로젝트 종합 요약 v5.0

> **포커 테이블 모니터링 시스템 - 완전 재설계**
> **최종 업데이트**: 2025-10-05

---

## 🎯 프로젝트 개요

### 핵심 목표
**키 플레이어가 앉은 테이블의 모든 활동을 실시간 추적하여, 카지노가 게임 데이터를 분석하고 키 플레이어를 효과적으로 관리할 수 있게 한다**

### 현재 상황
- ❌ **문제**: 7,992 라인 단일 파일 (index.html)
- ❌ **생산성 저하**: 50% 감소
- ❌ **Git 충돌**: 90% 발생률
- ❌ **복잡도**: 134개 함수, 802개 변수

### 해결 방안
- ✅ **Domain-Driven Design** 기반 재설계
- ✅ **Multi-Agent Architecture** (10개 독립 에이전트)
- ✅ **워크플로우 중심** 설계 (기능 중심 → 업무 흐름 중심)
- ✅ **자동 확장 시스템** (코드 증가 시 서브 에이전트 자동 분할)

---

## 📚 문서 구조 (7개)

### 1. 📋 [PRD.md](./PRD.md) - 제품 요구사항 정의서
**목적**: 제품 비전, 핵심 기능, 사용자 시나리오

**핵심 내용**:
- 🎯 제품 비전: 키 플레이어 추적 → 테이블 → 모든 플레이어 관리
- 🗂️ 핵심 기능:
  - **F1. 테이블 플레이어 관리 모드**: 키 플레이어가 앉은 테이블의 모든 플레이어 관리
  - **F2. 핸드 기록 모드**: 모든 플레이어 액션 기록 (키 플레이어 액션 강조)
  - **F3. 빠른 테이블 전환**: 키 플레이어 검색, 최근 테이블, 즐겨찾기
- ⚡ 성능 목표:
  - 테이블 전환: < 1초
  - 핸드 시작: < 0.5초
  - 액션 기록: < 0.3초

---

### 2. 🏗️ [LLD.md](./LLD.md) - 저수준 설계 문서
**목적**: 기술 아키텍처, 도메인 모델, API 설계

**핵심 내용**:
- 🏗️ **3-Layer Architecture**:
  - **Domain Layer**: Table, Hand, Player, Action (Aggregates & Entities)
  - **Application Layer**: Use Cases (FindTableBy키 플레이어, StartNewHand, RecordAction...)
  - **Presentation Layer**: Views (TableManagementView, HandRecordingView)
  - **Infrastructure Layer**: Storage, Sync (LocalStorage, Google Sheets)

- 📦 **Domain Model**:
  ```typescript
  Table (Aggregate) → 플레이어 관리, 키 플레이어 추적
  Hand (Aggregate) → 핸드 기록, 액션 관리
  Player (Entity) → 플레이어 정보
  Action (Value Object) → 액션 데이터
  ```

- 🔄 **Local-First Architecture**:
  - 모든 작업 로컬 완료 → 백그라운드 서버 동기화
  - 오프라인 100% 지원

---

### 3. 📅 [PLAN.md](./PLAN.md) - 4주 구현 계획
**목적**: 개발 일정, 에이전트별 작업 할당

**주차별 계획**:
- **Week 1**: Domain Agents (4개) - TDD 방식
  - Table, Hand, Player, Action Agents
- **Week 2**: Infrastructure Agents (2개)
  - Storage, Sync Agents
- **Week 3**: Application + UI Agents (3개)
  - TableManagement, HandRecording, UI Agents
- **Week 4**: Orchestrator + 배포
  - 통합 테스트, 성능 최적화, 배포

**개발 방식**:
- ✅ TDD (Test-Driven Development)
- ✅ 병렬 개발 (에이전트 독립)
- ✅ 이벤트 기반 통신

---

### 4. 🤖 [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - 서브 에이전트 시스템
**목적**: 대규모 프로젝트의 에이전트 기반 개발 체계

**10개 에이전트 구조**:
```
Orchestrator Agent (총괄 조율자)
    │
    ├─ Domain Agents (도메인 전문가, 4개)
    │   ├─ Table Agent: 테이블 Aggregate
    │   ├─ Hand Agent: 핸드 Aggregate
    │   ├─ Player Agent: 플레이어 Entity
    │   └─ Action Agent: 액션 Value Object
    │
    ├─ Application Agents (유스케이스 전문가, 2개)
    │   ├─ Table Management Agent: 키 플레이어 검색, 플레이어 관리
    │   └─ Hand Recording Agent: 핸드 시작, 액션 기록
    │
    └─ Infrastructure Agents (인프라 전문가, 3개)
        ├─ Storage Agent: IndexedDB
        ├─ Sync Agent: Google Sheets 동기화
        └─ UI Agent: View 렌더링
```

**통신 프로토콜**:
- **Event Bus**: 비동기 메시지 전달
- **느슨한 결합**: 직접 호출 금지
- **표준 이벤트**: `{ type, timestamp, source, data, correlationId }`

---

### 5. 🗄️ [INDEXEDDB_STRATEGY.md](./INDEXEDDB_STRATEGY.md) - IndexedDB 관리 전략
**목적**: 로컬 데이터베이스 아키텍처

**5개 Object Stores**:
1. **tables**: 테이블 정보 (키 플레이어 인덱스)
2. **hands**: 핸드 상세 데이터
3. **handIndex**: Index.csv 직접 매핑 (메타데이터)
   - startRow, endRow (Hand 시트 행 번호)
   - workStatus (진행중, 완료, 검토필요)
   - lastStreet, lastAction
   - cameraFiles (영상 파일 정보)
4. **syncQueue**: 동기화 작업 큐
5. **settings**: 앱 설정

**핵심 전략**:
- ✅ **복합 키**: `tableId#handNumber`로 유일성 보장
- ✅ **다중 인덱스**: 키 플레이어, 테이블, 상태별 검색
- ✅ **백그라운드 동기화**: 30초마다 Google Sheets와 동기화
- ✅ **캐싱**: 최근 100개 핸드 메모리 캐시 (LRU)

---

### 6. 🔄 [AGENT_SCALING_STRATEGY.md](./AGENT_SCALING_STRATEGY.md) - 에이전트 자동 확장
**목적**: 코드 증가 시 자동 서브 에이전트 분할

**분할 기준**:
- 📏 **500줄 초과** 시 자동 분할
- 📏 **함수 20개 초과** 시 분할
- 📏 **순환 복잡도 50 초과** 시 분할

**자동화 도구**:
1. **CodeAnalyzer**: 코드 메트릭 분석
2. **AutoSplitter**: 자동 분할 실행
3. **MetricsDashboard**: 모니터링 대시보드

**분할 패턴**:
```typescript
// 예시: TableAgent (600줄) → 4개 서브 에이전트로 분할

TableAgent (부모, 100줄)
├─ TableCreationAgent (100줄)
├─ TablePlayerAgent (200줄)
├─ TableSearchAgent (150줄)
└─ TableValidationAgent (150줄)
```

**CI/CD 통합**:
```bash
# Git commit 시 자동 실행
git commit -m "feat: add feature"
# → 코드 분석 → 분할 필요 시 자동 분할 → 테스트 → 커밋
```

---

### 7. 📖 [README.md](./README.md) - 문서 인덱스
**목적**: 전체 문서 가이드

**빠른 시작**:
1. PRD 읽기 (30분) - 제품 이해
2. LLD 읽기 (1시간) - 아키텍처 이해
3. AGENT_ARCHITECTURE 읽기 (1시간) - 에이전트 구조 파악
4. PLAN 읽기 (30분) - 담당 작업 확인
5. 개발 시작!

---

## 🔍 핵심 의사결정 기록 (ADR)

### ADR-001: 워크플로우 중심 설계 채택
- **문제**: 기능 중심 설계로 인한 사용성 문제
- **결정**: 키 플레이어 추적 → 테이블 → 모든 플레이어 관리 흐름
- **결과**: UX 개선, 코드 복잡도 감소

### ADR-002: Multi-Agent Architecture 도입
- **문제**: 7,992 라인 단일 파일로 인한 생산성 50% 저하
- **결정**: 10개 독립 에이전트 + Event Bus 통신
- **결과**: 병렬 개발 가능, 결합도 최소화

### ADR-003: Local-First Architecture
- **문제**: 오프라인 지원 필수
- **결정**: 로컬 완료 → 백그라운드 동기화
- **결과**: 오프라인 100% 지원, 성능 향상

### ADR-004: Google Sheets 복합 키 전략
- **문제**: 핸드 번호 중복 (테이블별 리셋)
- **결정**: `tableId#handNumber` 복합 키
- **결과**: 유일성 보장, 데이터 무결성

### ADR-005: IndexedDB 5개 Store 분리
- **문제**: 빠른 검색 및 메타데이터 관리 필요
- **결정**: tables, hands, handIndex, syncQueue, settings 분리
- **결과**: 다중 인덱스 검색, 효율적 메타데이터 관리

### ADR-006: 자동 에이전트 분할 시스템
- **문제**: 코드 증가 시 복잡도 증가
- **결정**: 500줄 초과 시 자동 서브 에이전트 분할
- **결과**: 지속 가능한 코드베이스 유지

---

## 📊 주요 개념 매핑 테이블

| 개념 | PRD | LLD | AGENT_ARCHITECTURE | INDEXEDDB_STRATEGY | PLAN |
|------|-----|-----|-------------------|-------------------|------|
| **키 플레이어 추적** | F3 | - | TableManagementAgent | tables.vipPlayers 인덱스 | Week 3 |
| **테이블 관리** | F1 | Table Aggregate | TableAgent | tables Store | Week 1 |
| **핸드 기록** | F2 | Hand Aggregate | HandAgent | hands Store | Week 1 |
| **핸드 메타데이터** | - | - | - | handIndex Store (Index.csv) | Week 2 |
| **자동 핸드 증가** | F2 | Hand.createNext() | HandRecordingAgent | hands.handNumber | Week 3 |
| **로컬 우선** | NF1 | LocalStorageRepository | StorageAgent | IndexedDB 5개 Store | Week 2 |
| **백그라운드 동기화** | NF1 | BackgroundSync | SyncAgent | syncQueue Store | Week 2 |
| **자동 분할** | - | - | - | - | AutoSplitter (CI/CD) |

---

## 🎯 성능 목표 및 달성 방안

| 목표 | 기준 | 달성 방안 |
|------|------|-----------|
| **테이블 전환** | < 1초 | IndexedDB vipPlayers 인덱스, LRU 캐시 (5개) |
| **핸드 시작** | < 0.5초 | 로컬 우선 저장, 백그라운드 동기화 |
| **액션 기록** | < 0.3초 | 낙관적 UI 업데이트, 비동기 IndexedDB 저장 |
| **핸드 완료 + 자동 증가** | < 2초 | 배치 flush, 다음 핸드 프리로딩 |
| **오프라인 지원** | 100% | IndexedDB + syncQueue 재시도 메커니즘 |

---

## 🔧 기술 스택

### Frontend
- **언어**: TypeScript
- **UI**: Vanilla JS (경량화)
- **상태 관리**: Event Bus
- **로컬 DB**: IndexedDB

### Backend (Google Sheets)
- **Type 시트**: 테이블 플레이어 스냅샷
- **Hand 시트**: 핸드 상세 기록 (HAND, PLAYER, EVENT 행)
- **Index 시트**: 핸드 메타데이터 (startRow, endRow, workStatus 등)

### DevOps
- **테스트**: Jest (TDD)
- **빌드**: Webpack/Vite
- **CI/CD**: GitHub Actions + AutoSplitter
- **Git Hook**: pre-commit (자동 분할 감지)

---

## 📈 예상 개선 효과

### 개발 생산성
- ✅ **50% → 100%**: 병렬 개발로 생산성 2배 증가
- ✅ **Git 충돌 90% → 10%**: 에이전트별 파일 분리

### 코드 품질
- ✅ **테스트 커버리지**: 70% → 90%+
- ✅ **버그 밀도**: TDD로 90% 감소
- ✅ **유지보수성**: 단일 책임 원칙으로 향상

### 성능
- ✅ **테이블 전환**: 3초 → < 1초
- ✅ **핸드 기록**: 1초 → < 0.5초
- ✅ **오프라인 지원**: 0% → 100%

---

## 🚀 시작하기

### 1. 문서 읽기 순서 (신규 팀원)
```
1. PRD.md (30분) - 제품 비전 이해
   ↓
2. 사용자 시나리오 (15분) - 워크플로우 파악
   ↓
3. LLD.md (1시간) - 아키텍처 학습
   ↓
4. AGENT_ARCHITECTURE.md (1시간) - 에이전트 구조 이해
   ↓
5. INDEXEDDB_STRATEGY.md (30분) - 데이터베이스 전략 파악
   ↓
6. PLAN.md (30분) - 담당 작업 확인
   ↓
7. 개발 시작! 🎉
```

**총 소요 시간**: 약 4시간

---

### 2. 개발 환경 설정
```bash
# 1. 저장소 클론
git clone <repo-url>
cd virtual_data_claude

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 테스트 실행
npm test

# 5. 자동 분할 감지
npm run detect-split
```

---

### 3. 에이전트 개발 프로세스
```bash
# Step 1: 담당 에이전트 확인
# PLAN.md에서 주차별 에이전트 확인

# Step 2: TDD로 개발
# 1. 테스트 작성
npm run test:watch src/domain/table/__tests__/Table.test.ts

# 2. 구현
# src/domain/table/Table.ts 작성

# 3. 리팩토링
# 중복 제거, 성능 최적화

# Step 3: 커밋
git add .
git commit -m "feat(table-agent): implement Table aggregate"
# → 자동으로 분할 감지 및 실행

# Step 4: 푸시
git push origin feature/table-agent
```

---

## ✅ 성공 기준

### 설계 품질
- [x] PRD에 모든 요구사항 명시
- [x] LLD에 3-Layer Architecture 정의
- [x] 10개 에이전트 역할 명확히 정의
- [x] 4주 구현 계획 수립
- [x] IndexedDB 전략 수립
- [x] 자동 확장 시스템 설계

### 기술 목표
- [ ] 테스트 커버리지 > 90%
- [ ] 성능 목표 100% 달성
- [ ] 에이전트 간 통신 검증
- [ ] E2E 테스트 통과
- [ ] 자동 분할 시스템 동작 검증

### 비즈니스 목표
- [ ] 키 플레이어 추적 < 1초
- [ ] 핸드 기록 < 0.5초
- [ ] 오프라인 100% 지원
- [ ] 데이터 손실 0%

---

## 📞 문의 및 지원

### 문서 관련
- **PRD**: Product Manager
- **LLD**: Tech Lead / Architect
- **PLAN**: Project Manager
- **AGENT_ARCHITECTURE**: Architect
- **INDEXEDDB_STRATEGY**: Senior Developer
- **AGENT_SCALING_STRATEGY**: DevOps Engineer

### 기술 지원
- **이슈 등록**: GitHub Issues
- **토론**: GitHub Discussions
- **긴급 지원**: Slack #poker-monitor

---

## 🎉 결론

### 핵심 성과
1. **워크플로우 중심 재설계**: 기능 → 업무 흐름 전환
2. **Multi-Agent Architecture**: 10개 독립 에이전트 + Event Bus
3. **자동 확장 시스템**: 코드 증가 시 자동 분할
4. **완전한 오프라인 지원**: IndexedDB + syncQueue
5. **성능 최적화**: < 1초 목표 달성 전략

### 다음 단계
- [ ] Week 1: Domain Agents 개발 시작
- [ ] 자동 분할 도구 구현 (AutoSplitter)
- [ ] IndexedDB 스키마 구현
- [ ] 첫 번째 에이전트 TDD 완료

---

**프로젝트 버전**: v5.0
**최종 업데이트**: 2025-10-05
**문서 작성자**: AI Assistant
**승인자**: _______________
