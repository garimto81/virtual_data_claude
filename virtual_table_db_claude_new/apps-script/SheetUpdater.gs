/****************************************************
 * Virtual Table Sheet Updater - Apps Script v1.1
 * 
 * 기능:
 * - Virtual 시트의 F열(파일명), H열(AI분석) 업데이트
 * - B열 시간 기준으로 매칭된 행에 데이터 업데이트
 * - CORS 정책 우회를 통한 안전한 시트 접근
 * - Gemini AI를 통한 포커 핸드 자동 분석
 ****************************************************/

// ===== 설정 =====

// Gemini API 키 (Apps Script 스크립트 속성에서 설정)
// PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'YOUR_API_KEY');
const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

// ===== 메인 핸들러 =====

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    method: 'GET',
    time: new Date().toISOString(),
    version: 'v1.1',
    service: 'Virtual Table Sheet Updater',
    features: ['Sheet Update', 'Gemini AI Analysis', 'Auto Analysis'],
    gemini_enabled: !!GEMINI_API_KEY
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    console.log('📥 Sheet Updater POST 요청 수신:', e);
    
    const body = _parseRequestBody(e) || {};
    console.log('📋 파싱된 요청 데이터:', JSON.stringify(body));
    
    // 빈 요청 체크
    if (!body || Object.keys(body).length === 0) {
      return _json({
        status: 'error',
        message: '요청 데이터가 비어있습니다',
        received: JSON.stringify(e.parameter || {})
      });
    }
    
    const action = body.action;
    
    if (action === 'updateSheet') {
      return handleSheetUpdate(body);
    } else if (action === 'analyzeHand') {
      return handleHandAnalysis(body);
    } else {
      return _json({
        status: 'error',
        message: `지원되지 않는 액션: ${action}`
      });
    }
    
  } catch (error) {
    console.error('❌ doPost 오류:', error);
    return _json({
      status: 'error',
      message: String(error && error.message || error),
      stack: String(error && error.stack || '')
    });
  }
}

// ===== 시트 업데이트 핸들러 =====

function handleSheetUpdate(data) {
  try {
    console.log('🔄 시트 업데이트 시작...');
    
    const {
      sheetUrl,
      rowNumber,
      handNumber,
      filename,
      aiAnalysis,
      timestamp
    } = data;
    
    // 필수 데이터 검증
    if (!sheetUrl) {
      throw new Error('시트 URL이 필요합니다');
    }
    
    if (!rowNumber || isNaN(parseInt(rowNumber))) {
      throw new Error('유효한 행 번호가 필요합니다');
    }
    
    if (!filename || !filename.trim()) {
      throw new Error('파일명이 필요합니다');
    }
    
    console.log(`📊 업데이트 정보:
      - 시트 URL: ${sheetUrl}
      - 행 번호: ${rowNumber}
      - 핸드 번호: ${handNumber}
      - 파일명: ${filename}
      - AI 분석: ${aiAnalysis}`);
    
    // 시트 ID 추출
    const sheetId = _extractSheetId(sheetUrl);
    if (!sheetId) {
      throw new Error('시트 URL에서 ID를 추출할 수 없습니다');
    }
    
    const gid = _extractGid(sheetUrl) || '0';
    console.log(`🔗 시트 ID: ${sheetId}, GID: ${gid}`);
    
    // 스프레드시트 열기
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = gid === '0' ? 
      spreadsheet.getSheets()[0] : 
      spreadsheet.getSheets().find(s => s.getSheetId() == gid);
    
    if (!sheet) {
      throw new Error(`GID ${gid}에 해당하는 시트를 찾을 수 없습니다`);
    }
    
    console.log(`📋 시트 이름: "${sheet.getName()}"`);
    
    const targetRow = parseInt(rowNumber);
    const maxRow = sheet.getLastRow();
    
    if (targetRow > maxRow) {
      throw new Error(`대상 행 ${targetRow}이 시트 범위(최대 ${maxRow}행)를 초과합니다`);
    }
    
    // F열(6)에 파일명 업데이트
    sheet.getRange(targetRow, 6).setValue(filename);
    console.log(`✅ F${targetRow} 파일명 업데이트: "${filename}"`);
    
    // AI 분석 수행 (비어있거나 기본값인 경우)
    let finalAnalysis = aiAnalysis;
    if (!aiAnalysis || aiAnalysis === '분석 실패' || aiAnalysis.trim() === '') {
      console.log('🤖 AI 분석 시작...');
      try {
        finalAnalysis = await analyzePokerHand({
          handNumber: handNumber,
          filename: filename,
          timestamp: timestamp
        });
        console.log(`✅ AI 분석 완료: "${finalAnalysis}"`);
      } catch (aiError) {
        console.error('❌ AI 분석 실패:', aiError);
        finalAnalysis = '분석 실패';
      }
    }
    
    // H열(8)에 AI 분석 업데이트
    sheet.getRange(targetRow, 8).setValue(finalAnalysis);
    console.log(`✅ H${targetRow} AI 분석 업데이트: "${finalAnalysis}"`);
    
    // 업데이트 시간을 I열(9)에 기록 (선택사항)
    const updateTime = new Date();
    sheet.getRange(targetRow, 9).setValue(updateTime);
    console.log(`✅ I${targetRow} 업데이트 시간: ${updateTime}`);
    
    console.log('✅ 시트 업데이트 완료!');
    
    return _json({
      status: 'success',
      message: '시트 업데이트 완료',
      data: {
        sheetName: sheet.getName(),
        rowNumber: targetRow,
        filename: filename,
        aiAnalysis: finalAnalysis,
        updatedAt: updateTime.toISOString(),
        handNumber: handNumber
      }
    });
    
  } catch (error) {
    console.error('❌ 시트 업데이트 오류:', error);
    return _json({
      status: 'error',
      message: `시트 업데이트 실패: ${error.message}`,
      stack: error.stack
    });
  }
}

