# 📚 Documentation v5.0

> **포커 테이블 모니터링 시스템 - 설계 문서**
> **최종 업데이트**: 2025-10-05

---

## 📖 문서 구조

### 핵심 문서 (3개)

#### 1. [PRD.md](./PRD.md) - 제품 요구사항 정의서
**목적**: 제품의 비전, 핵심 기능, 사용자 시나리오 정의

**주요 내용**:
- 🎯 제품 비전: 키 플레이어가 앉은 테이블의 모든 활동 추적
- 🗂️ 핵심 기능:
  - F1. 테이블 플레이어 관리 모드
  - F2. 핸드 기록 모드
  - F3. 빠른 테이블 전환
- 📱 사용자 시나리오: 데이터 매니저의 하루 워크플로우
- ⚡ 성능 요구사항: 테이블 전환 < 1초, 핸드 시작 < 0.5초

**읽어야 할 사람**: 전체 팀 (필수)

---

#### 2. [LLD.md](./LLD.md) - 저수준 설계 문서
**목적**: 기술 아키텍처, 도메인 모델, API 설계

**주요 내용**:
- 🏗️ 3-Layer Architecture:
  - Domain Layer (Table, Hand, Player, Action)
  - Application Layer (Use Cases)
  - Presentation Layer (Views)
  - Infrastructure Layer (Storage, Sync)
- 📦 Domain Model:
  - Table Aggregate
  - Hand Aggregate
  - Player Entity
  - Action Value Object
- 🔄 Data Flow: Local-First 아키텍처
- 📁 폴더 구조: 모듈별 파일 구성

**읽어야 할 사람**: 개발자 (필수), PM (선택)

---

#### 3. [PLAN.md](./PLAN.md) - 4주 구현 계획
**목적**: 개발 일정, 작업 할당, 마일스톤 정의

**주요 내용**:
- 📅 주차별 계획:
  - Week 1: Domain Agents (4개)
  - Week 2: Infrastructure Agents (2개)
  - Week 3: Application + UI Agents (3개)
  - Week 4: Orchestrator + 배포
- ✅ 일일 체크리스트
- 🚨 리스크 관리
- 📊 작업 매트릭스

**읽어야 할 사람**: 전체 팀 (필수)

---

### 아키텍처 문서 (1개)

#### 4. [AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md) - 서브 에이전트 시스템 설계
**목적**: 대규모 프로젝트의 에이전트 기반 개발 체계

**주요 내용**:
- 🤖 10개 서브 에이전트 정의:
  - **Layer 1**: Orchestrator Agent (총괄)
  - **Layer 2**: Domain Agents (4개)
  - **Layer 3**: Application Agents (2개)
  - **Layer 4**: Infrastructure Agents (3개)
- 🔄 Event Bus 통신 프로토콜
- 🎭 에이전트 조율 메커니즘
- 📊 모니터링 및 디버깅

**읽어야 할 사람**: 아키텍트, 시니어 개발자 (필수)

---

## 🗂️ 문서 변경 이력

### v5.0 (2025-10-05) - 완전 재설계
**변경 사항**:
- ✅ PRD, LLD, PLAN 완전 재작성
- ✅ 워크플로우 중심 설계로 전환
- ✅ 키 플레이어 추적 → 테이블 → 모든 플레이어 관리 구조
- ✅ 두 가지 모드 명확화 (테이블 관리 ↔ 핸드 기록)
- ✅ 서브 에이전트 아키텍처 추가
- ✅ Hand 시트 구조 심층 분석 및 최적화 방안 제시

**제거된 문서**:
- ❌ API_REFERENCE.md (LLD로 통합)
- ❌ PHASE7_REFACTORING_PLAN.md (구조 변경으로 불필요)
- ❌ TECHNICAL_DESIGN.md (LLD로 대체)

**제거된 모듈** (7개):
- ❌ cache-manager.js (미사용)
- ❌ api-batcher.js (미사용)
- ❌ lazy-loader.js (미사용)
- ❌ performance-monitor.js (미사용)
- ❌ duplicate-remover.js (도메인 모델로 해결)
- ❌ phase4-functions.js (Result 패턴으로 대체)
- ❌ double-tap-handler.js (위험 기반 확인으로 대체)

---

## 🚀 빠른 시작 가이드

### 1. 문서 읽기 순서 (신규 팀원)

```
1. PRD.md (30분)
   ↓
2. 사용자 시나리오 이해 (15분)
   ↓
3. LLD.md - 3-Layer Architecture (1시간)
   ↓
4. AGENT_ARCHITECTURE.md - 에이전트 구조 (1시간)
   ↓
5. PLAN.md - 담당 작업 확인 (30분)
```

**총 소요 시간**: 약 3시간

---

### 2. 개발 시작하기

#### Step 1: 담당 에이전트 확인
[PLAN.md](./PLAN.md)에서 주차별 에이전트 할당 확인

