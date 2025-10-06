# 버전 관리 가이드

## ⚠️ 중요: 순환 의존성 문제

**절대 하지 말 것**:
- ❌ index.html에서 `window.__store__.constants.APP.VERSION` 참조
- ❌ 런타임에 버전을 동적으로 가져오기

**이유**:
- store.js가 로드되기 전에 APP_VERSION이 필요함
- 순환 의존성 (Circular Dependency) 발생
- `Cannot read properties of undefined` 에러

## ✅ 올바른 방법: 하드코딩 + 자동화

### 버전 정보 위치 (3곳)

1. **index.html** (line 877-878)
   ```javascript
   const APP_VERSION = 'v3.14.0';
   const VERSION_DATE = '2025-10-06';
   ```

2. **src/core/store.js** (line 73, 91-92)
   ```javascript
   config: {
     version: '3.14.0',  // ← 여기
   }
   constants: {
     APP: {
       VERSION: 'v3.14.0',      // ← 여기
       VERSION_DATE: '2025-10-06'  // ← 여기
     }
   }
   ```

3. **package.json** (line 3)
   ```json
   {
     "version": "3.14.0"
   }
   ```

## 🤖 자동 업데이트 (권장)

### 사용법

```bash
npm run version:update 3.15.0 "Step 4 확장 완료"
```

### 자동 업데이트되는 위치 (총 9곳)

1. `src/core/store.js` - config.version
2. `src/core/store.js` - constants.APP.VERSION
3. `src/core/store.js` - constants.APP.VERSION_DATE
4. `index.html` - APP_VERSION 상수
5. `index.html` - VERSION_DATE 상수
6. `index.html` - 헤더 Version 라인
7. `index.html` - Last Modified
8. `index.html` - Change Log 추가
9. `package.json` - version & description

### 장점
- **한 번의 명령**으로 9곳 동기화
- **오타 방지**
- **일관성 보장**

## 📋 수동 업데이트 체크리스트

수동으로 할 경우 다음을 **반드시 모두** 수정해야 합니다:

- [ ] `src/core/store.js:73` - config.version
- [ ] `src/core/store.js:91` - constants.APP.VERSION
- [ ] `src/core/store.js:92` - constants.APP.VERSION_DATE
- [ ] `index.html:877` - APP_VERSION
- [ ] `index.html:878` - VERSION_DATE
- [ ] `index.html:5` - 헤더 Version
- [ ] `index.html:6` - Last Modified
- [ ] `index.html:9+` - Change Log 추가
- [ ] `package.json:3` - version

**누락 시 증상**:
- 앱 화면에 구버전 표시
- 콘솔 로그에 잘못된 버전
- package.json과 불일치

## 🔍 버전 확인 방법

### 방법 1: 브라우저 콘솔
```javascript
// 방법 1: 전역 변수
console.log(APP_VERSION);  // v3.14.0

// 방법 2: store (모듈 로드 후)
console.log(window.__store__.constants.APP.VERSION);  // v3.14.0
```

### 방법 2: 화면
- 상단바 또는 설정 모달에서 "버전" 확인

### 방법 3: package.json
```bash
cat package.json | grep version
```

## 🚨 트러블슈팅

### 문제: 앱에 구버전 표시
**원인**: index.html의 APP_VERSION이 업데이트 안됨

**해결**:
```bash
npm run version:update 3.14.0 "버전 동기화"
```

### 문제: Cannot read properties of undefined
**원인**: index.html에서 `window.__store__.constants` 참조 시도

**해결**:
```javascript
// ❌ 절대 이렇게 하지 말 것
const APP_VERSION = window.__store__.constants.APP.VERSION;

// ✅ 올바른 방법: 하드코딩
const APP_VERSION = 'v3.14.0';
```

### 문제: APP_VERSION is not defined
**원인**: store.js가 로드되기 전에 APP_VERSION 참조

**해결**:
```javascript
// store.js
version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '3.14.0',
//       ↑ 이미 안전 장치 있음. 폴백 버전만 업데이트하면 됨
```

## 📝 커밋 메시지 형식

```bash
# 버전 업데이트만
git commit -m "chore: v3.15.0 버전 업데이트"

# 기능과 함께
git commit -m "feat: Step 4 확장 - Hand Recorder 완전 분리

- generateRows_v46() 분리
- buildIndexMeta() 분리
- buildTypeUpdates() 분리

버전: v3.15.0
"
```

## 💡 Best Practices

### DO ✅
- 자동화 스크립트 사용
- 커밋 전 앱 실행하여 버전 확인
- 변경사항을 Change Log에 기록
- 의미 있는 버전 설명 작성

### DON'T ❌
- 런타임에 버전 동적으로 가져오기 시도
- 일부 파일만 수동 수정
- 버전 확인 없이 커밋
- store에서 index.html 참조 (순환 의존성)
