let currentQuestion = {};
let score = 0;
let lives = 4;
let timer = 30;
let timerInterval;
let attemptsHistory = [];
const MAX_HISTORY = 5;
const MAX_LIVES = 4;

// Configurações de dificuldade
const difficultySettings = {
    easy: {
        baseTime: 30,
        levelTimeDecrease: 5
    },
    medium: {
        baseTime: 15,
        levelTimeDecrease: 3
    },
    hard: {
        baseTime: 10,
        levelTimeDecrease: 2
    }
};

let currentDifficulty = 'easy';

// Estrutura de dados para controlar o progresso das perguntas
let questions = {};
let currentPhase = 2; // Começa na tabuada do 2

// Adicionar variáveis para estatísticas no início do arquivo
let phaseStats = {
    errors: 0,
    corrects: 0,
    totalTime: 0,
    startTime: null
};

// Inicializa as perguntas para uma fase
function initializePhaseQuestions(phase) {
    console.log('Inicializando questões para fase:', phase);
    questions = {};
    // Resetar estatísticas
    phaseStats = {
        errors: 0,
        corrects: 0,
        totalTime: 0,
        startTime: Date.now()
    };
    
    for (let i = 1; i <= 10; i++) {
        const key = `${phase}x${i}`;
        questions[key] = {
            num1: phase,
            num2: i,
            answer: phase * i,
            masteryLevel: 0
        };
    }
    console.log('Questões inicializadas:', questions);
}

// Seleciona a próxima pergunta baseada no mastery level
function selectNextQuestion() {
    console.log('Chamou selectNextQuestion');
    console.log('Estado atual das questões:', questions);
    
    const questionsByMastery = {
        0: [],
        1: []
    };

    // Agrupa questões por mastery level
    Object.keys(questions).forEach(key => {
        const level = questions[key].masteryLevel;
        if (level < 2) {
            questionsByMastery[level].push(key);
        }
    });

    console.log('Questões agrupadas por mastery:', questionsByMastery);

    // Verifica se há questões disponíveis
    const availableQuestions = [...questionsByMastery[0], ...questionsByMastery[1]];
    console.log('Questões disponíveis:', availableQuestions);
    
    if (availableQuestions.length === 0) {
        console.log('Nenhuma questão disponível');
        // Verifica se todas as questões têm mastery level 2
        if (checkPhaseCompletion()) {
            console.log('Fase completada!');
            return null;
        }
    }

    // Seleciona primeiro do menor mastery level disponível
    for (let level = 0; level <= 1; level++) {
        if (questionsByMastery[level].length > 0) {
            const randomIndex = Math.floor(Math.random() * questionsByMastery[level].length);
            console.log(`Selecionou questão do nível ${level}:`, questionsByMastery[level][randomIndex]);
            return questionsByMastery[level][randomIndex];
        }
    }

    console.log('Fallback para primeira questão');
    return Object.keys(questions)[0];
}

// Verifica se a fase foi completada
function checkPhaseCompletion() {
    return Object.values(questions).every(q => q.masteryLevel === 2);
}

// Atualiza a barra de progresso
function updateProgressBar() {
    document.querySelectorAll('.phase').forEach(phase => {
        const phaseNumber = parseInt(phase.dataset.phase);
        if (phaseNumber <= currentPhase) {
            phase.classList.remove('locked');
            if (phaseNumber === currentPhase) {
                phase.innerHTML = `<i class="fas fa-calculator"></i><span>${phaseNumber}</span>`;
            } else {
                phase.innerHTML = `<i class="fas fa-check"></i><span>${phaseNumber}</span>`;
            }
        } else {
            phase.classList.add('locked');
            phase.innerHTML = `<i class="fas fa-lock"></i><span>${phaseNumber}</span>`;
        }
    });
}

