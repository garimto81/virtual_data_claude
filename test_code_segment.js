// 2570-2575 라인 코드 세그먼트 테스트

// 의존성 모킹
const tableData = [
  { seat: '1', name: 'Player1' },
  { seat: '2', name: 'Player2' },
  { seat: '3', name: 'Player3' }
];

try {
  console.log('🧪 코드 세그먼트 테스트 시작...');

  // 실제 코드와 동일하게 작성
  const allPlayersWithSeats = tableData.filter(player => player.seat).map(player => ({
    seat: parseInt(player.seat),
    name: player.name
  })).sort((a, b) => a.seat - b.seat);

  console.log('✅ 코드 세그먼트 성공:', allPlayersWithSeats);

} catch (error) {
  console.error('❌ 코드 세그먼트 에러:', error.message);
}