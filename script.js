// 게임 상태
const gameState = {
    money: 10000,
    currentBet: null,
    betAmount: 0,
    betChoice: null, // 'black', 'white', 'draw'
    gamePhase: 'waiting', // waiting, betting, playing, result
    countdown: 10,
    board: Array(5).fill(null).map(() => Array(5).fill(null)),
    currentPlayer: 'black',
    moveCount: 0,
    gameHistory: [],
    stats: {
        totalBet: 0,
        totalWin: 0,
        gamesPlayed: 0,
        gamesWon: 0
    },
    globalBets: {
        black: 1000,
        white: 1000,
        draw: 1000
    }
};

// DOM 요소
const elements = {
    userMoney: document.getElementById('userMoney'),
    gameStatus: document.getElementById('gameStatus'),
    countdown: document.getElementById('countdown'),
    blackStatus: document.getElementById('blackStatus'),
    whiteStatus: document.getElementById('whiteStatus'),
    board: document.getElementById('badukBoard'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    blackScore: document.getElementById('blackScore'),
    whiteScore: document.getElementById('whiteScore'),
    betBlack: document.getElementById('betBlack'),
    betDraw: document.getElementById('betDraw'),
    betWhite: document.getElementById('betWhite'),
    betAmount: document.getElementById('betAmount'),
    betInputSection: document.getElementById('betInputSection'),
    currentBet: document.getElementById('currentBet'),
    betChoice: document.getElementById('betChoice'),
    betMoney: document.getElementById('betMoney'),
    expectedWin: document.getElementById('expectedWin'),
    cancelBetBtn: document.getElementById('cancelBetBtn'),
    chargeBtn: document.getElementById('chargeBtn'),
    chargeModal: document.getElementById('chargeModal'),
    historyList: document.getElementById('historyList'),
    totalBet: document.getElementById('totalBet'),
    totalWin: document.getElementById('totalWin'),
    netProfit: document.getElementById('netProfit'),
    winRate: document.getElementById('winRate'),
    blackBetAmount: document.getElementById('blackBetAmount'),
    whiteBetAmount: document.getElementById('whiteBetAmount'),
    drawBetAmount: document.getElementById('drawBetAmount'),
    blackBar: document.getElementById('blackBar'),
    whiteBar: document.getElementById('whiteBar'),
    drawBar: document.getElementById('drawBar'),
    blackPercent: document.getElementById('blackPercent'),
    whitePercent: document.getElementById('whitePercent'),
    drawPercent: document.getElementById('drawPercent')
};

// 바둑판 초기화
function initBoard() {
    const size = 5;
    const cellSize = 80;
    const padding = 40;
    const boardSize = cellSize * (size - 1) + padding * 2;

    elements.board.setAttribute('width', boardSize);
    elements.board.setAttribute('height', boardSize);
    elements.board.innerHTML = '';

    // 그리드 그리기
    for (let i = 0; i < size; i++) {
        // 가로선
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', padding);
        hLine.setAttribute('y1', padding + i * cellSize);
        hLine.setAttribute('x2', padding + (size - 1) * cellSize);
        hLine.setAttribute('y2', padding + i * cellSize);
        hLine.setAttribute('stroke', '#000');
        hLine.setAttribute('stroke-width', '2');
        elements.board.appendChild(hLine);

        // 세로선
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', padding + i * cellSize);
        vLine.setAttribute('y1', padding);
        vLine.setAttribute('x2', padding + i * cellSize);
        vLine.setAttribute('y2', padding + (size - 1) * cellSize);
        vLine.setAttribute('stroke', '#000');
        vLine.setAttribute('stroke-width', '2');
        elements.board.appendChild(vLine);
    }

    // 화점 (중앙)
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', padding + 2 * cellSize);
    dot.setAttribute('cy', padding + 2 * cellSize);
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', '#000');
    elements.board.appendChild(dot);
}

// 돌 놓기
function placeStone(x, y, color) {
    const cellSize = 80;
    const padding = 40;
    const radius = 30;

    const stone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    stone.setAttribute('cx', padding + x * cellSize);
    stone.setAttribute('cy', padding + y * cellSize);
    stone.setAttribute('r', radius);
    
    if (color === 'black') {
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', `blackGrad${x}${y}`);
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#4a4a4a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000;stop-opacity:1" />
        `;
        elements.board.appendChild(gradient);
        stone.setAttribute('fill', `url(#blackGrad${x}${y})`);
    } else {
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', `whiteGrad${x}${y}`);
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#fff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ddd;stop-opacity:1" />
        `;
        elements.board.appendChild(gradient);
        stone.setAttribute('fill', `url(#whiteGrad${x}${y})`);
        stone.setAttribute('stroke', '#999');
        stone.setAttribute('stroke-width', '2');
    }

    stone.setAttribute('class', 'stone');
    stone.style.opacity = '0';
    elements.board.appendChild(stone);

    // 애니메이션
    setTimeout(() => {
        stone.style.transition = 'opacity 0.3s';
        stone.style.opacity = '1';
    }, 10);

    gameState.board[y][x] = color;
}

// 간단한 AI 로직 (랜덤하게 빈 곳에 놓기)
function getAIMove() {
    const emptySpots = [];
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (gameState.board[y][x] === null) {
                emptySpots.push({ x, y });
            }
        }
    }

    if (emptySpots.length === 0) return null;

    // 약간의 전략: 중앙 선호
    const centerSpots = emptySpots.filter(spot => 
        (spot.x === 2 || spot.y === 2) && emptySpots.length > 10
    );

    const spots = centerSpots.length > 0 ? centerSpots : emptySpots;
    return spots[Math.floor(Math.random() * spots.length)];
}

// 게임 플레이
async function playGame() {
    gameState.gamePhase = 'playing';
    gameState.board = Array(5).fill(null).map(() => Array(5).fill(null));
    gameState.currentPlayer = 'black';
    gameState.moveCount = 0;
    
    elements.gameStatus.textContent = '게임 진행중!';
    elements.scoreDisplay.style.display = 'none';
    initBoard();

    // 베팅 불가
    disableBetting();

    // 한 수씩 두기 (1초 간격)
    const maxMoves = 25; // 5x5 = 25칸
    
    for (let i = 0; i < maxMoves; i++) {
        const move = getAIMove();
        if (!move) break;

        // AI 상태 표시
        if (gameState.currentPlayer === 'black') {
            elements.blackStatus.textContent = '생각중...';
            elements.blackStatus.classList.add('thinking');
            elements.whiteStatus.textContent = '대기중';
            elements.whiteStatus.classList.remove('thinking');
        } else {
            elements.whiteStatus.textContent = '생각중...';
            elements.whiteStatus.classList.add('thinking');
            elements.blackStatus.textContent = '대기중';
            elements.blackStatus.classList.remove('thinking');
        }

        await sleep(1000); // 1초 대기

        placeStone(move.x, move.y, gameState.currentPlayer);
        gameState.moveCount++;

        // 턴 변경
        gameState.currentPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';

        // 30초 전까지 베팅 취소 가능
        const remainingTime = 50 - gameState.moveCount;
        if (remainingTime === 20 && gameState.currentBet) {
            elements.cancelBetBtn.style.display = 'none';
        }
    }

    // 게임 종료, 결과 계산
    elements.blackStatus.textContent = '대기중';
    elements.blackStatus.classList.remove('thinking');
    elements.whiteStatus.textContent = '대기중';
    elements.whiteStatus.classList.remove('thinking');

    await sleep(1000);
    calculateResult();
}

// 점수 계산 (간단한 집 계산)
function calculateResult() {
    let blackScore = 0;
    let whiteScore = 0;

    // 실제로는 복잡한 알고리즘이 필요하지만, 간단하게 돌 개수로 계산
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (gameState.board[y][x] === 'black') blackScore++;
            else if (gameState.board[y][x] === 'white') whiteScore++;
        }
    }

    // 약간의 랜덤성 추가 (점수 조정)
    blackScore += Math.floor(Math.random() * 3);
    whiteScore += Math.floor(Math.random() * 3);

    // 덤 (백에게 유리하게)
    whiteScore += 3.5;

    elements.blackScore.textContent = blackScore.toFixed(1);
    elements.whiteScore.textContent = whiteScore.toFixed(1);
    elements.scoreDisplay.style.display = 'flex';

    let result;
    const diff = Math.abs(blackScore - whiteScore);
    
    if (diff < 0.5) {
        result = 'draw';
        elements.gameStatus.textContent = '🤝 무승부!';
    } else if (blackScore > whiteScore) {
        result = 'black';
        elements.gameStatus.textContent = '⚫ AI-A(흑) 승리!';
    } else {
        result = 'white';
        elements.gameStatus.textContent = '⚪ AI-B(백) 승리!';
    }

    // 베팅 결과 처리
    processResult(result);
}