// Adicionar função para ganhar vida
function gainLife() {
    if (lives < MAX_LIVES) {
        lives++;
        const heartsContainer = document.querySelector('.hearts-container');
        const newHeart = document.createElement('i');
        newHeart.className = 'fas fa-heart';
        newHeart.style.opacity = '0';
        heartsContainer.appendChild(newHeart);
        
        // Animar o aparecimento do novo coração
        setTimeout(() => {
            newHeart.style.transition = 'opacity 0.5s, transform 0.5s';
            newHeart.style.opacity = '1';
            newHeart.style.transform = 'scale(1.2)';
            setTimeout(() => {
                newHeart.style.transform = 'scale(1)';
            }, 500);
        }, 100);
        
        updateLives();
    }
}

// Atualizar a função showNextPhaseModal
function showNextPhaseModal() {
    // Pausar o jogo quando mostrar o modal
    isPaused = true;
    clearInterval(timerInterval);
    
    // Ganhar uma vida ao completar a fase
    gainLife();
    
    const modal = document.getElementById('nextPhaseModal');
    document.getElementById('currentPhase').textContent = currentPhase;
    document.getElementById('nextPhase').textContent = currentPhase + 1;
    
    // Calcular tempo total em minutos e segundos
    const totalTimeInSeconds = Math.floor((Date.now() - phaseStats.startTime) / 1000);
    const minutes = Math.floor(totalTimeInSeconds / 60);
    const seconds = totalTimeInSeconds % 60;
    
    // Calcular taxa de acerto
    const totalAttempts = phaseStats.corrects + phaseStats.errors;
    const successRate = ((phaseStats.corrects / totalAttempts) * 100).toFixed(1);
    
    // Adicionar mensagem sobre a vida extra
    const lifeGainedMessage = lives < MAX_LIVES ? 
        '<div class="bonus-life"><i class="fas fa-heart"></i> Vida extra conquistada!</div>' : '';
    
    // Atualizar o conteúdo do modal
    const statsHtml = `
        <div class="phase-stats">
            <div class="stat-item">
                <i class="fas fa-check-circle"></i>
                <span>Acertos: ${phaseStats.corrects}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-times-circle"></i>
                <span>Erros: ${phaseStats.errors}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-percentage"></i>
                <span>Taxa de Acerto: ${successRate}%</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-clock"></i>
                <span>Tempo Total: ${minutes}m ${seconds}s</span>
            </div>
        </div>
        ${lifeGainedMessage}
    `;
    
    // Inserir as estatísticas no modal
    document.querySelector('.modal-content.celebration .phase-stats')?.remove();
    document.querySelector('.modal-content.celebration p:first-of-type').insertAdjacentHTML('afterend', statsHtml);
    
    modal.style.display = 'block';
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Adicionar variável de controle de pausa
let isPaused = true;

// Definir tipos de pausa
const PAUSE_TYPES = {
    INITIAL: 'initial',
    TIMER_CLICK: 'timer_click',
    NEXT_PHASE: 'next_phase'
};

// Atualizar função pauseGame para aceitar o tipo de pausa
function pauseGame(pauseType = PAUSE_TYPES.TIMER_CLICK) {
    isPaused = true;
    clearInterval(timerInterval);
    document.getElementById('game').classList.add('game-paused');
    
    const modal = document.getElementById('pauseModal');
    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = modal.querySelector('h2');
    const resumeButton = document.getElementById('resumeGame');
    
    // Remover mensagem anterior se existir
    const existingMessage = modal.querySelector('.pause-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    switch(pauseType) {
        case PAUSE_TYPES.INITIAL:
            modalTitle.innerHTML = '<i class="fas fa-play"></i> Bem-vindo ao Jogo da Tabuada!';
            resumeButton.innerHTML = '<i class="fas fa-play"></i> Iniciar Jogo';
            // Inserir mensagem explicativa após o título
            modalTitle.insertAdjacentHTML(
                'afterend',
                '<p class="pause-message">Pratique suas habilidades de multiplicação.<br />Pronto para começar?</p>'
            );
            break;
            
        case PAUSE_TYPES.NEXT_PHASE:
            modalTitle.innerHTML = `<i class="fas fa-calculator"></i> Tabuada do ${currentPhase}`;
            resumeButton.innerHTML = '<i class="fas fa-play"></i> Começar Nova Fase';
            // Inserir mensagem motivacional após o título
            modalTitle.insertAdjacentHTML(
                'afterend',
                '<p class="pause-message">Prepare-se para a próxima fase!</p>'
            );
            break;
            
        default: // PAUSE_TYPES.TIMER_CLICK
            modalTitle.innerHTML = '<i class="fas fa-pause"></i> Jogo Pausado';
            resumeButton.innerHTML = '<i class="fas fa-play"></i> Continuar Jogo';
    }
    
    modal.style.display = 'block';
}

// Adicionar função para retomar o jogo
function resumeGame() {
    isPaused = false;
    document.getElementById('game').classList.remove('game-paused');
    document.getElementById('pauseModal').style.display = 'none';
    startTimer();
    document.getElementById('answer').focus();
}

// Atualizar a função startTimer para considerar o estado de pausa
function startTimer() {
    if (isPaused) return;
    
    clearInterval(timerInterval);
    const diffSettings = difficultySettings[currentDifficulty];
    timer = diffSettings.baseTime;
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timer--;
            updateTimerDisplay();
            
            if (timer <= 0) {
                loseLife();
                generateQuestion();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timer').textContent = timer;
    if (timer <= 5) {
        document.getElementById('timer').style.color = '#ff4757';
    } else {
        document.getElementById('timer').style.color = '#2ed573';
    }
}

// Modifica a funço generateQuestion
function generateQuestion() {
    const questionKey = selectNextQuestion();
    
    if (questionKey === null && checkPhaseCompletion()) {
        // Só mostra o modal se realmente completou a fase
        if (currentPhase < 9) {
            showNextPhaseModal();
            return;
        }
        // Jogo completado
        alert('Parabéns! Você completou todas as tabuadas!');
        return;
    }

    currentQuestion = questions[questionKey];
    document.getElementById('question').textContent = `${currentQuestion.num1} × ${currentQuestion.num2} = ?`;
    document.getElementById('answer').value = '';
    
    if (!isPaused) {
        document.getElementById('answer').focus();
        startTimer();
    }
}

function loseLife() {
    const hearts = document.querySelectorAll('.hearts-container .fa-heart');
    const livesElement = document.getElementById('lives');
    
    if (lives > 0) {
        // Adiciona animação ao coração que será perdido
        hearts[lives - 1].classList.add('heart-lost');
        
        // Adiciona animação de destaque vermelho
        livesElement.classList.remove('lives-highlight');
        void livesElement.offsetWidth; // Força um reflow para reiniciar a animação
        livesElement.classList.add('lives-highlight');
        
        // Espera a animação terminar antes de atualizar as vidas
        setTimeout(() => {
            lives--;
            updateLives();
            
            if (lives <= 0) {
                gameOver();
            }
        }, 500);
    }
}

function updateLives() {
    const heartsContainer = document.querySelector('.hearts-container');
    heartsContainer.innerHTML = '';
    
    for (let i = 0; i < MAX_LIVES; i++) {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart';
        if (i >= lives) {
            heart.style.opacity = '0.3';
        }
        heartsContainer.appendChild(heart);
    }
}

// Adicionar constantes para o sistema de high scores
const MAX_HIGH_SCORES = 5;

// Função para carregar high scores
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('highScores')) || [];
    return scores;
}

