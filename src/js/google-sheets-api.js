/**
 * Google Sheets API 연동 모듈
 * Version: 1.0.0
 * 서비스 계정 기반 인증으로 Apps Script 방식 대체
 */

class GoogleSheetsAPI {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.spreadsheetId = null;
    this.serviceAccount = null;
    
    // 서비스 계정 정보 로드
    this.loadServiceAccount();
  }

  /**
   * 서비스 계정 정보 로드
   */
  async loadServiceAccount() {
    try {
      const response = await fetch('./credentials/google-service-account.json');
      this.serviceAccount = await response.json();
      console.log('✅ 서비스 계정 로드 완료:', this.serviceAccount.client_email);
      
      // Spreadsheet ID 설정 (기존 스프레드시트 ID 사용)
      this.spreadsheetId = this.extractSpreadsheetId();
      
      return true;
    } catch (error) {
      console.error('❌ 서비스 계정 로드 실패:', error);
      return false;
    }
  }

  /**
   * 스프레드시트 ID 설정
   * 실제 Google Sheets의 스프레드시트 ID를 사용
   */
  extractSpreadsheetId() {
    // 실제 스프레드시트 ID (사용자가 설정해야 함)
    // CSV export ID는 다르므로 실제 시트의 URL에서 추출한 ID 필요
    
    // 예: https://docs.google.com/spreadsheets/d/[ACTUAL_SPREADSHEET_ID]/edit
    // 현재는 설정에서 입력받을 수 있도록 localStorage 확인
    const storedSpreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');
    
    if (storedSpreadsheetId) {
      return storedSpreadsheetId;
    }
    
    // 기본값: CSV URL에서 추정 (정확하지 않을 수 있음)
    console.warn('⚠️ Spreadsheet ID가 설정되지 않았습니다. 설정에서 실제 스프레드시트 ID를 입력하세요.');
    return "1SDY_i4330JANAjIz4sMncdJdRHsOkfUCjQusHTGQk2tykrhA4d09LeIp3XRbLd8hkN6SgSB47k_nux"; // 임시
  }

  /**
   * JWT 토큰 생성
   */
  async createJWT() {
    if (!this.serviceAccount) {
      throw new Error('서비스 계정 정보가 없습니다');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1시간 후 만료
      iat: now
    };

    // JWT 생성 (실제로는 crypto 라이브러리 필요)
    const token = await this.signJWT(header, payload);
    return token;
  }

  /**
   * JWT 서명 (jsrsasign 라이브러리 사용)
   */
  async signJWT(header, payload) {
    if (!window.KJUR) {
      throw new Error('JWT 라이브러리가 로드되지 않았습니다');
    }

    // JWT 생성
    const jwt = window.KJUR.jws.JWS.sign(
      header.alg,
      JSON.stringify(header),
      JSON.stringify(payload),
      this.serviceAccount.private_key
    );

    return jwt;
  }

  /**
   * 액세스 토큰 획득
   */
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const jwt = await this.createJWT();
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      const tokenData = await response.json();
      
      if (!response.ok) {
        throw new Error(`토큰 획득 실패: ${tokenData.error_description}`);
      }

      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      console.log('✅ Google Sheets API 액세스 토큰 획득 완료');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ 액세스 토큰 획득 실패:', error);
      throw error;
    }
  }

  /**
   * 시트에 데이터 추가
   */
  async appendData(sheetName, data) {
    try {
      const token = await this.getAccessToken();
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: Array.isArray(data[0]) ? data : [data]
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`시트 데이터 추가 실패: ${result.error?.message}`);
      }

      console.log('✅ Google Sheets에 데이터 추가 완료:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 시트 데이터 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 시트에서 데이터 읽기
   */
  async readData(sheetName, range = 'A:Z') {
    try {
      const token = await this.getAccessToken();
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!${range}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`시트 데이터 읽기 실패: ${result.error?.message}`);
      }

      console.log('✅ Google Sheets에서 데이터 읽기 완료');
      return result.values || [];
      
    } catch (error) {
      console.error('❌ 시트 데이터 읽기 실패:', error);
      throw error;
    }
  }

  /**
   * 연결 상태 테스트
   */
  async testConnection() {
    try {
      await this.loadServiceAccount();
      await this.getAccessToken();
      
      // 간단한 읽기 테스트
      await this.readData('Hand', 'A1:A1');
      
      console.log('✅ Google Sheets API 연결 테스트 성공');
      return true;
      
    } catch (error) {
      console.error('❌ Google Sheets API 연결 테스트 실패:', error);
      return false;
    }
  }
}

// 전역 인스턴스 생성
window.googleSheetsAPI = new GoogleSheetsAPI();

// 초기화 완료 이벤트
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 Google Sheets API 초기화 시작...');
  
  const isReady = await window.googleSheetsAPI.loadServiceAccount();
  
  if (isReady) {
    console.log('✅ Google Sheets API 준비 완료');
    
    // 연결 테스트 (선택사항)
    // await window.googleSheetsAPI.testConnection();
  } else {
    console.log('❌ Google Sheets API 초기화 실패');
  }
});