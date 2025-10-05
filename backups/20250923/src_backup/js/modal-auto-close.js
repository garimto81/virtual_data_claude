/**
 * 모달 자동 닫기 및 대시보드 리다이렉트 모듈
 * 일괄 등록 성공 후 모달을 자동으로 닫고 메인 대시보드로 돌아감
 *
 * @version 1.0.0
 * @date 2025-09-18
 */

// 모달 자동 닫기 함수
function autoCloseManagementModal() {
    console.log('[ModalAutoClose] 모달 자동 닫기 시작...');

    // 관리 모달 찾기 (실제 ID는 registration-modal)
    const managementModal = document.getElementById('registration-modal');

    if (managementModal) {
        // 모달이 실제로 열려있는지 확인
        const isHidden = managementModal.classList.contains('hidden') ||
                        managementModal.classList.contains('opacity-0');

        if (!isHidden) {
            console.log('[ModalAutoClose] 모달이 열려있음 - 닫기 시작');

            // 페이드 아웃 효과
            managementModal.style.transition = 'opacity 0.3s ease-out';
            managementModal.style.opacity = '0';

            // 완전히 숨기기
            setTimeout(() => {
                managementModal.classList.add('hidden');
                managementModal.classList.add('opacity-0');
                managementModal.style.opacity = '';
                managementModal.style.transition = '';
                console.log('[ModalAutoClose] 모달 닫기 완료');

                // UI 잠금 해제
                enableModalUI();

                // 대시보드로 리다이렉트
                redirectToDashboard();
            }, 300); // 페이드 아웃 애니메이션 시간만 대기
        } else {
            console.log('[ModalAutoClose] 모달이 이미 닫혀있음 - 대시보드로만 이동');
            // UI 잠금 해제
            enableModalUI();
            // 대시보드로 리다이렉트
            redirectToDashboard();
        }
    } else {
        console.warn('[ModalAutoClose] 관리 모달(registration-modal)을 찾을 수 없습니다');
        // 모달이 없어도 대시보드로 이동
        enableModalUI();
        redirectToDashboard();
    }
}

// 대시보드로 리다이렉트
function redirectToDashboard() {
    console.log('[ModalAutoClose] 대시보드로 리다이렉트...');

    try {
        // 플레이어 목록 새로고침
        if (typeof renderPlayerSelection === 'function') {
            renderPlayerSelection();
            console.log('[ModalAutoClose] 플레이어 목록 새로고침 완료');
        }

        // 전체 UI 렌더링
        if (typeof renderAll === 'function') {
            renderAll();
            console.log('[ModalAutoClose] 전체 UI 렌더링 완료');
        }

        // 플레이어 디스플레이 업데이트
        if (typeof updatePlayersDisplay === 'function') {
            updatePlayersDisplay();
            console.log('[ModalAutoClose] 플레이어 디스플레이 업데이트 완료');
        }

        // 대시보드 섹션으로 스크롤
        const dashboardSection = document.querySelector('#dashboard, main');
        if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('[ModalAutoClose] 대시보드로 스크롤 완료');
        }

        // 성공 메시지
        if (window.actionHistory && window.actionHistory.showSnackbar) {
            window.actionHistory.showSnackbar(
                '✅ 모든 변경사항이 적용되었습니다',
                null,
                'success'
            );
        } else if (typeof showFeedback === 'function') {
            showFeedback('✅ 모든 변경사항이 적용되었습니다');
        }

    } catch (error) {
        console.error('[ModalAutoClose] 대시보드 리다이렉트 실패:', error);
    }
}

// 일괄 등록 성공 후 자동 실행되도록 연결
function attachAutoCloseToSuccess() {
    // 기존 일괄 등록 성공 로직에 자동 닫기 추가
    const originalSuccess = window.onBatchUpdateSuccess;

    window.onBatchUpdateSuccess = function(result) {
        console.log('[ModalAutoClose] 일괄 등록 성공 감지');

        // 기존 성공 핸들러 실행 (있다면)
        if (typeof originalSuccess === 'function') {
            originalSuccess(result);
        }

        // 모달 자동 닫기 실행
        autoCloseManagementModal();
    };
}

// UI 비활성화 함수
function disableModalUI() {
    console.log('[ModalAutoClose] UI 비활성화...');

    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    // 모든 입력 필드와 버튼 비활성화
    const inputs = modal.querySelectorAll('input, button, select, textarea');
    inputs.forEach(element => {
        element.disabled = true;
        element.style.opacity = '0.5';
        element.style.cursor = 'not-allowed';
    });

    // 로딩 오버레이 추가
    const overlay = document.createElement('div');
    overlay.id = 'modal-loading-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    overlay.innerHTML = `
        <div style="color: white; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">⏳</div>
            <div>처리 중... 잠시만 기다려주세요</div>
        </div>
    `;

    const modalContent = modal.querySelector('.bg-gray-800');
    if (modalContent) {
        modalContent.style.position = 'relative';
        modalContent.appendChild(overlay);
    }
}

// UI 활성화 함수
function enableModalUI() {
    console.log('[ModalAutoClose] UI 활성화...');

    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    // 모든 입력 필드와 버튼 활성화
    const inputs = modal.querySelectorAll('input, button, select, textarea');
    inputs.forEach(element => {
        element.disabled = false;
        element.style.opacity = '';
        element.style.cursor = '';
    });

    // 로딩 오버레이 제거
    const overlay = document.getElementById('modal-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 모듈 초기화
(function initModalAutoClose() {
    console.log('[ModalAutoClose] 모달 자동 닫기 모듈 초기화');

    // DOM이 준비되면 이벤트 연결
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachAutoCloseToSuccess);
    } else {
        attachAutoCloseToSuccess();
    }

    // 전역 함수로 노출 (수동 호출 가능)
    window.autoCloseManagementModal = autoCloseManagementModal;
    window.redirectToDashboard = redirectToDashboard;
    window.disableModalUI = disableModalUI;
    window.enableModalUI = enableModalUI;
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        autoCloseManagementModal,
        redirectToDashboard,
        attachAutoCloseToSuccess
    };
}