// Função para salvar high scores
function saveHighScores(scores) {
    localStorage.setItem('highScores', JSON.stringify(scores));
}

// Função para atualizar a exibição dos high scores
function updateHighScoresDisplay(newScore = null) {
    console.log('Atualizando exibição dos high scores');
    const highScoresList = document.getElementById('highScoresList');
    console.log('Elemento highScoresList existe:', !!highScoresList);
    
    const scores = loadHighScores();
    console.log('Scores carregados:', scores);
    
    if (highScoresList) {
        highScoresList.innerHTML = scores
            .map((score, index) => `
                <div class="score-item ${newScore && score.score === newScore.score && score.name === newScore.name ? 'highlight' : ''}">
                    <span class="score-rank">#${index + 1}</span>
                    <span class="score-name">${score.name}</span>
                    <span class="score-value">${score.score}</span>
                </div>
            `)
            .join('');
        console.log('HTML dos high scores atualizado');
    } else {
        console.log('Elemento highScoresList não encontrado');
    }
}

// Atualizar a função gameOver
function gameOver() {
    const modal = document.getElementById('gameOverModal');
    const playerNameInput = document.getElementById('playerName');
    const saveScoreBtn = document.getElementById('saveScore');
    
    // Resetar o estado do modal
    document.getElementById('finalScore').textContent = score;
    playerNameInput.value = '';
    playerNameInput.disabled = false;
    playerNameInput.style.borderColor = '#1e3c72';
    saveScoreBtn.disabled = false;
    saveScoreBtn.textContent = 'Salvar Pontuação';
    saveScoreBtn.style.backgroundColor = ''; // Remove o estilo inline
    
    // Atualizar a lista de high scores
    updateHighScoresDisplay();
    
    // Mostrar o modal
    modal.style.display = 'block';
    
    // Focar no input do nome
    playerNameInput.focus();
    
    // Resetar vidas para o valor configurado
    lives = parseInt(localStorage.getItem('maxLives') || '4');
}