// 결과 처리
function processResult(result) {
    gameState.gamePhase = 'result';
    
    let won = false;
    let winAmount = 0;

    if (gameState.currentBet) {
        if (gameState.betChoice === result) {
            won = true;
            const odds = result === 'draw' ? 2.9 : 1.95;
            winAmount = Math.floor(gameState.betAmount * odds);
            gameState.money += winAmount;
            gameState.stats.totalWin += winAmount;
            gameState.stats.gamesWon++;
        }
        
        gameState.stats.gamesPlayed++;
        
        // 히스토리 추가
        addHistory(result, won, winAmount);
    }

    updateUI();

    // 10초 후 다음 게임
    setTimeout(() => {
        startNewGame();
    }, 5000);
}

// 히스토리 추가
function addHistory(result, won, winAmount) {
    const resultText = result === 'black' ? 'AI-A 승' : 
                      result === 'white' ? 'AI-B 승' : '무승부';
    
    const betText = gameState.betChoice === 'black' ? 'AI-A' : 
                    gameState.betChoice === 'white' ? 'AI-B' : '무승부';

    const item = document.createElement('div');
    item.className = `history-item ${won ? 'win' : 'lose'}`;
    item.innerHTML = `
        <div>
            <div style="font-weight: bold;">${resultText}</div>
            <div style="font-size: 11px; color: #666;">베팅: ${betText} ${gameState.betAmount.toLocaleString()}원</div>
        </div>
        <div style="font-weight: bold; color: ${won ? '#28a745' : '#dc3545'}">
            ${won ? '+' : ''}${(winAmount - gameState.betAmount).toLocaleString()}원
        </div>
    `;

    if (elements.historyList.querySelector('.history-empty')) {
        elements.historyList.innerHTML = '';
    }

    elements.historyList.insertBefore(item, elements.historyList.firstChild);

    // 최대 10개만 표시
    while (elements.historyList.children.length > 10) {
        elements.historyList.removeChild(elements.historyList.lastChild);
    }
}

