/**
 * 대시보드 JavaScript
 * 통계 표시 및 차트 관리
 */

// 전역 변수
let dashboardData = {
    stats: null,
    recentHands: [],
    charts: {}
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('========================================');
    console.log('📊 대시보드 페이지 로드 시작');
    console.log('========================================');
    console.log(`⏰ 시작 시간: ${new Date().toISOString()}`);
    
    initDashboard();
    loadDashboardData();
    setupAutoRefresh();
    
    console.log('✅ 대시보드 초기화 프로세스 완료');
});

/**
 * 대시보드 초기화
 */
function initDashboard() {
    console.log('🔧 [INIT] 대시보드 초기화 시작...');
    console.log('  └─ Chart.js 로드 상태 확인 중...');
    
    // Chart.js가 로드되었는지 확인
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ [INIT] Chart.js가 아직 로드되지 않았습니다');
        console.log('  └─ 1초 후 재시도 예정...');
        setTimeout(initDashboard, 1000);
        return;
    }
    
    console.log('  ✓ Chart.js 로드 확인 완료');
    console.log('  └─ 차트 컨텍스트 설정 중...');
    
    // 차트 컨텍스트 설정
    const dailyCtx = document.getElementById('daily-hands-chart');
    const positionCtx = document.getElementById('position-winrate-chart');
    
    if (dailyCtx) {
        console.log('  └─ 일별 핸드 차트 생성 중...');
        dashboardData.charts.daily = createDailyChart(dailyCtx);
        console.log('    ✓ 일별 핸드 차트 생성 완료');
    } else {
        console.warn('  ⚠️ 일별 핸드 차트 엘리먼트를 찾을 수 없음');
    }
    
    if (positionCtx) {
        console.log('  └─ 포지션별 승률 차트 생성 중...');
        dashboardData.charts.position = createPositionChart(positionCtx);
        console.log('    ✓ 포지션별 승률 차트 생성 완료');
    } else {
        console.warn('  ⚠️ 포지션별 승률 차트 엘리먼트를 찾을 수 없음');
    }
    
    console.log('✅ [INIT] 대시보드 초기화 완료');
}

/**
 * 대시보드 데이터 로드
 */
async function loadDashboardData() {
    try {
        console.log('📡 [DATA] 대시보드 데이터 로딩 시작...');
        console.log('  └─ 로딩 오버레이 표시 중...');
        showLoading();
        
        console.log('  └─ Google Sheets API 호출 준비...');
        console.log(`    └─ API URL: ${(await getConfig()).appsScriptUrl}`);
        
        // API에서 데이터 가져오기
        console.log('  └─ 병렬 API 호출 시작...');
        console.log('    ├─ 통계 데이터 요청 (getStats)');
        console.log('    └─ 최근 핸드 데이터 요청 (getLatest, limit=10)');
        
        const startTime = Date.now();
        
        const [statsResponse, recentResponse] = await Promise.all([
            fetchStatistics().catch(err => {
                console.error('    ❌ 통계 로드 실패:', err.message);
                console.error('      └─ 에러 상세:', err);
                return { stats: null, error: err.message };
            }),
            fetchRecentHands(10).catch(err => {
                console.error('    ❌ 최근 핸드 로드 실패:', err.message);
                console.error('      └─ 에러 상세:', err);
                return { hands: [], error: err.message };
            })
        ]);
        
        const loadTime = Date.now() - startTime;
        console.log(`  ✓ API 호출 완료 (소요시간: ${loadTime}ms)`);
        
        // 응답 상태 확인
        console.log('  └─ API 응답 분석...');
        if (statsResponse.stats) {
            console.log(`    ✓ 통계 데이터: ${Object.keys(statsResponse.stats).length}개 필드`);
            console.log(`      └─ 총 핸드: ${statsResponse.stats.totalHands || 0}`);
        } else {
            console.warn('    ⚠️ 통계 데이터 없음');
        }
        
        if (recentResponse.hands) {
            console.log(`    ✓ 최근 핸드: ${recentResponse.hands.length}개`);
        } else {
            console.warn('    ⚠️ 최근 핸드 데이터 없음');
        }
        
        // 데이터 저장
        console.log('  └─ 데이터 저장 중...');
        dashboardData.stats = statsResponse.stats || {};
        dashboardData.recentHands = recentResponse.hands || [];
        console.log('    ✓ 로컬 데이터 저장 완료');
        
        // UI 업데이트
        console.log('  └─ UI 업데이트 시작...');
        console.log('    ├─ 요약 카드 업데이트...');
        updateSummaryCards(dashboardData.stats);
        console.log('    ├─ 차트 업데이트...');
        updateCharts(dashboardData.stats);
        console.log('    └─ 최근 핸드 테이블 업데이트...');
        updateRecentHandsTable(dashboardData.recentHands);
        
        console.log('  └─ 로딩 오버레이 숨김...');
        hideLoading();
        
        console.log('✅ [DATA] 대시보드 데이터 로딩 완료');
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ [DATA] 대시보드 데이터 로드 실패!');
        console.error('  └─ 에러:', error.message);
        console.error('  └─ 스택:', error.stack);
        showError('데이터를 불러올 수 없습니다. 콘솔을 확인하세요.');
        hideLoading();
    }
}