// Atualizar a função addHighScore com logs
function addHighScore(name, scoreValue) {
    console.log('Tentando adicionar high score:', { name, score: scoreValue });
    
    const newScore = { 
        name, 
        score: scoreValue, 
        date: new Date().toISOString() 
    };
    
    let highScores = loadHighScores();
    console.log('High scores atuais:', highScores);
    
    // Adiciona o novo score e ordena
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    console.log('High scores após adicionar novo:', highScores);
    
    // Mantém apenas os top scores
    highScores = highScores.slice(0, MAX_HIGH_SCORES);
    console.log('High scores após slice:', highScores);
    
    // Salva os scores atualizados
    saveHighScores(highScores);
    
    // Atualiza a exibição com destaque para o novo score
    updateHighScoresDisplay(newScore);
    
    return highScores.findIndex(s => s.name === name && s.score === scoreValue) + 1;
}

// Modifica a função checkAnswer
function checkAnswer() {
    const userAnswer = parseInt(document.getElementById('answer').value);
    const questionDiv = document.getElementById('question');
    const scoreElement = document.getElementById('score');
    
    if (userAnswer === currentQuestion.answer) {
        playSound('correctSound');
        score += 10;
        phaseStats.corrects++; // Registrar acerto
        
        // Aumenta o mastery level
        const key = `${currentQuestion.num1}x${currentQuestion.num2}`;
        if (questions[key].masteryLevel < 2) {
            questions[key].masteryLevel++;
        }
        
        updateHistory(true);
        scoreElement.classList.remove('score-highlight');
        void scoreElement.offsetWidth;
        scoreElement.classList.add('score-highlight');
    } else {
        playSound('wrongSound');
        phaseStats.errors++; // Registrar erro
        const key = `${currentQuestion.num1}x${currentQuestion.num2}`;
        questions[key].masteryLevel = 0; // Reset mastery level on error
        loseLife();
        updateHistory(false);
    }
    
    saveProgress();
    updateDisplay();
    generateQuestion();
}

function updateDisplay() {
    document.getElementById('scoreValue').textContent = score;
    updateLives();
}

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    sound.currentTime = 0;
    sound.play();
}

// Funções do Modal
function openModal() {
    document.getElementById('configModal').style.display = 'block';
    // Seleciona a dificuldade atual no select
    document.getElementById('difficulty').value = currentDifficulty;
}

function closeModal() {
    document.getElementById('configModal').style.display = 'none';
}

function saveConfig() {
    const newDifficulty = document.getElementById('difficulty').value;
    const newLivesCount = parseInt(document.getElementById('lives-count').value);
    let shouldUpdateDisplay = false;
    
    if (newDifficulty !== currentDifficulty) {
        currentDifficulty = newDifficulty;
        localStorage.setItem('gameDifficulty', currentDifficulty);
        startTimer();
    }
    
    if (newLivesCount !== MAX_LIVES) {
        lives = newLivesCount;
        localStorage.setItem('maxLives', newLivesCount.toString());
        shouldUpdateDisplay = true;
    }
    
    if (shouldUpdateDisplay) {
        updateDisplay();
    }
    
    closeModal();
}