// 새 게임 시작
function startNewGame() {
    gameState.gamePhase = 'waiting';
    gameState.currentBet = null;
    gameState.betAmount = 0;
    gameState.betChoice = null;
    gameState.countdown = 10;
    
    elements.currentBet.style.display = 'none';
    elements.betInputSection.style.display = 'block';
    elements.cancelBetBtn.style.display = 'none';
    elements.scoreDisplay.style.display = 'none';
    
    // 베팅 옵션 초기화
    document.querySelectorAll('.bet-option').forEach(opt => {
        opt.classList.remove('selected', 'disabled');
    });

    // 가상의 다른 사용자 베팅 추가
    gameState.globalBets.black += Math.floor(Math.random() * 5000);
    gameState.globalBets.white += Math.floor(Math.random() * 5000);
    gameState.globalBets.draw += Math.floor(Math.random() * 2000);

    updateBettingStats();
    updateUI();

    // 카운트다운
    const timer = setInterval(() => {
        gameState.countdown--;
        elements.countdown.textContent = gameState.countdown;
        
        if (gameState.countdown <= 0) {
            clearInterval(timer);
            elements.gameStatus.textContent = '게임 시작!';
            playGame();
        } else {
            elements.gameStatus.textContent = `다음 게임 시작까지`;
        }
    }, 1000);
}

// 베팅 비활성화
function disableBetting() {
    document.querySelectorAll('.bet-option').forEach(opt => {
        opt.classList.add('disabled');
        opt.style.pointerEvents = 'none';
    });
}

// 베팅 통계 업데이트
function updateBettingStats() {
    elements.blackBetAmount.textContent = gameState.globalBets.black.toLocaleString();
    elements.whiteBetAmount.textContent = gameState.globalBets.white.toLocaleString();
    elements.drawBetAmount.textContent = gameState.globalBets.draw.toLocaleString();

    const total = gameState.globalBets.black + gameState.globalBets.white + gameState.globalBets.draw;
    const blackPercent = Math.round((gameState.globalBets.black / total) * 100);
    const whitePercent = Math.round((gameState.globalBets.white / total) * 100);
    const drawPercent = 100 - blackPercent - whitePercent;

    elements.blackBar.style.width = `${blackPercent}%`;
    elements.whiteBar.style.width = `${whitePercent}%`;
    elements.drawBar.style.width = `${drawPercent}%`;

    elements.blackPercent.textContent = `${blackPercent}%`;
    elements.whitePercent.textContent = `${whitePercent}%`;
    elements.drawPercent.textContent = `${drawPercent}%`;
}