/**
 * 통계 가져오기
 */
async function fetchStatistics() {
    const config = await getConfig();
    
    return new Promise((resolve, reject) => {
        const callbackName = 'statsCallback_' + Date.now();
        const url = `${config.appsScriptUrl}?action=getStats&callback=${callbackName}`;
        
        console.log('    📊 [API] 통계 데이터 요청...');
        console.log(`      └─ Callback: ${callbackName}`);
        console.log(`      └─ URL: ${url}`);
        
        // JSONP 콜백 설정
        window[callbackName] = function(data) {
            console.log('      ✓ JSONP 콜백 호출됨');
            delete window[callbackName];
            document.head.removeChild(script);
            
            if (data.success !== false) {
                console.log('      ✓ 통계 데이터 수신 성공');
                console.log(`        └─ 데이터 키: ${Object.keys(data).join(', ')}`);
                resolve(data);
            } else {
                console.error('      ❌ API 에러:', data.error);
                reject(new Error(data.error || '통계 데이터 로드 실패'));
            }
        };
        
        // 스크립트 태그 생성
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            console.warn('      ⚠️ JSONP 로드 실패, fetch 폴백 시도...');
            delete window[callbackName];
            document.head.removeChild(script);
            
            // CORS 실패 시 일반 fetch 시도
            fetch(`${config.appsScriptUrl}?action=getStats`)
                .then(response => {
                    console.log('        └─ Fetch 응답 상태:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('        ✓ Fetch 성공');
                    resolve(data);
                })
                .catch(err => {
                    console.error('        ❌ Fetch도 실패:', err.message);
                    reject(err);
                });
        };
        
        console.log('      └─ JSONP 스크립트 태그 추가...');
        document.head.appendChild(script);
    });
}

/**
 * 최근 핸드 가져오기
 */
async function fetchRecentHands(limit = 10) {
    const config = await getConfig();
    
    return new Promise((resolve, reject) => {
        const callbackName = 'handsCallback_' + Date.now();
        const url = `${config.appsScriptUrl}?action=getLatest&limit=${limit}&callback=${callbackName}`;
        
        console.log('    🃏 [API] 최근 핸드 데이터 요청...');
        console.log(`      └─ Callback: ${callbackName}`);
        console.log(`      └─ Limit: ${limit}`);
        console.log(`      └─ URL: ${url}`);
        
        // JSONP 콜백 설정
        window[callbackName] = function(data) {
            console.log('      ✓ JSONP 콜백 호출됨');
            delete window[callbackName];
            document.head.removeChild(script);
            
            if (data.success !== false) {
                console.log('      ✓ 최근 핸드 데이터 수신 성공');
                console.log(`        └─ 핸드 수: ${data.hands ? data.hands.length : 0}`);
                console.log(`        └─ 전체 핸드: ${data.total || 0}`);
                resolve(data);
            } else {
                console.error('      ❌ API 에러:', data.error);
                reject(new Error(data.error || '최근 핸드 데이터 로드 실패'));
            }
        };
        
        // 스크립트 태그 생성
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            console.warn('      ⚠️ JSONP 로드 실패, fetch 폴백 시도...');
            delete window[callbackName];
            document.head.removeChild(script);
            
            // CORS 실패 시 일반 fetch 시도
            fetch(`${config.appsScriptUrl}?action=getLatest&limit=${limit}`)
                .then(response => {
                    console.log('        └─ Fetch 응답 상태:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('        ✓ Fetch 성공');
                    resolve(data);
                })
                .catch(err => {
                    console.error('        ❌ Fetch도 실패:', err.message);
                    reject(err);
                });
        };
        
        console.log('      └─ JSONP 스크립트 태그 추가...');
        document.head.appendChild(script);
    });
}

/**
 * 요약 카드 업데이트
 */
function updateSummaryCards(stats) {
    if (!stats) return;
    
    // 총 핸드 수
    const totalHandsEl = document.getElementById('total-hands');
    if (totalHandsEl) {
        totalHandsEl.textContent = stats.totalHands || 0;
    }
    
    // 승률
    const winRateEl = document.getElementById('win-rate');
    if (winRateEl) {
        winRateEl.textContent = `${stats.winRate || 0}%`;
    }
    
    // 평균 팟
    const avgPotEl = document.getElementById('avg-pot');
    if (avgPotEl) {
        avgPotEl.textContent = `$${stats.avgPot || 0}`;
    }
    
    // 오늘 핸드
    const todayHandsEl = document.getElementById('today-hands');
    if (todayHandsEl) {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = stats.byDate && stats.byDate[today];
        todayHandsEl.textContent = todayStats ? todayStats.count : 0;
    }
}