// Event Listeners para o modal
document.getElementById('configBtn').addEventListener('click', openModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('saveConfig').addEventListener('click', saveConfig);

// Fechar modal quando clicar fora dele
window.addEventListener('click', function(event) {
    const modal = document.getElementById('configModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Remover as definições de window.onload e substituir por addEventListener
window.addEventListener('load', () => {
    console.log('Iniciando o jogo...');
    
    // Carregar configurações salvas
    const savedDifficulty = localStorage.getItem('gameDifficulty');
    const savedLives = localStorage.getItem('maxLives');
    
    if (savedDifficulty) {
        console.log('Dificuldade salva encontrada:', savedDifficulty);
        currentDifficulty = savedDifficulty;
        document.getElementById('difficulty').value = currentDifficulty;
    }
    
    if (savedLives) {
        console.log('Número de vidas salvo encontrado:', savedLives);
        lives = parseInt(savedLives);
        document.getElementById('lives-count').value = savedLives;
    } else {
        document.getElementById('lives-count').value = '4'; // Valor padrão
    }
    
    // Carregar fase salva (se existir)
    const savedPhase = localStorage.getItem('currentPhase');
    console.log('Fase salva:', savedPhase);
    if (savedPhase) {
        currentPhase = parseInt(savedPhase);
    } else {
        currentPhase = 2;
        localStorage.setItem('currentPhase', currentPhase);
    }
    
    console.log('Fase atual:', currentPhase);
    
    // Inicializar as questões para a fase atual
    initializePhaseQuestions(currentPhase);
    
    // Carregar progresso específico da fase
    loadProgress();
    
    // Atualizar a interface
    updateProgressBar();
    updateDisplay();
    
    // Inicializar o histórico vazio
    attemptsHistory = [];
    updateHistory();
    
    // Gerar a primeira questão
    generateQuestion();
    
    // Inicializar o jogo pausado com mensagem inicial
    isPaused = true;
    document.getElementById('game').classList.add('game-paused');
    pauseGame(PAUSE_TYPES.INITIAL);
});

// Salvar configurações quando mudar
document.getElementById('difficulty').addEventListener('change', function() {
    localStorage.setItem('gameDifficulty', this.value);
});

// Entrada pelo teclado
document.getElementById('answer').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkAnswer();
    }
});

// Garantir que a função updateHistory esteja definida corretamente:
function updateHistory(isCorrect) {
    // Se isCorrect não foi fornecido, apenas atualiza a exibição
    if (typeof isCorrect === 'boolean') {
        // Adiciona nova tentativa no final do array
        attemptsHistory.push(isCorrect);
        
        // Mantém apenas as últimas 10 tentativas
        if (attemptsHistory.length > MAX_HISTORY) {
            attemptsHistory = attemptsHistory.slice(-MAX_HISTORY);
        }
    }
    
    // Atualiza a exibição do histórico
    const historyContainer = document.getElementById('attempts-history');
    if (historyContainer) {
        historyContainer.innerHTML = '';
        
        attemptsHistory.forEach((attempt, index) => {
            const icon = document.createElement('i');
            icon.className = `fas ${attempt ? 'fa-check-circle' : 'fa-times-circle'} attempt-icon ${attempt ? 'correct' : 'wrong'}`;
            if (index === attemptsHistory.length - 1) {
                icon.classList.add('new');
            }
            historyContainer.appendChild(icon);
        });
    }
}

// Adiciona handler para o botão de próxima fase
document.getElementById('startNextPhase').addEventListener('click', function() {
    currentPhase++;
    localStorage.setItem('currentPhase', currentPhase);
    initializePhaseQuestions(currentPhase);
    updateProgressBar();
    document.getElementById('nextPhaseModal').style.display = 'none';
    
    // Iniciar a nova fase pausada com mensagem específica
    isPaused = true;
    document.getElementById('game').classList.add('game-paused');
    pauseGame(PAUSE_TYPES.NEXT_PHASE);
    
    generateQuestion();
});

// Adicionar função para mudar de fase
function changePhase(newPhase) {
    if (newPhase >= 2 && newPhase <= currentPhase) {
        currentPhase = newPhase;
        localStorage.setItem('currentPhase', currentPhase);
        initializePhaseQuestions(currentPhase);
        updateProgressBar();
        generateQuestion();
    }
}

// Adicionar evento de clique para as fases na barra de progresso
document.querySelectorAll('.phase').forEach(phase => {
    phase.addEventListener('click', function() {
        const phaseNumber = parseInt(this.dataset.phase);
        changePhase(phaseNumber);
    });
});

// Atualizar o event listener para o botão de jogar novamente
document.getElementById('restartGame').addEventListener('click', function() {
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('saveScore').style.display = 'block';
    document.getElementById('playerName').disabled = false;
    
    // Reiniciar para a primeira fase
    currentPhase = 2;
    localStorage.setItem('currentPhase', currentPhase);
    
    // Reinicializar o jogo
    initializePhaseQuestions(currentPhase);
    lives = 4;
    score = 0;
    
    // Limpar o histórico de tentativas
    attemptsHistory = [];
    const historyContainer = document.getElementById('attempts-history');
    if (historyContainer) {
        historyContainer.innerHTML = '';
    }
    
    updateProgressBar(); // Atualizar a barra de progresso para mostrar apenas fase 2 desbloqueada
    updateDisplay();
    
    // Iniciar pausado com mensagem inicial
    isPaused = true;
    document.getElementById('game').classList.add('game-paused');
    pauseGame(PAUSE_TYPES.INITIAL);
    
    generateQuestion();
});

// Salvar progresso das questões
function saveProgress() {
    localStorage.setItem('questions', JSON.stringify(questions));
}

// Atualizar a função loadProgress para considerar a fase atual
function loadProgress() {
    console.log('Tentando carregar progresso salvo');
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
        console.log('Progresso encontrado no localStorage');
        const loadedQuestions = JSON.parse(savedQuestions);
        
        // Verificar se as questões carregadas são da fase atual
        const firstQuestion = Object.keys(loadedQuestions)[0];
        const savedPhaseNumber = parseInt(firstQuestion.split('x')[0]);
        
        if (savedPhaseNumber === currentPhase) {
            console.log('Carregando questões da fase atual:', currentPhase);
            questions = loadedQuestions;
        } else {
            console.log('Questões salvas são de outra fase, inicializando nova fase');
            initializePhaseQuestions(currentPhase);
        }
    } else {
        console.log('Nenhum progresso encontrado no localStorage');
    }
}

