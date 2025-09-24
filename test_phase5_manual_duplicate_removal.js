/**
 * Phase 5 테스트 시나리오: 자동 실행 제거 및 수동 중복 제거 테스트
 *
 * 이 파일은 Phase 5의 구현사항을 검증하기 위한 테스트 시나리오입니다.
 */

console.log('🧪 Phase 5 테스트 시나리오 시작');

/**
 * 테스트 시나리오 1: 자동 실행 제거 확인
 */
function testAutoExecutionRemoval() {
    console.log('📋 테스트 1: 자동 실행 제거 확인');

    return new Promise((resolve) => {
        // 페이지 로드 후 3초 대기하여 자동 실행이 일어나지 않는지 확인
        setTimeout(() => {
            const logModal = document.getElementById('log-modal');
            const isLogModalVisible = logModal && !logModal.classList.contains('hidden');

            if (isLogModalVisible) {
                console.log('❌ FAIL: 자동 실행이 여전히 발생하고 있습니다 (로그 모달이 열림)');
                resolve(false);
            } else {
                console.log('✅ PASS: 자동 실행이 성공적으로 제거되었습니다');
                resolve(true);
            }
        }, 3000);
    });
}

/**
 * 테스트 시나리오 2: 중복 제거 버튼 존재 확인
 */
function testDuplicateRemovalButtonExists() {
    console.log('📋 테스트 2: 중복 제거 버튼 존재 확인');

    const button = document.getElementById('remove-duplicates-btn');
    if (!button) {
        console.log('❌ FAIL: 중복 제거 버튼이 존재하지 않습니다');
        return false;
    }

    // 버튼의 스타일과 내용 확인
    const hasCorrectIcon = button.innerHTML.includes('🧹');
    const hasCorrectText = button.innerHTML.includes('중복 제거');
    const hasCorrectStyling = button.classList.contains('bg-red-600');

    if (hasCorrectIcon && hasCorrectText && hasCorrectStyling) {
        console.log('✅ PASS: 중복 제거 버튼이 올바르게 구현되었습니다');
        return true;
    } else {
        console.log('❌ FAIL: 중복 제거 버튼의 구현이 불완전합니다', {
            hasCorrectIcon,
            hasCorrectText,
            hasCorrectStyling
        });
        return false;
    }
}

/**
 * 테스트 시나리오 3: 조건부 실행 로직 확인 (초기화 전)
 */
function testConditionalExecutionBeforeInit() {
    console.log('📋 테스트 3: 조건부 실행 로직 확인 (초기화 전)');

    return new Promise((resolve) => {
        // window.state를 임시로 제거하여 초기화되지 않은 상황 시뮬레이션
        const originalState = window.state;
        delete window.state;

        const button = document.getElementById('remove-duplicates-btn');
        if (!button) {
            console.log('❌ FAIL: 중복 제거 버튼을 찾을 수 없습니다');
            resolve(false);
            return;
        }

        // 버튼 클릭 시뮬레이션
        let alertCalled = false;
        const originalAlert = window.alert;
        window.alert = function(message) {
            alertCalled = true;
            console.log('Alert 메시지:', message);
            return true;
        };

        button.click();

        // 약간의 지연 후 결과 확인
        setTimeout(() => {
            if (alertCalled) {
                console.log('✅ PASS: 초기화 전 실행 방지가 정상 작동합니다');
                resolve(true);
            } else {
                console.log('❌ FAIL: 초기화 전 실행 방지가 작동하지 않습니다');
                resolve(false);
            }

            // 원래 상태 복원
            window.state = originalState;
            window.alert = originalAlert;
        }, 100);
    });
}

/**
 * 테스트 시나리오 4: Apps Script URL 미설정 확인
 */
function testAppsScriptUrlValidation() {
    console.log('📋 테스트 4: Apps Script URL 미설정 확인');

    return new Promise((resolve) => {
        // APPS_SCRIPT_URL을 임시로 제거
        const originalUrl = window.APPS_SCRIPT_URL;
        window.APPS_SCRIPT_URL = undefined;

        // 가짜 window.state 설정
        window.state = { playerDataByTable: {} };

        const button = document.getElementById('remove-duplicates-btn');
        if (!button) {
            console.log('❌ FAIL: 중복 제거 버튼을 찾을 수 없습니다');
            resolve(false);
            return;
        }

        // 버튼 클릭 시뮬레이션
        let alertCalled = false;
        let alertMessage = '';
        const originalAlert = window.alert;
        window.alert = function(message) {
            alertCalled = true;
            alertMessage = message;
            console.log('Alert 메시지:', message);
            return true;
        };

        button.click();

        setTimeout(() => {
            if (alertCalled && alertMessage.includes('Apps Script URL')) {
                console.log('✅ PASS: Apps Script URL 검증이 정상 작동합니다');
                resolve(true);
            } else {
                console.log('❌ FAIL: Apps Script URL 검증이 작동하지 않습니다');
                resolve(false);
            }

            // 원래 상태 복원
            window.APPS_SCRIPT_URL = originalUrl;
            window.alert = originalAlert;
        }, 100);
    });
}