#### Step 2: 에이전트 역할 이해
[AGENT_ARCHITECTURE.md](./AGENT_ARCHITECTURE.md)에서 담당 에이전트의:
- 책임 (Responsibility)
- 작업 범위 (Scope)
- API 인터페이스
- 입력/출력 이벤트

#### Step 3: 도메인 모델 학습
[LLD.md](./LLD.md)에서 관련 도메인 모델 학습:
- Table, Hand, Player, Action

#### Step 4: TDD로 개발
```typescript
// 1. 테스트 작성
describe('TableAgent', () => {
  test('should create table', () => {
    // ...
  });
});

// 2. 구현
class TableAgent {
  createTable() {
    // ...
  }
}

// 3. 리팩토링
```

---

## 📊 문서별 주요 개념 매핑

### 핵심 개념 연결 테이블

| 개념 | PRD | LLD | AGENT_ARCHITECTURE | PLAN |
|------|-----|-----|-------------------|------|
| **키 플레이어 추적** | ✅ F3 | - | TableManagementAgent | Week 3 |
| **테이블 플레이어 관리** | ✅ F1 | Table Aggregate | TableAgent | Week 1 |
| **핸드 기록** | ✅ F2 | Hand Aggregate | HandAgent | Week 1 |
| **자동 핸드 증가** | ✅ F2 | Hand.createNext() | HandRecordingAgent | Week 3 |
| **로컬 우선** | ✅ NF1 | LocalStorageRepository | StorageAgent | Week 2 |
| **백그라운드 동기화** | ✅ NF1 | BackgroundSync | SyncAgent | Week 2 |
| **성능 목표** | ✅ NF2 | - | - | Day 18 (성능 테스트) |

---

## 🔍 주요 의사결정 기록 (ADR)

### ADR-001: 워크플로우 중심 설계 채택
- **날짜**: 2025-10-05
- **상황**: 기존 기능 중심 설계가 사용성 문제 야기
- **결정**: 키 플레이어 추적 → 테이블 → 모든 플레이어 관리 흐름으로 재설계
- **결과**: 사용자 경험 개선, 코드 복잡도 감소

### ADR-002: 서브 에이전트 아키텍처 도입
- **날짜**: 2025-10-05
- **상황**: 7,992 라인 단일 파일로 인한 개발 생산성 50% 저하
- **결정**: 10개 독립 에이전트로 분리, Event Bus 기반 통신
- **결과**: 병렬 개발 가능, 결합도 최소화

### ADR-003: Local-First 아키텍처
- **날짜**: 2025-10-05
- **상황**: 오프라인 지원 필수
- **결정**: 모든 작업 로컬 완료 → 백그라운드 서버 동기화
- **결과**: 오프라인 100% 지원, 성능 향상

### ADR-004: Google Sheets를 복합 키로 처리
- **날짜**: 2025-10-05
- **상황**: 핸드 번호 중복 문제 (테이블별 리셋)
- **결정**: `tableId#handNumber` 복합 키 사용
- **결과**: 유일성 보장, 데이터 무결성 향상

---

## 🎯 성공 기준 체크리스트

### 설계 품질
- [x] PRD에 모든 요구사항 명시
- [x] LLD에 3-Layer Architecture 정의
- [x] 10개 에이전트 역할 명확히 정의
- [x] 4주 구현 계획 수립

### 기술 목표
- [ ] 테스트 커버리지 > 90%
- [ ] 성능 목표 100% 달성
- [ ] 에이전트 간 통신 검증
- [ ] E2E 테스트 통과

### 비즈니스 목표
- [ ] 키 플레이어 추적 < 1초
- [ ] 핸드 기록 < 0.5초
- [ ] 오프라인 100% 지원
- [ ] 데이터 손실 0%

---

## 📞 문의 및 피드백

### 문서 관련 질문
- PRD 관련: Product Manager
- LLD 관련: Tech Lead / Architect
- PLAN 관련: Project Manager
- AGENT_ARCHITECTURE 관련: Architect

### 문서 업데이트 프로세스
1. 변경 사항을 로컬 브랜치에서 작업
2. Pull Request 생성
3. 관련자 리뷰 (최소 1명)
4. 승인 후 병합
5. 버전 번호 업데이트

---

## 📝 용어집

### 도메인 용어
- **키 플레이어**: 키 플레이어, Keyplayer (TRUE 플래그)
- **테이블**: Poker Room + Table Name 조합
- **핸드**: 카드 게임의 한 라운드
- **액션**: BET, CALL, RAISE, FOLD, ALLIN

### 기술 용어
- **Aggregate**: DDD에서 일관성 경계를 가진 엔티티 집합
- **Value Object**: 불변 값 객체
- **Repository**: 데이터 접근 추상화 계층
- **Event Bus**: 에이전트 간 비동기 메시지 전달 버스

---

**문서 버전**: v5.0
**마지막 업데이트**: 2025-10-05
**승인자**: _______________