// Atualizar a função resetProgress para limpar o histórico
function resetProgress() {
    // Salvar os high scores antes de limpar o localStorage
    const highScores = loadHighScores();
    
    // Limpar localStorage
    localStorage.clear();
    
    // Restaurar os high scores
    saveHighScores(highScores);
    
    // Resetar o estado do jogo
    currentPhase = 2;
    questions = {};
    initializePhaseQuestions(currentPhase);
    lives = 4;
    score = 0;
    
    // Limpar o histórico de tentativas
    attemptsHistory = [];
    const historyContainer = document.getElementById('attempts-history');
    if (historyContainer) {
        historyContainer.innerHTML = '';
    }
    
    // Atualizar a interface
    updateProgressBar();
    updateDisplay();
    generateQuestion();
}

// Adicionar função para resetar apenas os high scores
function resetHighScores() {
    if (confirm('Tem certeza que deseja limpar o ranking? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('highScores');
        updateHighScoresDisplay();
        alert('Ranking limpo com sucesso!');
    }
}

// Adicionar event listener para o botão de reset do ranking
document.getElementById('resetHighScores').addEventListener('click', resetHighScores);

// Adicionar o event listener para o botão de reiniciar
document.getElementById('restartBtn').addEventListener('click', function() {
    if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.')) {
        resetProgress();
        closeModal(); // Fecha qualquer modal que esteja aberto
    }
});

