/**
 * 원본 loadInitial() 함수 백업
 * 백업 일시: 2025-09-23
 * Phase 3 구현 전 백업
 */

async function loadInitial(){
  openLogModal(); el.logDisplay.innerHTML='';
  logMessage(`🚀 ${APP_VERSION} 초기 데이터 로딩 시작 (Type/Index) ...`);
  try{
    const [typeRows, idxRows] = await Promise.all([
      CSV_TYPE_URL.includes('http')? fetchCsv(CSV_TYPE_URL) : Promise.resolve([]),
      CSV_INDEX_URL.includes('http')? fetchCsv(CSV_INDEX_URL) : Promise.resolve([])
    ]);
    if(typeRows.length) buildTypeFromCsv(typeRows);
    if(idxRows.length) buildIndexFromCsv(idxRows);
    window.state.actionState.handNumber = (window.state.allHandNumbers.length>0? Math.max(...window.state.allHandNumbers.map(n=>parseInt(n,10)||0)) + 1 : 1).toString();
    el.handNumberDisplay.textContent = `#${window.state.actionState.handNumber}`;
    el.dataStamp.textContent = `IDX rows: ${window.state.indexRows.length}`;

    // Index에서 마지막 카메라 번호 찾기 및 localStorage 동기화
    logMessage('📷 카메라 번호 데이터 분석 시작...');

    if(window.state.indexRows.length > 0) {
      logMessage(`📊 총 ${window.state.indexRows.length}개의 핸드 데이터 검색 중...`);

      // 가장 최근 핸드 찾기 (핸드 번호 기준 내림차순)
      const sortedRows = window.state.indexRows.slice().sort((a,b) => {
        const numA = parseInt(a.handNumber, 10) || 0;
        const numB = parseInt(b.handNumber, 10) || 0;
        return numB - numA;
      });

      // 카메라 번호가 있는 가장 최근 핸드 찾기
      let maxCam1 = 0, maxCam2 = 0;
      let foundInHand = null;

      for(const row of sortedRows) {
        const cam1Num = parseInt(row.cam1no, 10) || 0;
        const cam2Num = parseInt(row.cam2no, 10) || 0;

        if(cam1Num > maxCam1) {
          maxCam1 = cam1Num;
          if(!foundInHand) foundInHand = row.handNumber;
        }
        if(cam2Num > maxCam2) {
          maxCam2 = cam2Num;
          if(!foundInHand) foundInHand = row.handNumber;
        }
      }

      if(foundInHand) {
        logMessage(`📍 핸드 #${foundInHand}에서 카메라 번호 발견`);
      }

      if(maxCam1 > 0) {
        localStorage.setItem('pokerHandLogger_lastCam1', String(maxCam1));
        logMessage(`✅ ${window.state.camPreset.cam1} 마지막 번호: ${maxCam1} → 다음 번호: ${pad4(maxCam1 + 1)}`);
      } else {
        logMessage(`⚠️ ${window.state.camPreset.cam1} 번호 데이터 없음 → 0001부터 시작`);
      }

      if(maxCam2 > 0) {
        localStorage.setItem('pokerHandLogger_lastCam2', String(maxCam2));
        logMessage(`✅ ${window.state.camPreset.cam2} 마지막 번호: ${maxCam2} → 다음 번호: ${pad4(maxCam2 + 1)}`);
      } else {
        logMessage(`⚠️ ${window.state.camPreset.cam2} 번호 데이터 없음 → 0001부터 시작`);
      }
    } else {
      logMessage('⚠️ Index 데이터가 비어있음 → 카메라 번호 0001부터 시작');
    }

    renderAll();
    logMessage(`✅ ${APP_VERSION} 초기 데이터 로딩 완료`);
  }catch(err){
    console.error(err); logMessage(`초기 로딩 실패: ${err.message}`, true);
  }finally{
    setTimeout(closeLogModal, 800);
  }
}