/**
 * 테스트 시나리오 5: 확인 대화상자 표시 확인
 */
function testConfirmationDialog() {
    console.log('📋 테스트 5: 확인 대화상자 표시 확인');

    return new Promise((resolve) => {
        // 테스트 환경 설정
        window.state = { playerDataByTable: { 'table1': [] } };
        window.APPS_SCRIPT_URL = 'https://test-url.com';

        const button = document.getElementById('remove-duplicates-btn');
        if (!button) {
            console.log('❌ FAIL: 중복 제거 버튼을 찾을 수 없습니다');
            resolve(false);
            return;
        }

        // confirm 대화상자 모킹
        let confirmCalled = false;
        let confirmMessage = '';
        const originalConfirm = window.confirm;
        window.confirm = function(message) {
            confirmCalled = true;
            confirmMessage = message;
            console.log('Confirm 메시지:', message);
            return false; // 취소 선택
        };

        button.click();

        setTimeout(() => {
            if (confirmCalled && confirmMessage.includes('중복 플레이어 제거')) {
                console.log('✅ PASS: 확인 대화상자가 정상적으로 표시됩니다');
                resolve(true);
            } else {
                console.log('❌ FAIL: 확인 대화상자가 표시되지 않습니다');
                resolve(false);
            }

            // 원래 상태 복원
            window.confirm = originalConfirm;
        }, 100);
    });
}

/**
 * 테스트 시나리오 6: 버튼 상태 변경 확인 (로딩)
 */
function testButtonLoadingState() {
    console.log('📋 테스트 6: 버튼 로딩 상태 변경 확인');

    return new Promise((resolve) => {
        // 테스트 환경 설정
        window.state = { playerDataByTable: { 'table1': [] } };
        window.APPS_SCRIPT_URL = 'https://test-url.com';

        const button = document.getElementById('remove-duplicates-btn');
        if (!button) {
            console.log('❌ FAIL: 중복 제거 버튼을 찾을 수 없습니다');
            resolve(false);
            return;
        }

        const originalContent = button.innerHTML;

        // confirm을 true로 설정하여 실행 진행
        const originalConfirm = window.confirm;
        window.confirm = function() { return true; };

        button.click();

        // 버튼 상태 확인
        setTimeout(() => {
            const isDisabled = button.disabled;
            const hasLoadingContent = button.innerHTML.includes('검사 중') || button.innerHTML.includes('⚙️');

            if (isDisabled && hasLoadingContent) {
                console.log('✅ PASS: 버튼 로딩 상태 변경이 정상 작동합니다');
                resolve(true);
            } else {
                console.log('❌ FAIL: 버튼 로딩 상태 변경이 작동하지 않습니다', {
                    isDisabled,
                    hasLoadingContent,
                    buttonContent: button.innerHTML
                });
                resolve(false);
            }

            // 원래 상태 복원
            window.confirm = originalConfirm;
            button.disabled = false;
            button.innerHTML = originalContent;
        }, 50);
    });
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
    console.log('🚀 Phase 5 전체 테스트 실행 시작');

    const results = [];

    try {
        // 테스트 1: 자동 실행 제거 확인
        results.push(await testAutoExecutionRemoval());

        // 테스트 2: 중복 제거 버튼 존재 확인
        results.push(testDuplicateRemovalButtonExists());

        // 테스트 3: 조건부 실행 로직 확인 (초기화 전)
        results.push(await testConditionalExecutionBeforeInit());

        // 테스트 4: Apps Script URL 미설정 확인
        results.push(await testAppsScriptUrlValidation());

        // 테스트 5: 확인 대화상자 표시 확인
        results.push(await testConfirmationDialog());

        // 테스트 6: 버튼 로딩 상태 변경 확인
        results.push(await testButtonLoadingState());

        // 결과 요약
        const passCount = results.filter(result => result === true).length;
        const totalCount = results.length;

        console.log(`📊 테스트 결과 요약: ${passCount}/${totalCount} 통과`);

        if (passCount === totalCount) {
            console.log('🎉 모든 테스트가 통과되었습니다! Phase 5 구현이 성공적으로 완료되었습니다.');
        } else {
            console.log('⚠️ 일부 테스트가 실패했습니다. 구현을 다시 확인해주세요.');
        }

        return { passCount, totalCount, results };

    } catch (error) {
        console.error('❌ 테스트 실행 중 오류 발생:', error);
        return { passCount: 0, totalCount: results.length, results, error };
    }
}

/**
 * 페이지 로드 완료 후 테스트 실행
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllTests, 1000); // 1초 대기 후 테스트 실행
    });
} else {
    setTimeout(runAllTests, 1000);
}

// 전역 함수로 노출 (수동 실행용)
window.runPhase5Tests = runAllTests;
window.testPhase5 = {
    testAutoExecutionRemoval,
    testDuplicateRemovalButtonExists,
    testConditionalExecutionBeforeInit,
    testAppsScriptUrlValidation,
    testConfirmationDialog,
    testButtonLoadingState,
    runAllTests
};