// Atualizar o event listener para o botão de salvar pontuação
document.getElementById('saveScore').addEventListener('click', function() {
    console.log('Botão de salvar clicado');
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    console.log('Nome do jogador:', playerName);
    console.log('Pontuação atual:', score);
    
    if (playerName) {
        console.log('Tentando salvar pontuação');
        // Adiciona o novo score
        addHighScore(playerName, score);
        
        console.log('Desabilitando input e botão');
        // Desabilita o input e oculta o botão após salvar
        playerNameInput.disabled = true;
        this.style.display = 'none'; // Oculta o botão ao invés de apenas desabilitá-lo
    } else {
        console.log('Nome vazio, mostrando feedback');
        // Feedback visual se o nome estiver vazio
        playerNameInput.style.borderColor = '#ff4757';
        playerNameInput.placeholder = 'Digite seu nome primeiro!';
        
        // Volta ao normal após 2 segundos
        setTimeout(() => {
            playerNameInput.style.borderColor = '#1e3c72';
            playerNameInput.placeholder = 'Seu nome';
        }, 2000);
    }
});

// Adicionar event listener para o input do nome permitir salvar com Enter
document.getElementById('playerName').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('saveScore').click();
    }
});

// Atualizar os event listeners para os botões de high scores
document.getElementById('showHighScores').addEventListener('click', showHighScoresModal);
document.getElementById('showHighScoresMobile').addEventListener('click', showHighScoresModal);

// Criar função separada para mostrar o modal (evitar duplicação de código)
function showHighScoresModal() {
    const modal = document.getElementById('highScoresModal');
    const highScoresList = document.getElementById('highScoresListModal');
    const scores = loadHighScores();
    
    highScoresList.innerHTML = scores
        .map((score, index) => `
            <div class="score-item">
                <span class="score-rank">#${index + 1}</span>
                <span class="score-name">${score.name}</span>
                <span class="score-value">${score.score}</span>
            </div>
        `)
        .join('');
    
    modal.style.display = 'block';
}

// Atualizar o event listener de clique fora do modal para incluir o novo modal
window.addEventListener('click', function(event) {
    const configModal = document.getElementById('configModal');
    const highScoresModal = document.getElementById('highScoresModal');
    const pauseModal = document.getElementById('pauseModal');
    
    if (event.target === configModal) {
        closeModal();
    }
    if (event.target === highScoresModal) {
        highScoresModal.style.display = 'none';
    }
    // Não fechar o modal de pausa ao clicar fora
});

// Adicionar pausa quando a janela perde foco
window.addEventListener('blur', () => {
    if (!isPaused) {
        pauseGame();
    }
});

// Adicionar event listener para o timer
document.getElementById('timer').addEventListener('click', () => pauseGame(PAUSE_TYPES.TIMER_CLICK));

// Adicionar event listener para o botão de retomar
document.getElementById('resumeGame').addEventListener('click', resumeGame);

// Atualizar a função para ajustar o zoom
function adjustZoom() {
    const container = document.querySelector('.container');
    const windowHeight = window.innerHeight;
    const contentHeight = container.scrollHeight;
    
    // Calcular o zoom necessário (com uma pequena margem de segurança)
    // Adicionando 0.06 (6%) ao cálculo
    // let zoomLevel = ((windowHeight / (contentHeight + 40)) * 0.95) + 0.06;

    // Removendo a 'margem de segurança' pois o zoom já é suficiente.
    let zoomLevel = ((windowHeight / (contentHeight)));
    
    // Limitar o zoom entre 0.5 e 1 para evitar distorções extremas
    zoomLevel = Math.min(Math.max(zoomLevel, 0.5), 1);
    
    // Aplicar o zoom
    document.body.style.zoom = zoomLevel;
}

// Adicionar chamada da função no carregamento e no redimensionamento
window.addEventListener('load', adjustZoom);
window.addEventListener('resize', adjustZoom);

// Adicionar event listener para o botão de fechar o modal de ranking
document.getElementById('closeHighScores').addEventListener('click', function() {
    document.getElementById('highScoresModal').style.display = 'none';
});
  