// ===== AI 분석 핸들러 =====

function handleHandAnalysis(data) {
  try {
    console.log('🤖 AI 핸드 분석 요청 수신...');
    
    const { handNumber, filename, timestamp, handData } = data;
    
    if (!handNumber && !filename) {
      throw new Error('핸드 번호 또는 파일명이 필요합니다');
    }
    
    const analysisResult = analyzePokerHand({
      handNumber: handNumber,
      filename: filename,
      timestamp: timestamp,
      handData: handData
    });
    
    return _json({
      status: 'success',
      message: 'AI 분석 완료',
      data: {
        handNumber: handNumber,
        filename: filename,
        analysis: analysisResult,
        analyzedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ AI 분석 오류:', error);
    return _json({
      status: 'error',
      message: `AI 분석 실패: ${error.message}`,
      analysis: '분석 실패',
      stack: error.stack
    });
  }
}

async function analyzePokerHand(params) {
  try {
    console.log('🧠 Gemini AI 포커 핸드 분석 시작...');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
    }
    
    const { handNumber, filename, timestamp, handData } = params;
    
    // Gemini AI 프롬프트 구성
    const prompt = `
포커 핸드 분석을 요청합니다.

핸드 정보:
- 핸드 번호: ${handNumber || 'N/A'}
- 파일명: ${filename || 'N/A'}
- 시간: ${timestamp || 'N/A'}
- 추가 데이터: ${handData ? JSON.stringify(handData) : 'N/A'}

다음 형식으로 간단하게 분석해주세요:
"[플레이어 액션] - [핸드 강도] - [권장사항]"

예시: "리버 블러프 - 약한 핸드 - 폴드 권장"

50자 이내로 간단명료하게 작성해주세요.
`;

    // Gemini API 호출
    const response = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        }
      })
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Gemini API 오류: ${response.getResponseCode()}`);
    }
    
    const responseData = JSON.parse(response.getContentText());
    console.log('🔍 Gemini API 응답:', JSON.stringify(responseData));
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
      throw new Error('유효하지 않은 Gemini API 응답');
    }
    
    const analysis = responseData.candidates[0].content.parts[0].text;
    console.log(`✅ AI 분석 결과: "${analysis}"`);
    
    // 분석 결과 검증 및 정리
    const cleanedAnalysis = analysis.trim().substring(0, 50);
    return cleanedAnalysis || '분석 완료';
    
  } catch (error) {
    console.error('❌ Gemini AI 분석 실패:', error);
    throw error;
  }
}

// ===== 유틸리티 함수 =====

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseRequestBody(e) {
  // 1) form-urlencoded / multipart 방식
  if (e && e.parameter && typeof e.parameter.payload === 'string') {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (err) {
      console.error('payload 파싱 실패:', err);
      return {};
    }
  }
  
  // 2) application/json 방식
  if (e && e.postData && e.postData.type && 
      e.postData.type.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(e.postData.contents || '{}');
    } catch (err) {
      console.error('JSON 파싱 실패:', err);
      return {};
    }
  }
  
  return {};
}

function _extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function _extractGid(url) {
  const match = url.match(/gid=(\d+)/);
  return match ? match[1] : null;
}

// ===== 테스트 함수 =====

function testSheetUpdate() {
  const testData = {
    action: 'updateSheet',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE/edit?gid=561799849#gid=561799849',
    rowNumber: 2,
    handNumber: 'TEST_001',
    filename: 'test_hand_001.mp4',
    aiAnalysis: '', // 빈 값으로 설정하여 AI 분석 자동 실행 테스트
    timestamp: new Date().toISOString()
  };
  
  console.log('🧪 시트 업데이트 테스트 시작...');
  const result = handleSheetUpdate(testData);
  console.log('🧪 테스트 결과:', result.getContent());
  
  return JSON.parse(result.getContent());
}

function testAIAnalysis() {
  const testData = {
    action: 'analyzeHand',
    handNumber: 'AI_TEST_001',
    filename: 'ai_test_hand.mp4',
    timestamp: new Date().toISOString(),
    handData: {
      action: 'bluff',
      street: 'river',
      position: 'button'
    }
  };
  
  console.log('🧪 AI 분석 테스트 시작...');
  const result = handleHandAnalysis(testData);
  console.log('🧪 AI 분석 테스트 결과:', result.getContent());
  
  return JSON.parse(result.getContent());
}

function testConnection() {
  try {
    console.log('🧪 연결 테스트 시작...');
    
    const testSheetId = '1M-LM2KkwLNOTygtrPVdnYLqqBoz4MmZvbglUaptSYqE';
    const spreadsheet = SpreadsheetApp.openById(testSheetId);
    const sheet = spreadsheet.getSheets()[0];
    
    console.log(`✅ 시트 연결 성공: "${sheet.getName()}" (${sheet.getLastRow()}행)`);
    
    return {
      status: 'success',
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn()
    };
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}