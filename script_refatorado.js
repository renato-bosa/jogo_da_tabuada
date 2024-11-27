class GameState {
    constructor() {
        // Estado do jogo
        this.isPaused = true;
        this.currentPhase = 2;
        this.highestPhase = 2;
        this.currentQuestion = {};
        this.score = 0;
        this.lives = 4;
        this.timer = 30;
        this.timerInterval = null;
        this.attemptsHistory = [];
        
        // Constantes
        this.MAX_HISTORY = 5;
        this.MAX_LIVES = 4;
        this.MAX_HIGH_SCORES = 5;
        
        // Configurações
        this.currentDifficulty = 'easy';
        this.difficultySettings = {
            easy: { baseTime: 30, levelTimeDecrease: 5 },
            medium: { baseTime: 15, levelTimeDecrease: 3 },
            hard: { baseTime: 10, levelTimeDecrease: 2 }
        };
        
        // Tipos de pausa
        this.PAUSE_TYPES = {
            INITIAL: 'initial',
            TIMER_CLICK: 'timer_click',
            NEXT_PHASE: 'next_phase',
            WRONG_ANSWER: 'wrong_answer'
        };
        
        // Estrutura de dados para questões
        this.questions = {};
        
        // Estatísticas da fase
        this.phaseStats = {
            errors: 0,
            corrects: 0,
            totalTime: 0,
            startTime: null
        };
    }

    // Métodos para gerenciar o estado
    getIsPaused() { return this.isPaused; }
    setIsPaused(value) { this.isPaused = value; }
    
    getCurrentPhase() { return this.currentPhase; }
    setCurrentPhase(value) { this.currentPhase = value; }
    
    getScore() { return this.score; }
    setScore(value) { this.score = value; }
    
    getLives() { return this.lives; }
    setLives(value) { this.lives = value; }

    // Métodos para salvar/carregar estado
    saveToLocalStorage() {
        localStorage.setItem('currentPhase', this.currentPhase);
        localStorage.setItem('highestPhase', this.highestPhase);
        localStorage.setItem('score', this.score);
        localStorage.setItem('lives', this.lives);
        localStorage.setItem('difficulty', this.currentDifficulty);
        localStorage.setItem('questions', JSON.stringify(this.questions));
    }

    loadFromLocalStorage() {
        const savedPhase = localStorage.getItem('currentPhase');
        if (savedPhase) this.currentPhase = parseInt(savedPhase);

        const savedHighestPhase = localStorage.getItem('highestPhase');
        if (savedHighestPhase) this.highestPhase = parseInt(savedHighestPhase);

        const savedScore = localStorage.getItem('score');
        if (savedScore) this.score = parseInt(savedScore);

        const savedLives = localStorage.getItem('lives');
        if (savedLives) this.lives = parseInt(savedLives);

        const savedDifficulty = localStorage.getItem('difficulty');
        if (savedDifficulty) this.currentDifficulty = savedDifficulty;

        const savedQuestions = localStorage.getItem('questions');
        if (savedQuestions) this.questions = JSON.parse(savedQuestions);
    }

    reset() {
        this.currentPhase = 2;
        this.score = 0;
        this.lives = this.MAX_LIVES;
        this.attemptsHistory = [];
        this.questions = {};
        this.phaseStats = {
            errors: 0,
            corrects: 0,
            totalTime: 0,
            startTime: Date.now()
        };
    }
}

