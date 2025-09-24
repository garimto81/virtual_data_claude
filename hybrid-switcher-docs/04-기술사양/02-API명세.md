# API 명세

## 1. API 개요

### 1.1 기본 정보
- **Base URL**: `https://api.switcher.example.com/v1`
- **인증**: Bearer Token (JWT)
- **형식**: JSON
- **버전**: v1.0.0

### 1.2 인증
```http
Authorization: Bearer <token>
Content-Type: application/json
```

### 1.3 응답 형식
```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2025-08-01T10:00:00Z"
}
```

## 2. 게임 상태 API

### 2.1 현재 게임 상태 조회
```http
GET /game/state
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "tableId": 1,
    "street": "FLOP",
    "pot": 2450,
    "players": [
      {
        "seat": 1,
        "status": "ACTIVE",
        "stack": 1500,
        "position": "BTN",
        "cards": null
      },
      {
        "seat": 2,
        "status": "FOLDED",
        "stack": 980,
        "position": "SB",
        "cards": null
      }
    ],
    "currentPlayer": 3,
    "lastAggressor": 1,
    "dealerPosition": 1
  }
}
```

### 2.2 게임 상태 업데이트
```http
POST /game/state
```

**요청 본문**:
```json
{
  "action": "UPDATE_STREET",
  "data": {
    "street": "TURN",
    "card": "Kh"
  }
}
```

## 3. 액션 처리 API

### 3.1 플레이어 액션 실행
```http
POST /game/action
```

**요청 본문**:
```json
{
  "type": "RAISE",
  "player": 3,
  "amount": 250,
  "timestamp": "2025-08-01T10:00:00Z"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "actionId": "act_123456",
    "processed": true,
    "newState": {
      "pot": 2700,
      "currentPlayer": 4,
      "lastAggressor": 3
    }
  }
}
```

### 3.2 액션 취소 (Undo)
```http
POST /game/action/undo
```

**요청 본문**:
```json
{
  "actionId": "act_123456"
}
```

### 3.3 액션 히스토리 조회
```http
GET /game/actions?sessionId={sessionId}&limit=10
```

**응답**:
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "act_123456",
        "type": "RAISE",
        "player": 3,
        "amount": 250,
        "timestamp": "2025-08-01T10:00:00Z",
        "street": "FLOP"
      }
    ],
    "total": 45,
    "page": 1
  }
}
```

## 4. 카메라 제어 API

### 4.1 카메라 전환
```http
POST /camera/switch
```

**요청 본문**:
```json
{
  "cameraId": 2,
  "preset": "player_closeup",
  "target": {
    "type": "seat",
    "value": 3
  },
  "transition": {
    "type": "cut",
    "duration": 0
  }
}
```

### 4.2 카메라 프리셋 조회
```http
GET /camera/presets
```

**응답**:
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "id": "wide_shot",
        "name": "Wide Shot",
        "camera": 1,
        "settings": {
          "pan": 0,
          "tilt": 0,
          "zoom": 1
        }
      },
      {
        "id": "player_closeup",
        "name": "Player Close-up",
        "camera": 2,
        "settings": {
          "pan": "dynamic",
          "tilt": -10,
          "zoom": 5
        }
      }
    ]
  }
}
```

### 4.3 PTZ 제어
```http
POST /camera/{cameraId}/ptz
```

**요청 본문**:
```json
{
  "pan": 45,
  "tilt": -15,
  "zoom": 3,
  "speed": 0.5
}
```

## 5. 오디오 제어 API

### 5.1 마이크 제어
```http
POST /audio/mic/{micId}/control
```

**요청 본문**:
```json
{
  "action": "unmute",
  "level": 75,
  "effects": {
    "noiseGate": true,
    "compression": true
  }
}
```

### 5.2 오디오 믹스 설정
```http
PUT /audio/mix
```

**요청 본문**:
```json
{
  "master": {
    "level": 85,
    "limiter": true
  },
  "channels": [
    {
      "id": 1,
      "source": "mic_1",
      "level": 70,
      "pan": 0
    }
  ]
}
```

## 6. 통계 API

### 6.1 세션 통계 조회
```http
GET /stats/session/{sessionId}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "duration": 3600,
    "handsPlayed": 45,
    "avgPotSize": 1250,
    "largestPot": 5500,
    "playerStats": [
      {
        "seat": 1,
        "vpip": 28.5,
        "pfr": 22.1,
        "aggression": 3.2,
        "winRate": 55.5
      }
    ]
  }
}
```

### 6.2 실시간 메트릭
```http
GET /stats/metrics/live
```

**응답**:
```json
{
  "success": true,
  "data": {
    "system": {
      "cpu": 25.5,
      "memory": 45.2,
      "latency": 12
    },
    "game": {
      "activeTables": 2,
      "totalPlayers": 12,
      "actionsPerMinute": 8.5
    }
  }
}
```

## 7. WebSocket API

### 7.1 연결
```javascript
const ws = new WebSocket('wss://api.switcher.example.com/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'SUBSCRIBE',
    channels: ['game_state', 'actions']
  }));
});
```

### 7.2 이벤트 구독
#### 게임 상태 변경
```json
{
  "type": "GAME_STATE_UPDATE",
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "changes": {
      "currentPlayer": 4,
      "pot": 2700
    }
  }
}
```

#### 액션 발생
```json
{
  "type": "ACTION_OCCURRED",
  "data": {
    "action": {
      "type": "CALL",
      "player": 4,
      "amount": 250
    }
  }
}
```

## 8. 관리자 API

### 8.1 시스템 설정
```http
PUT /admin/settings
```

**요청 본문**:
```json
{
  "game": {
    "autoProgressDelay": 1000,
    "undoEnabled": true,
    "maxUndoSteps": 1
  },
  "camera": {
    "defaultTransition": "cut",
    "autoSwitchEnabled": true
  }
}
```

### 8.2 사용자 관리
```http
POST /admin/users
```

**요청 본문**:
```json
{
  "username": "operator1",
  "email": "operator1@example.com",
  "role": "OPERATOR",
  "permissions": ["game_control", "camera_control"]
}
```

## 9. 에러 처리

### 9.1 에러 응답 형식
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_ACTION",
    "message": "Cannot raise less than minimum",
    "details": {
      "minimum": 250,
      "attempted": 100
    }
  }
}
```

### 9.2 에러 코드
| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| AUTH_REQUIRED | 인증 필요 | 401 |
| FORBIDDEN | 권한 없음 | 403 |
| NOT_FOUND | 리소스 없음 | 404 |
| INVALID_ACTION | 잘못된 액션 | 400 |
| GAME_STATE_ERROR | 게임 상태 오류 | 409 |
| INTERNAL_ERROR | 서버 오류 | 500 |

## 10. Rate Limiting

### 10.1 제한 정책
- 일반 API: 100 requests/minute
- WebSocket: 50 messages/minute
- 관리자 API: 30 requests/minute

### 10.2 헤더 정보
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627890000
```