/**
 * 일별 핸드 차트 생성
 */
function createDailyChart(ctx) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '핸드 수',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * 포지션별 승률 차트 생성
 */
function createPositionChart(ctx) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
            datasets: [{
                label: '승률 (%)',
                data: [],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * 차트 업데이트
 */
function updateCharts(stats) {
    if (!stats) return;
    
    // 일별 차트 업데이트
    if (dashboardData.charts.daily && stats.byDate) {
        const dates = Object.keys(stats.byDate).sort().slice(-7); // 최근 7일
        const counts = dates.map(date => stats.byDate[date].count);
        
        dashboardData.charts.daily.data.labels = dates.map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        dashboardData.charts.daily.data.datasets[0].data = counts;
        dashboardData.charts.daily.update();
    }
    
    // 포지션별 승률 차트 업데이트
    if (dashboardData.charts.position && stats.byPosition) {
        const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
        const winRates = positions.map(pos => {
            const posStats = stats.byPosition[pos];
            return posStats ? posStats.winRate || 0 : 0;
        });
        
        dashboardData.charts.position.data.datasets[0].data = winRates;
        dashboardData.charts.position.update();
    }
}

/**
 * 최근 핸드 테이블 업데이트
 */
function updateRecentHandsTable(hands) {
    const tbody = document.getElementById('recent-hands-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!hands || hands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    핸드 데이터가 없습니다.
                </td>
            </tr>
        `;
        return;
    }
    
    hands.forEach(hand => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.onclick = () => viewHandDetail(hand.handnumber);
        
        const time = new Date(hand.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const resultClass = hand.result === 'Win' ? 'text-green-600 font-semibold' :
                           hand.result === 'Lose' ? 'text-red-600' : 'text-gray-600';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm">${time}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${hand.table || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${hand.myposition || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${formatCards(hand.mycards)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">$${hand.pot || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${resultClass}">${hand.result || '-'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 카드 포맷팅
 */
function formatCards(cards) {
    if (!cards) return '-';
    
    return cards.split('').reduce((acc, char, i) => {
        if (i % 2 === 0 && i > 0) acc += ' ';
        
        const suits = {
            's': '♠', 'h': '♥', 'd': '♦', 'c': '♣',
            'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣'
        };
        
        return acc + (suits[char] || char);
    }, '');
}

/**
 * 핸드 상세 보기
 */
function viewHandDetail(handNumber) {
    // history 페이지로 이동하면서 핸드 번호 전달
    window.location.href = `history.html?hand=${handNumber}`;
}

/**
 * 데이터 내보내기
 */
async function exportData() {
    try {
        const config = await getConfig();
        const url = `${config.appsScriptUrl}?action=backup`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('백업 데이터 생성 실패');
        }
        
        const data = await response.json();
        
        // JSON 파일로 다운로드
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `poker-hands-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showSuccess('데이터를 내보냈습니다.');
        
    } catch (error) {
        console.error('데이터 내보내기 실패:', error);
        showError('데이터 내보내기에 실패했습니다.');
    }
}

/**
 * 자동 새로고침 설정
 */
function setupAutoRefresh() {
    // 30초마다 데이터 새로고침
    setInterval(() => {
        loadDashboardData();
    }, 30000);
}

/**
 * 설정 가져오기
 */
async function getConfig() {
    console.log('    ⚙️ [CONFIG] 설정 로드...');
    // Google Apps Script URL 설정 (업데이트된 URL 사용)
    const config = {
        appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwb0qvHN2PO7_-T_Bn_laY66NVTc0_Oe4yyuBDJHHMe_fiqN0UeanCGKNno4XnMW5Sg/exec'
    };
    console.log(`      └─ Apps Script URL: ${config.appsScriptUrl}`);
    return config;
}

/**
 * 로딩 표시
 */
function showLoading() {
    console.log('    🔄 [UI] 로딩 오버레이 표시');
    
    // 로딩 오버레이 생성
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        console.log('      └─ 로딩 오버레이 생성 중...');
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loadingOverlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex flex-col items-center">
                <div class="spinner border-4 border-gray-200 border-t-blue-600 rounded-full w-12 h-12 animate-spin"></div>
                <p class="mt-4 text-gray-600">데이터 로딩 중...</p>
                <p class="mt-2 text-sm text-gray-500">Google Sheets에서 데이터를 가져오고 있습니다...</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * 로딩 숨김
 */
function hideLoading() {
    console.log('    🔄 [UI] 로딩 오버레이 숨김');
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        console.log('      ✓ 로딩 완료');
    }
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 text-gray-500 hover:text-gray-700">
            ×
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}