// UI 업데이트
function updateUI() {
    elements.userMoney.textContent = gameState.money.toLocaleString();
    elements.totalBet.textContent = gameState.stats.totalBet.toLocaleString();
    elements.totalWin.textContent = gameState.stats.totalWin.toLocaleString();
    
    const netProfit = gameState.stats.totalWin - gameState.stats.totalBet;
    elements.netProfit.textContent = netProfit.toLocaleString();
    elements.netProfit.className = netProfit > 0 ? 'positive' : netProfit < 0 ? 'negative' : 'neutral';

    const winRate = gameState.stats.gamesPlayed > 0 ? 
        Math.round((gameState.stats.gamesWon / gameState.stats.gamesPlayed) * 100) : 0;
    elements.winRate.textContent = winRate;
}

// 베팅하기
function placeBet(choice) {
    if (gameState.gamePhase !== 'waiting') return;
    
    const amount = parseInt(elements.betAmount.value);
    
    if (amount < 1000 || amount > 100000) {
        alert('베팅 금액은 1,000원 ~ 100,000원 사이여야 합니다.');
        return;
    }

    if (amount > gameState.money) {
        alert('보유 금액이 부족합니다.');
        return;
    }

    // 기존 베팅 취소
    if (gameState.currentBet) {
        gameState.globalBets[gameState.betChoice] -= gameState.betAmount;
    }

    gameState.currentBet = { choice, amount };
    gameState.betChoice = choice;
    gameState.betAmount = amount;
    gameState.money -= amount;
    gameState.stats.totalBet += amount;

    // 글로벌 베팅에 추가
    gameState.globalBets[choice] += amount;

    // UI 업데이트
    document.querySelectorAll('.bet-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.getElementById(`bet${choice.charAt(0).toUpperCase() + choice.slice(1)}`).classList.add('selected');

    const choiceText = choice === 'black' ? 'AI-A 승리' : 
                      choice === 'white' ? 'AI-B 승리' : '무승부';
    const odds = choice === 'draw' ? 2.9 : 1.95;
    const expectedWin = Math.floor(amount * odds);

    elements.betChoice.textContent = choiceText;
    elements.betMoney.textContent = amount.toLocaleString();
    elements.expectedWin.textContent = expectedWin.toLocaleString();
    elements.currentBet.style.display = 'block';
    elements.betInputSection.style.display = 'none';
    elements.cancelBetBtn.style.display = 'block';

    updateUI();
    updateBettingStats();
}

// 베팅 취소
function cancelBet() {
    if (!gameState.currentBet) return;

    gameState.money += gameState.betAmount;
    gameState.stats.totalBet -= gameState.betAmount;
    gameState.globalBets[gameState.betChoice] -= gameState.betAmount;

    gameState.currentBet = null;
    gameState.betChoice = null;
    gameState.betAmount = 0;

    elements.currentBet.style.display = 'none';
    elements.betInputSection.style.display = 'block';
    elements.cancelBetBtn.style.display = 'none';

    document.querySelectorAll('.bet-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    updateUI();
    updateBettingStats();
}

// 유틸리티 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 이벤트 리스너
elements.betBlack.addEventListener('click', () => placeBet('black'));
elements.betWhite.addEventListener('click', () => placeBet('white'));
elements.betDraw.addEventListener('click', () => placeBet('draw'));
elements.cancelBetBtn.addEventListener('click', cancelBet);

// 빠른 베팅 금액
document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.addEventListener('click', () => {
        elements.betAmount.value = btn.dataset.amount;
    });
});

// 충전 모달
elements.chargeBtn.addEventListener('click', () => {
    elements.chargeModal.style.display = 'block';
});

document.querySelector('.close').addEventListener('click', () => {
    elements.chargeModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === elements.chargeModal) {
        elements.chargeModal.style.display = 'none';
    }
});

// 충전하기
document.querySelectorAll('.btn-charge-option').forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        gameState.money += amount;
        updateUI();
        elements.chargeModal.style.display = 'none';
        alert(`${amount.toLocaleString()}원이 충전되었습니다!`);
    });
});

document.getElementById('confirmChargeBtn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('customAmount').value);
    if (amount && amount >= 1000) {
        gameState.money += amount;
        updateUI();
        elements.chargeModal.style.display = 'none';
        document.getElementById('customAmount').value = '';
        alert(`${amount.toLocaleString()}원이 충전되었습니다!`);
    } else {
        alert('최소 1,000원 이상 입력해주세요.');
    }
});

// 초기화
initBoard();
updateUI();
updateBettingStats();
startNewGame();