class GameController {
    constructor() {
        this.gameState = new GameState();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Input de resposta
        document.getElementById('answer').addEventListener('keypress', (e) => {
            console.log('Tecla pressionada:', e.key);
            console.log('Estado pausado:', this.gameState.getIsPaused());
            
            if (e.key === 'Enter' && !this.gameState.getIsPaused()) {
                console.log('Enter pressionado e jogo não pausado');
                e.preventDefault(); // Prevenir comportamento padrão do Enter
                this.checkAnswer();
            }
        });

        // Botão de verificar
        document.querySelector('.check-btn').addEventListener('click', (e) => {
            if (!this.gameState.getIsPaused()) {
                e.preventDefault(); // Prevenir comportamento padrão do clique
                this.checkAnswer();
            }
        });

        // Timer click
        document.getElementById('timer').addEventListener('click', () => {
            this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
        });

        // Botão de retomar
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.resumeGame();
        });

        // Novos event listeners
        // Botão de fechar modal de configurações
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('configModal').style.display = 'none';
        });

        // Botão de fechar modal de ranking
        document.getElementById('closeHighScores').addEventListener('click', () => {
            document.getElementById('highScoresModal').style.display = 'none';
        });

        // Botões de mostrar ranking (desktop e mobile)
        document.getElementById('showHighScores').addEventListener('click', () => {
            this.showHighScoresModal();
        });
        document.getElementById('showHighScoresMobile').addEventListener('click', () => {
            this.showHighScoresModal();
        });

        // Botão de resetar ranking
        document.getElementById('resetHighScores').addEventListener('click', () => {
            this.resetHighScores();
        });

        // Botão de continuar após resposta errada
        document.getElementById('continueAfterWrong').addEventListener('click', () => {
            this.continueAfterWrong();
        });

        // Botão de reiniciar jogo
        document.getElementById('restartBtn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja reiniciar o jogo? Todo o progresso será perdido.')) {
                this.resetProgress();
                document.getElementById('configModal').style.display = 'none';
            }
        });

        // Salvar configurações quando mudar dificuldade
        document.getElementById('difficulty').addEventListener('change', (e) => {
            localStorage.setItem('gameDifficulty', e.target.value);
        });

        // Enter no modal de resposta errada
        /*
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && 
                document.getElementById('wrongAnswerModal').style.display === 'block') {
                this.continueAfterWrong();
            }
        });
        */

        // Clique fora dos modais
        window.addEventListener('click', (e) => {
            const configModal = document.getElementById('configModal');
            const highScoresModal = document.getElementById('highScoresModal');
            
            if (e.target === configModal) {
                configModal.style.display = 'none';
            }
            if (e.target === highScoresModal) {
                highScoresModal.style.display = 'none';
            }
            // Não fechar o modal de pausa ao clicar fora
        });

        // Ajuste de zoom
        window.addEventListener('load', this.adjustZoom);
        window.addEventListener('resize', this.adjustZoom);

        // Perda de foco da janela
        window.addEventListener('blur', () => {
            if (!this.gameState.getIsPaused()) {
                this.pauseGame();
            }
        });

        // Inicializar outros listeners
        this.initializeConfigListeners();
        this.initializeGameOverListeners();
        this.initializePhaseListeners();
    }

    initializeConfigListeners() {
        // Configurações
        document.getElementById('configBtn').addEventListener('click', () => {
            this.openConfigModal();
        });

        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });

        // ... outros listeners relacionados a configurações
    }

    checkAnswer() {
        console.log('checkAnswer iniciado');
        console.log('Estado do jogo pausado:', this.gameState.getIsPaused());

        if (this.gameState.getIsPaused()) {
            console.log('Jogo pausado, ignorando resposta');
            return;
        }
        
        const userAnswer = parseInt(document.getElementById('answer').value);
        console.log('Resposta do usuário:', userAnswer);
        console.log('Resposta correta:', this.gameState.currentQuestion.answer);
        
        if (isNaN(userAnswer)) {
            console.log('Resposta inválida (não é um número)');
            return;
        }
        
        if (userAnswer === this.gameState.currentQuestion.answer) {
            console.log('Resposta correta!');
            this.handleCorrectAnswer();
        } else {
            console.log('Resposta incorreta!');
            this.handleWrongAnswer();
            return; // Importante: retornar aqui para não continuar a execução
        }
        
        this.saveProgress();
        this.updateDisplay();
        this.generateQuestion();
    }

    handleCorrectAnswer() {
        this.playSound('correctSound');
        this.gameState.score += 10;
        this.gameState.phaseStats.corrects++;
        
        const key = `${this.gameState.currentQuestion.num1}x${this.gameState.currentQuestion.num2}`;
        if (this.gameState.questions[key].masteryLevel < 2) {
            this.gameState.questions[key].masteryLevel++;
        }
        
        this.updateHistory(true);
        this.animateScoreElement();
        
        this.saveProgress();
        this.updateDisplay();
        this.generateQuestion();
    }

    handleWrongAnswer() {
        console.log('Iniciando handleWrongAnswer');
        this.playSound('wrongSound');
        this.gameState.phaseStats.errors++;
        
        const key = `${this.gameState.currentQuestion.num1}x${this.gameState.currentQuestion.num2}`;
        this.gameState.questions[key].masteryLevel = 0;
        
        console.log('Pausando o jogo');
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');
        
        console.log('Mostrando modal de resposta errada');
        this.showWrongAnswerModal();
        this.loseLife();
        this.updateHistory(false);
        console.log('handleWrongAnswer finalizado');
    }

    generateQuestion() {
        const questionKey = this.selectNextQuestion();
        
        if (questionKey === null && this.checkPhaseCompletion()) {
            if (this.gameState.currentPhase < 9) {
                this.showNextPhaseModal();
                return;
            }
            alert('Parabéns! Você completou todas as tabuadas!');
            return;
        }

        this.gameState.currentQuestion = this.gameState.questions[questionKey];
        document.getElementById('question').textContent = 
            `${this.gameState.currentQuestion.num1} × ${this.gameState.currentQuestion.num2} = ?`;
        document.getElementById('answer').value = '';
        
        if (!this.gameState.getIsPaused()) {
            document.getElementById('answer').focus();
            this.startTimer();
        }
    }

    selectNextQuestion() {
        const questionsByMastery = {
            0: [],
            1: []
        };

        Object.keys(this.gameState.questions).forEach(key => {
            const level = this.gameState.questions[key].masteryLevel;
            if (level < 2) {
                questionsByMastery[level].push(key);
            }
        });

        const availableQuestions = [...questionsByMastery[0], ...questionsByMastery[1]];
        
        if (availableQuestions.length === 0) {
            if (this.checkPhaseCompletion()) {
                return null;
            }
        }

        for (let level = 0; level <= 1; level++) {
            if (questionsByMastery[level].length > 0) {
                const randomIndex = Math.floor(Math.random() * questionsByMastery[level].length);
                return questionsByMastery[level][randomIndex];
            }
        }

        return Object.keys(this.gameState.questions)[0];
    }

    checkPhaseCompletion() {
        return Object.values(this.gameState.questions)
            .every(q => q.masteryLevel === 2);
    }

    startTimer() {
        if (this.gameState.getIsPaused()) return;
        
        clearInterval(this.gameState.timerInterval);
        const diffSettings = this.gameState.difficultySettings[this.gameState.currentDifficulty];
        this.gameState.timer = diffSettings.baseTime;
        
        this.updateTimerDisplay();
        
        this.gameState.timerInterval = setInterval(() => {
            if (!this.gameState.getIsPaused()) {
                this.gameState.timer--;
                this.updateTimerDisplay();
                
                if (this.gameState.timer <= 0) {
                    this.loseLife();
                    this.generateQuestion();
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = this.gameState.timer;
        timerElement.style.color = this.gameState.timer <= 5 ? '#ff4757' : '#2ed573';
    }

    playSound(soundId) {
        const sound = document.getElementById(soundId);
        sound.currentTime = 0;
        sound.play();
    }

    pauseGame(pauseType = this.gameState.PAUSE_TYPES.TIMER_CLICK) {
        this.gameState.setIsPaused(true);
        clearInterval(this.gameState.timerInterval);
        document.getElementById('game').classList.add('game-paused');
        
        const modal = document.getElementById('pauseModal');
        const modalTitle = modal.querySelector('h2');
        const resumeButton = document.getElementById('resumeGame');
        
        // Remover mensagem anterior se existir
        const existingMessage = modal.querySelector('.pause-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        switch(pauseType) {
            case this.gameState.PAUSE_TYPES.INITIAL:
                modalTitle.innerHTML = '<i class="fas fa-play"></i> Bem-vindo ao Jogo da Tabuada!';
                resumeButton.innerHTML = '<i class="fas fa-play"></i> Iniciar Jogo';
                modalTitle.insertAdjacentHTML(
                    'afterend',
                    '<p class="pause-message">Pratique suas habilidades de multiplicação.<br />Pronto para começar?</p>'
                );
                break;
                
            case this.gameState.PAUSE_TYPES.NEXT_PHASE:
                modalTitle.innerHTML = `<i class="fas fa-calculator"></i> Tabuada do ${this.gameState.currentPhase}`;
                resumeButton.innerHTML = '<i class="fas fa-play"></i> Começar Nova Fase';
                modalTitle.insertAdjacentHTML(
                    'afterend',
                    '<p class="pause-message">Prepare-se para a próxima fase!</p>'
                );
                break;
                
            default:
                modalTitle.innerHTML = '<i class="fas fa-pause"></i> Jogo Pausado';
                resumeButton.innerHTML = '<i class="fas fa-play"></i> Continuar Jogo';
        }
        
        modal.style.display = 'block';
    }

    resumeGame() {
        this.gameState.setIsPaused(false);
        document.getElementById('game').classList.remove('game-paused');
        document.getElementById('pauseModal').style.display = 'none';
        this.startTimer();
        document.getElementById('answer').focus();
    }

    loseLife() {
        const hearts = document.querySelectorAll('.hearts-container .fa-heart');
        const livesElement = document.getElementById('lives');
        
        if (this.gameState.lives > 0) {
            hearts[this.gameState.lives - 1].classList.add('heart-lost');
            livesElement.classList.remove('lives-highlight');
            void livesElement.offsetWidth;
            livesElement.classList.add('lives-highlight');
            
            setTimeout(() => {
                this.gameState.lives--;
                this.updateLives();
                
                if (this.gameState.lives <= 0) {
                    this.gameOver();
                }
            }, 500);
        }
    }

    updateLives() {
        const heartsContainer = document.querySelector('.hearts-container');
        heartsContainer.innerHTML = '';
        
        for (let i = 0; i < this.gameState.MAX_LIVES; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart';
            if (i >= this.gameState.lives) {
                heart.style.opacity = '0.3';
            }
            heartsContainer.appendChild(heart);
        }
    }

    gainLife() {
        if (this.gameState.lives < this.gameState.MAX_LIVES) {
            this.gameState.lives++;
            const heartsContainer = document.querySelector('.hearts-container');
            const newHeart = document.createElement('i');
            newHeart.className = 'fas fa-heart';
            newHeart.style.opacity = '0';
            heartsContainer.appendChild(newHeart);
            
            setTimeout(() => {
                newHeart.style.transition = 'opacity 0.5s, transform 0.5s';
                newHeart.style.opacity = '1';
                newHeart.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    newHeart.style.transform = 'scale(1)';
                }, 500);
            }, 100);
            
            this.updateLives();
        }
    }

    showNextPhaseModal() {
        this.gameState.setIsPaused(true);
        clearInterval(this.gameState.timerInterval);
        
        this.gainLife();
        
        const modal = document.getElementById('nextPhaseModal');
        document.getElementById('currentPhase').textContent = this.gameState.currentPhase;
        document.getElementById('nextPhase').textContent = this.gameState.currentPhase + 1;
        
        const totalTimeInSeconds = Math.floor((Date.now() - this.gameState.phaseStats.startTime) / 1000);
        const minutes = Math.floor(totalTimeInSeconds / 60);
        const seconds = totalTimeInSeconds % 60;
        
        const totalAttempts = this.gameState.phaseStats.corrects + this.gameState.phaseStats.errors;
        const successRate = ((this.gameState.phaseStats.corrects / totalAttempts) * 100).toFixed(1);
        
        const lifeGainedMessage = this.gameState.lives < this.gameState.MAX_LIVES ? 
            '<div class="bonus-life"><i class="fas fa-heart"></i> Vida extra conquistada!</div>' : '';
        
        const statsHtml = `
            <div class="phase-stats">
                <div class="stat-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Acertos: ${this.gameState.phaseStats.corrects}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-times-circle"></i>
                    <span>Erros: ${this.gameState.phaseStats.errors}</span>
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
        
        document.querySelector('.modal-content.celebration .phase-stats')?.remove();
        document.querySelector('.modal-content.celebration p:first-of-type')
            .insertAdjacentHTML('afterend', statsHtml);
        
        modal.style.display = 'block';
    }

    initializeGameOverListeners() {
        document.getElementById('restartGame').addEventListener('click', () => {
            document.getElementById('gameOverModal').style.display = 'none';
            document.getElementById('saveScore').style.display = 'block';
            document.getElementById('playerName').disabled = false;
            
            this.gameState.reset();
            this.initializePhaseQuestions();
            this.updateProgressBar();
            this.updateDisplay();
            
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
            this.pauseGame(this.gameState.PAUSE_TYPES.INITIAL);
            
            this.generateQuestion();
        });

        document.getElementById('saveScore').addEventListener('click', () => {
            const playerNameInput = document.getElementById('playerName');
            const playerName = playerNameInput.value.trim();
            
            if (playerName) {
                this.addHighScore(playerName, this.gameState.score);
                playerNameInput.disabled = true;
                document.getElementById('saveScore').style.display = 'none';
            } else {
                playerNameInput.style.borderColor = '#ff4757';
                playerNameInput.placeholder = 'Digite seu nome primeiro!';
                setTimeout(() => {
                    playerNameInput.style.borderColor = '#1e3c72';
                    playerNameInput.placeholder = 'Seu nome';
                }, 2000);
            }
        });
    }

    initializePhaseListeners() {
        document.getElementById('startNextPhase').addEventListener('click', () => {
            this.gameState.currentPhase++;
            if (this.gameState.currentPhase > this.gameState.highestPhase) {
                this.gameState.highestPhase = this.gameState.currentPhase;
                localStorage.setItem('highestPhase', this.gameState.highestPhase);
            }
            
            localStorage.setItem('currentPhase', this.gameState.currentPhase);
            this.initializePhaseQuestions();
            this.updateProgressBar();
            document.getElementById('nextPhaseModal').style.display = 'none';
            
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
            this.pauseGame(this.gameState.PAUSE_TYPES.NEXT_PHASE);
            
            this.generateQuestion();
        });

        document.querySelectorAll('.phase').forEach(phase => {
            phase.addEventListener('click', () => {
                const phaseNumber = parseInt(phase.dataset.phase);
                this.changePhase(phaseNumber);
            });
        });
    }

    changePhase(newPhase) {
        if (newPhase >= 2 && newPhase <= this.gameState.highestPhase) {
            this.gameState.currentPhase = newPhase;
            localStorage.setItem('currentPhase', this.gameState.currentPhase);
            this.initializePhaseQuestions();
            this.updateProgressBar();
            this.generateQuestion();
        }
    }

    initializePhaseQuestions() {
        console.log('Inicializando questões para fase:', this.gameState.currentPhase);
        this.gameState.questions = {};
        this.gameState.phaseStats = {
            errors: 0,
            corrects: 0,
            totalTime: 0,
            startTime: Date.now()
        };
        
        for (let i = 1; i <= 10; i++) {
            const key = `${this.gameState.currentPhase}x${i}`;
            this.gameState.questions[key] = {
                num1: this.gameState.currentPhase,
                num2: i,
                answer: this.gameState.currentPhase * i,
                masteryLevel: 0
            };
        }
    }

    updateProgressBar() {
        document.querySelectorAll('.phase').forEach(phase => {
            const phaseNumber = parseInt(phase.dataset.phase);
            if (phaseNumber <= this.gameState.highestPhase) {
                phase.classList.remove('locked');
                if (phaseNumber === this.gameState.currentPhase) {
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

    updateHistory(isCorrect) {
        if (typeof isCorrect === 'boolean') {
            this.gameState.attemptsHistory.push(isCorrect);
            if (this.gameState.attemptsHistory.length > this.gameState.MAX_HISTORY) {
                this.gameState.attemptsHistory = this.gameState.attemptsHistory.slice(-this.gameState.MAX_HISTORY);
            }
        }
        
        const historyContainer = document.getElementById('attempts-history');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            this.gameState.attemptsHistory.forEach((attempt, index) => {
                const icon = document.createElement('i');
                icon.className = `fas ${attempt ? 'fa-check-circle' : 'fa-times-circle'} attempt-icon ${attempt ? 'correct' : 'wrong'}`;
                if (index === this.gameState.attemptsHistory.length - 1) {
                    icon.classList.add('new');
                }
                historyContainer.appendChild(icon);
            });
        }
    }

    gameOver() {
        const modal = document.getElementById('gameOverModal');
        const playerNameInput = document.getElementById('playerName');
        const saveScoreBtn = document.getElementById('saveScore');
        
        document.getElementById('finalScore').textContent = this.gameState.score;
        playerNameInput.value = '';
        playerNameInput.disabled = false;
        playerNameInput.style.borderColor = '#1e3c72';
        saveScoreBtn.disabled = false;
        saveScoreBtn.textContent = 'Salvar Pontuação';
        saveScoreBtn.style.backgroundColor = '';
        
        this.updateHighScoresDisplay();
        modal.style.display = 'block';
        playerNameInput.focus();
        
        this.gameState.lives = parseInt(localStorage.getItem('maxLives') || '4');
    }

    loadHighScores() {
        return JSON.parse(localStorage.getItem('highScores')) || [];
    }

    saveHighScores(scores) {
        localStorage.setItem('highScores', JSON.stringify(scores));
    }

    addHighScore(name, scoreValue) {
        const newScore = { 
            name, 
            score: scoreValue, 
            date: new Date().toISOString() 
        };
        
        let highScores = this.loadHighScores();
        highScores.push(newScore);
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, this.gameState.MAX_HIGH_SCORES);
        
        this.saveHighScores(highScores);
        this.updateHighScoresDisplay(newScore);
        
        return highScores.findIndex(s => s.name === name && s.score === scoreValue) + 1;
    }

    updateHighScoresDisplay(newScore = null) {
        const highScoresList = document.getElementById('highScoresList');
        const scores = this.loadHighScores();
        
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
        }
    }

    showWrongAnswerModal() {
        console.log('Iniciando showWrongAnswerModal');
        const modal = document.getElementById('wrongAnswerModal');
        const question = `${this.gameState.currentQuestion.num1} × ${this.gameState.currentQuestion.num2}`;
        const answer = this.gameState.currentQuestion.answer;
        
        console.log('Questão:', question);
        console.log('Resposta:', answer);
        
        modal.querySelector('.question-display').textContent = question;
        modal.querySelector('.correct-answer').textContent = answer;
        modal.style.display = 'block';
        
        document.getElementById('continueAfterWrong').focus();
        console.log('Modal exibido');

        // Verificar se o jogo está realmente pausado
        if (!this.gameState.getIsPaused()) {
            console.log('Estado inconsistente detectado: jogo não está pausado ao mostrar modal de erro');
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
        } else {
            console.log('Estado consistente: jogo está pausado ao mostrar modal de erro');
        }
    }

    continueAfterWrong() {
        document.getElementById('wrongAnswerModal').style.display = 'none';
        this.gameState.setIsPaused(false);
        document.getElementById('game').classList.remove('game-paused');
        
        this.saveProgress();
        this.updateDisplay();
        this.generateQuestion();
    }

    saveProgress() {
        localStorage.setItem('questions', JSON.stringify(this.gameState.questions));
    }

    loadProgress() {
        const savedQuestions = localStorage.getItem('questions');
        if (savedQuestions) {
            const loadedQuestions = JSON.parse(savedQuestions);
            const firstQuestion = Object.keys(loadedQuestions)[0];
            const savedPhaseNumber = parseInt(firstQuestion.split('x')[0]);
            
            if (savedPhaseNumber === this.gameState.currentPhase) {
                this.gameState.questions = loadedQuestions;
            } else {
                this.initializePhaseQuestions();
            }
        }
    }

    resetProgress() {
        const highScores = this.loadHighScores();
        localStorage.clear();
        this.saveHighScores(highScores);
        
        this.gameState.reset();
        this.initializePhaseQuestions();
        this.updateProgressBar();
        this.updateDisplay();
        this.generateQuestion();
    }

    resetHighScores() {
        if (confirm('Tem certeza que deseja limpar o ranking? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('highScores');
            this.updateHighScoresDisplay();
            alert('Ranking limpo com sucesso!');
        }
    }

    openConfigModal() {
        document.getElementById('configModal').style.display = 'block';
        document.getElementById('difficulty').value = this.gameState.currentDifficulty;
    }

    saveConfig() {
        const newDifficulty = document.getElementById('difficulty').value;
        const newLivesCount = parseInt(document.getElementById('lives-count').value);
        let shouldUpdateDisplay = false;
        
        if (newDifficulty !== this.gameState.currentDifficulty) {
            this.gameState.currentDifficulty = newDifficulty;
            localStorage.setItem('gameDifficulty', this.gameState.currentDifficulty);
            this.startTimer();
        }
        
        if (newLivesCount !== this.gameState.MAX_LIVES) {
            this.gameState.lives = newLivesCount;
            localStorage.setItem('maxLives', newLivesCount.toString());
            shouldUpdateDisplay = true;
        }
        
        if (shouldUpdateDisplay) {
            this.updateDisplay();
        }
        
        document.getElementById('configModal').style.display = 'none';
    }

    updateDisplay() {
        document.getElementById('scoreValue').textContent = this.gameState.score;
        this.updateLives();
    }

    animateScoreElement() {
        const scoreElement = document.getElementById('score');
        scoreElement.classList.remove('score-highlight');
        void scoreElement.offsetWidth;
        scoreElement.classList.add('score-highlight');
    }

    init() {
        this.gameState.loadFromLocalStorage();
        this.initializePhaseQuestions();
        this.updateProgressBar();
        this.updateDisplay();
        this.generateQuestion();
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');
        this.pauseGame(this.gameState.PAUSE_TYPES.INITIAL);
    }

    // Adicionar método adjustZoom
    adjustZoom() {
        const container = document.querySelector('.container');
        const windowHeight = window.innerHeight;
        const contentHeight = container.scrollHeight;
        
        let zoomLevel = ((windowHeight / (contentHeight)));
        zoomLevel = Math.min(Math.max(zoomLevel, 0.5), 1);
        
        document.body.style.zoom = zoomLevel;
    }

    // Adicionar método showHighScoresModal
    showHighScoresModal() {
        const modal = document.getElementById('highScoresModal');
        const highScoresList = document.getElementById('highScoresListModal');
        const scores = this.loadHighScores();
        
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
}

// Criar instância do controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    window.gameController.init();
}); 