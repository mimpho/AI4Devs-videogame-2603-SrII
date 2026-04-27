(function () {
  'use strict';

  var HUMAN = 'X';
  var AI = 'O';
  var LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  var state = {
    board: new Array(9).fill(''),
    phase: 'human',
    winner: null,
    winningLine: null,
  };

  var elBoard = document.getElementById('board');
  var elStatus = document.getElementById('status');
  var elDifficulty = document.getElementById('difficulty');
  var elNewGame = document.getElementById('btnNewGame');
  var cells = [];
  var playGen = 0;

  function getWinner(b) {
    for (var i = 0; i < LINES.length; i++) {
      var a = LINES[i][0], k = LINES[i][1], c = LINES[i][2];
      if (b[a] && b[a] === b[k] && b[k] === b[c]) {
        return { mark: b[a], line: LINES[i] };
      }
    }
    return b.some(function (x) { return x === ''; }) ? null : { mark: 'draw', line: null };
  }

  /** Fácil: movimiento aleatorio entre celdas vacías */
  function moveEasy(b) {
    var empty = [];
    for (var i = 0; i < 9; i++) if (b[i] === '') empty.push(i);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  /**
   * Encuentra índice donde poner "mark" para completar 3 en línea, o -1
   */
  function findWinningMove(b, mark) {
    for (var i = 0; i < LINES.length; i++) {
      var line = LINES[i];
      var marks = 0, empty = -1;
      for (var j = 0; j < 3; j++) {
        if (b[line[j]] === mark) marks++;
        else if (b[line[j]] === '') empty = line[j];
        else { empty = -1; break; }
      }
      if (marks === 2 && empty >= 0) return empty;
    }
    return -1;
  }

  /** Medio: ganar, bloquear, centro, esquina, borde; si no, aleatorio */
  function moveMedium(b) {
    var win = findWinningMove(b, AI);
    if (win >= 0) return win;
    var block = findWinningMove(b, HUMAN);
    if (block >= 0) return block;
    if (b[4] === '') return 4;
    var corners = [0, 2, 6, 8];
    var freeCorners = [];
    for (var i = 0; i < 4; i++) if (b[corners[i]] === '') freeCorners.push(corners[i]);
    if (freeCorners.length) return freeCorners[Math.floor(Math.random() * freeCorners.length)];
    var edges = [1, 3, 5, 7];
    var freeEdges = [];
    for (var e = 0; e < 4; e++) if (b[edges[e]] === '') freeEdges.push(edges[e]);
    if (freeEdges.length) return freeEdges[Math.floor(Math.random() * freeEdges.length)];
    return moveEasy(b);
  }

  function minimax(b, isMaximizing) {
    var wM = getWinner(b);
    if (wM && wM.mark === AI) return 10;
    if (wM && wM.mark === HUMAN) return -10;
    if (wM && wM.mark === 'draw') return 0;

    if (isMaximizing) {
      var bestMax = -Infinity;
      for (var i = 0; i < 9; i++) {
        if (b[i] === '') {
          b[i] = AI;
          var scoreM = minimax(b, false);
          b[i] = '';
          bestMax = Math.max(scoreM, bestMax);
        }
      }
      return bestMax;
    }
    var bestMin = Infinity;
    for (var j = 0; j < 9; j++) {
      if (b[j] === '') {
        b[j] = HUMAN;
        var scoreH = minimax(b, true);
        b[j] = '';
        bestMin = Math.min(scoreH, bestMin);
      }
    }
    return bestMin;
  }

  /** Difícil: elegir el movimiento con puntuación minimax máxima (óptimo en 3x3) */
  function moveHard(b) {
    var best = -Infinity;
    var bestIdx = -1;
    for (var i = 0; i < 9; i++) {
      if (b[i] === '') {
        b[i] = AI;
        var s = minimax(b, false);
        b[i] = '';
        if (s > best) {
          best = s;
          bestIdx = i;
        }
      }
    }
    return bestIdx >= 0 ? bestIdx : moveEasy(b);
  }

  function pickAiMove() {
    var b = state.board;
    var d = elDifficulty.value;
    if (d === 'easy') return moveEasy(b);
    if (d === 'medium') return moveMedium(b);
    return moveHard(b);
  }

  function setStatus(text, variant) {
    elStatus.className = 'status';
    if (variant) elStatus.classList.add('status--' + variant);
    elStatus.textContent = text;
  }

  function renderBoard() {
    var gameOver = state.winner != null;
    var aiTurn = state.phase === 'ai' && !gameOver;
    for (var i = 0; i < 9; i++) {
      var cell = cells[i];
      var v = state.board[i];
      cell.textContent = v;
      cell.classList.remove('cell--x', 'cell--o', 'cell--win', 'cell--ai-thinking');
      if (v === HUMAN) cell.classList.add('cell--x');
      else if (v === AI) cell.classList.add('cell--o');
      if (state.winningLine) {
        for (var wj = 0; wj < state.winningLine.length; wj++) {
          if (state.winningLine[wj] === i) cell.classList.add('cell--win');
        }
      }
      cell.disabled = (v !== '') || gameOver || aiTurn;
      if (aiTurn) {
        elBoard.classList.add('board--thinking');
        cell.classList.add('cell--ai-thinking');
      } else {
        elBoard.classList.remove('board--thinking');
      }
      cell.setAttribute('aria-label', 'Casilla ' + (i + 1) + (v ? ', ' + (v === HUMAN ? 'X' : 'O') : ', vacía'));
    }
  }

  function endGame() {
    var w = getWinner(state.board);
    if (!w) {
      return;
    }
    state.winner = w.mark === 'draw' ? 'draw' : w.mark;
    state.winningLine = w.line;
    state.phase = 'end';
    if (w.mark === HUMAN) {
      setStatus('¡Ganaste! Tres en raya con X.', 'win');
    } else if (w.mark === AI) {
      setStatus('Gana la máquina (O). Tres en raya.', 'lose');
    } else {
      setStatus('Empate. Nadie consiguió tres en raya al llenar el tablero.', 'draw');
    }
    elDifficulty.setAttribute('disabled', 'true');
    renderBoard();
  }

  function onHumanClick(index) {
    if (state.phase !== 'human' || state.winner) return;
    if (state.board[index] !== '') return;

    state.board[index] = HUMAN;
    var w = getWinner(state.board);
    if (w) {
      endGame();
      return;
    }
    state.phase = 'ai';
    var gen = ++playGen;
    setStatus('La máquina (O) está moviendo…', 'ai');
    renderBoard();
    window.setTimeout(function () {
      if (gen !== playGen) return;
      if (state.winner) return;
      var move = pickAiMove();
      if (state.board[move] === '') {
        state.board[move] = AI;
      }
      var w2 = getWinner(state.board);
      if (w2) {
        endGame();
        return;
      }
      state.phase = 'human';
      setStatus('Tu turno — juega una casilla con X', 'human');
      renderBoard();
    }, 280);
  }

  function newGame() {
    playGen++;
    state.board = new Array(9).fill('');
    state.phase = 'human';
    state.winner = null;
    state.winningLine = null;
    setStatus('Tu turno — juega una casilla con X', 'human');
    elDifficulty.removeAttribute('disabled');
    renderBoard();
  }

  function buildGrid() {
    elBoard.textContent = '';
    cells = [];
    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.index = String(idx);
        btn.setAttribute('aria-label', 'Casilla ' + (idx + 1) + ', vacía');
        btn.addEventListener('click', function () { onHumanClick(idx); });
        elBoard.appendChild(btn);
        cells.push(btn);
      })(i);
    }
  }

  elNewGame.addEventListener('click', newGame);
  elDifficulty.addEventListener('change', newGame);

  buildGrid();
  setStatus('Tu turno — juega una casilla con X', 'human');
  renderBoard();
})();
