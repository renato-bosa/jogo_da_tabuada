class GameState {
    constructor() {
        // Estado do jogo atual
        this.currentGameId = null;
        this.playerName = '';
        this.createdAt = new Date();
        this.lastPlayedAt = new Date();
        this.isPaused = true;
        this.currentPhase = 2;
        this.highestPhase = 2;
        this.currentQuestion = {};
        this.score = 0;
        this.lives = 5;
        this.timer = 30;
        this.timerInterval = null;
        this.attemptsHistory = [];
        
        // Constantes
        this.MAX_HISTORY = 5;
        this.MAX_LIVES = 5;
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

        // Armazenamento de todas as partidas
        this.savedGames = {};

        // Carregar jogos salvos ao inicializar
        this.loadSavedGames();

        // Adicionar controle de subfase
        this.currentSubPhase = 'A'; // 'A' ou 'B'
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

    listAllSavedGames() {
        return Object.values(this.savedGames)
            .sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt));
    }

    loadGame(gameId) {
        const game = this.savedGames[gameId];
        if (!game) return false;
        
        this.currentGameId = gameId;
        this.playerName = game.playerName;
        this.createdAt = new Date(game.createdAt);
        this.lastPlayedAt = new Date(game.lastPlayedAt);
        this.isPaused = true;
        this.currentPhase = game.currentPhase;
        this.currentSubPhase = game.currentSubPhase || 'A';
        this.highestPhase = game.highestPhase;
        this.score = game.score;
        this.lives = game.lives;
        this.currentDifficulty = game.currentDifficulty;
        this.questions = { ...game.questions };
        this.attemptsHistory = [];
        
        return true;
    }

    reset() {
        // Resetar fase atual e mais alta
        this.currentPhase = 2;
        this.highestPhase = 2;
        this.currentSubPhase = 'A';
        
        // Resetar outros valores
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
        
        // Limpar localStorage
        localStorage.removeItem('currentPhase');
        localStorage.removeItem('highestPhase');
        localStorage.removeItem('score');
        localStorage.removeItem('lives');
        localStorage.removeItem('questions');
    }

    saveCurrentGame() {
        if (!this.currentGameId) {
            this.currentGameId = crypto.randomUUID();
        }
        
        this.savedGames[this.currentGameId] = {
            id: this.currentGameId,
            playerName: this.playerName,
            createdAt: this.createdAt,
            lastPlayedAt: new Date(),
            isPaused: true,
            currentPhase: this.currentPhase,
            currentSubPhase: this.currentSubPhase,
            highestPhase: this.highestPhase,
            score: this.score,
            lives: this.lives,
            currentDifficulty: this.currentDifficulty,
            questions: { ...this.questions }
        };
        
        localStorage.setItem('savedGames', JSON.stringify(this.savedGames));
        return this.currentGameId;
    }

    deleteGame(gameId) {
        if (this.savedGames[gameId]) {
            delete this.savedGames[gameId];
            localStorage.setItem('savedGames', JSON.stringify(this.savedGames));
            return true;
        }
        return false;
    }

    loadSavedGames() {
        const savedGames = localStorage.getItem('savedGames');
        if (savedGames) {
            this.savedGames = JSON.parse(savedGames);
        }
    }

    createNewGame(playerName) {
        this.reset();
        this.currentGameId = crypto.randomUUID();
        this.playerName = playerName;
        this.createdAt = new Date();
        this.lastPlayedAt = new Date();
        this.currentSubPhase = 'A';
    }

    initializePhaseQuestions() {
        console.log('Inicializando questões para fase:', this.currentPhase, this.currentSubPhase);
        this.questions = {};
        this.phaseStats = {
            errors: 0,
            corrects: 0,
            totalTime: 0,
            startTime: Date.now()
        };
        
        // Definir range baseado na subfase
        const startNum = this.currentSubPhase === 'A' ? 1 : 6;
        const endNum = this.currentSubPhase === 'A' ? 5 : 10;
        
        for (let i = startNum; i <= endNum; i++) {
            const key = `${this.currentPhase}x${i}`;
            this.questions[key] = {
                num1: this.currentPhase,
                num2: i,
                answer: this.currentPhase * i,
                masteryLevel: 0
            };
        }
    }

    // Adicionar método para verificar progresso da fase
    getPhaseProgress(phase) {
        console.log('=== Verificando Progresso da Fase ===', {
            faseVerificada: phase,
            faseAtual: this.currentPhase,
            subfaseAtual: this.currentSubPhase
        });

        // Se for a fase atual
        if (phase === this.currentPhase) {
            const isComplete = this.isSubPhaseComplete();
            console.log('Verificando fase atual:', {
                subfaseCompleta: isComplete,
                subfaseAtual: this.currentSubPhase
            });

            if (this.currentSubPhase === 'A') {
                return isComplete ? 'half' : 'started';
            } else { // subfase B
                return isComplete ? 'complete' : 'half';
            }
        }

        // Para fases anteriores à atual
        if (phase < this.currentPhase) {
            console.log('Fase anterior à atual - marcando como completa');
            return 'complete';
        }

        // Para fases posteriores à atual
        if (phase > this.currentPhase) {
            console.log('Fase posterior à atual - marcando como none');
            return 'none';
        }

        // Caso padrão (não deveria chegar aqui)
        console.log('Caso não previsto - retornando started');
        return 'started';
    }

    isSubPhaseComplete(questions = null) {
        const questionsToCheck = questions || this.questions;
        const complete = Object.values(questionsToCheck).every(q => q.masteryLevel === 2);
        
        console.log('Verificando conclusão da subfase:', {
            questoes: questionsToCheck,
            completa: complete
        });
        
        return complete;
    }
}

class GameController {
    constructor() {
        this.gameState = new GameState();
        this.backgroundImages = {
            2: 'img/fase-2-landscape.webp',
            3: 'img/fase-3-landscape.webp',
            4: 'img/fase-4-landscape.webp',
            5: 'img/fase-5-landscape.webp',
            6: 'img/fase-6-landscape.webp',
            7: 'img/fase-7-landscape.webp',
            8: 'img/fase-8-landscape.webp',
            9: 'img/fase-9-landscape.webp'
        };
        this.initializeEventListeners();
    }

    // Adicionar novo método para atualizar o background
    updateBackground() {
        if (!this.gameState.playerName) {
            document.body.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
            return;
        }

        const currentPhase = this.gameState.getCurrentPhase();
        const backgroundImage = this.backgroundImages[currentPhase];
        
        if (backgroundImage) {
            document.body.style.background = `url('${backgroundImage}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
        }
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
            if (this.gameState.playerName) {
                this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
            }
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
        document.getElementById('newGameBtn').addEventListener('click', () => {
            document.getElementById('savedGamesModal').style.display = 'none';
            this.openConfigModal();
        });

        // Salvar configurações quando mudar dificuldade
        document.getElementById('difficulty').addEventListener('change', (e) => {
            localStorage.setItem('gameDifficulty', e.target.value);
        });

        // Clique fora dos modais
        window.addEventListener('click', (e) => {
            const configModal = document.getElementById('configModal');
            const highScoresModal = document.getElementById('highScoresModal');
            const savedGamesModal = document.getElementById('savedGamesModal');
            
            if (e.target === configModal && this.gameState.playerName) {
                configModal.style.display = 'none';
                this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
            }
            if (e.target === highScoresModal) {
                highScoresModal.style.display = 'none';
            }
            if (e.target === savedGamesModal && this.gameState.playerName) {
                savedGamesModal.style.display = 'none';
                this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
            }
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

        // Botão de mostrar jogos salvos
        document.getElementById('showSavedGames').addEventListener('click', () => {
            this.showSavedGamesModal();
        });

        // Botão de fechar modal de jogos salvos
        document.getElementById('closeSavedGames').addEventListener('click', () => {
            document.getElementById('savedGamesModal').style.display = 'none';
            if (this.gameState.playerName) {
                this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
            }
        });
    }

    initializeConfigListeners() {
        // Configurações
        document.getElementById('configBtn').addEventListener('click', () => {
            this.openConfigModal();
        });

        document.getElementById('saveConfig').addEventListener('click', () => {
            this.saveConfig();
        });

        // Adicionar listener para o botão de opções avançadas
        document.getElementById('toggleAdvanced').addEventListener('click', (e) => {
            const advancedOptions = document.getElementById('advancedOptions');
            const button = e.currentTarget;
            
            advancedOptions.classList.toggle('show');
            button.classList.toggle('active');
        });

        // Adicionar listener para o botão de voltar ao menu
        document.getElementById('backToMenu').addEventListener('click', () => {
            document.getElementById('configModal').style.display = 'none';
            if (this.gameState.playerName) {
                this.showSavedGamesModal();
            } else {
                this.showSavedGamesModal();
            }
        });
    }

    checkAnswer() {
        console.log('=== Verificando Resposta ===');
        console.log('Estado atual:', {
            fase: this.gameState.currentPhase,
            subfase: this.gameState.currentSubPhase,
            questões: this.gameState.questions
        });

        if (this.gameState.getIsPaused()) {
            console.log('Jogo pausado, ignorando resposta');
            return;
        }
        
        const userAnswer = parseInt(document.getElementById('answer').value);
        const correctAnswer = this.gameState.currentQuestion.answer;
        console.log('Resposta:', { usuário: userAnswer, correta: correctAnswer });
        
        if (isNaN(userAnswer)) return;
        
        if (userAnswer === correctAnswer) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
            return;
        }
        
        this.saveProgress();
        this.updateDisplay();
        this.generateQuestion();
    }

    handleCorrectAnswer() {
        console.log('=== Resposta Correta ===');
        this.playSound('correctSound');
        this.gameState.score += 10;
        this.gameState.phaseStats.corrects++;
        
        const key = `${this.gameState.currentQuestion.num1}x${this.gameState.currentQuestion.num2}`;
        if (this.gameState.questions[key].masteryLevel < 2) {
            this.gameState.questions[key].masteryLevel++;
        }
        
        console.log('Novo estado das questões:', this.gameState.questions);
        
        this.updateHistory(true);
        this.animateScoreElement();
        
        if (this.gameState.isSubPhaseComplete()) {
            console.log('Subfase completada!');
            this.showNextPhaseModal();
        }
        
        this.gameState.saveCurrentGame();
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
        
        // Salvar após resposta errada
        this.gameState.saveCurrentGame();
        
        console.log('handleWrongAnswer finalizado');
    }

    generateQuestion() {
        console.log('=== Gerando Nova Questão ===');
        console.log('Estado atual:', {
            fase: this.gameState.currentPhase,
            subfase: this.gameState.currentSubPhase,
            questões: this.gameState.questions
        });

        const questionKey = this.selectNextQuestion();
        
        if (questionKey === null && this.gameState.isSubPhaseComplete()) {
            console.log('Todas as questões desta subfase foram completadas');
            this.showNextPhaseModal();
            return;
        }

        if (questionKey) {
            this.gameState.currentQuestion = this.gameState.questions[questionKey];
            console.log('Questão selecionada:', this.gameState.currentQuestion);
            
            document.getElementById('question').textContent = 
                `${this.gameState.currentQuestion.num1} × ${this.gameState.currentQuestion.num2} = ?`;
            document.getElementById('answer').value = '';
            
            if (!this.gameState.getIsPaused()) {
                document.getElementById('answer').focus();
                this.startTimer();
            }
        }
    }

    selectNextQuestion() {
        console.log('=== Selecionando Próxima Questão ===');
        const questionsByMastery = {
            0: [],
            1: []
        };

        Object.entries(this.gameState.questions).forEach(([key, question]) => {
            const level = question.masteryLevel;
            if (level < 2) {
                questionsByMastery[level].push(key);
            }
        });

        console.log('Questões por nível de domínio:', questionsByMastery);

        const availableQuestions = [...questionsByMastery[0], ...questionsByMastery[1]];
        
        if (availableQuestions.length === 0) {
            console.log('Não há mais questões disponíveis');
            return null;
        }

        for (let level = 0; level <= 1; level++) {
            if (questionsByMastery[level].length > 0) {
                const randomIndex = Math.floor(Math.random() * questionsByMastery[level].length);
                const selectedKey = questionsByMastery[level][randomIndex];
                console.log('Questão selecionada:', selectedKey);
                return selectedKey;
            }
        }

        return null;
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
                /* modalTitle.innerHTML = '<i class="fas fa-play"></i> Bem-vindo ao Jogo da Tabuada!';*/
                modalTitle.innerHTML = '<i class="fas fa-play"></i> Pronto para começar?';
                resumeButton.innerHTML = '<i class="fas fa-play"></i> Iniciar Jogo';
                /*
                modalTitle.insertAdjacentHTML(
                    'afterend',
                    '<p class="pause-message">Pratique suas habilidades de multiplicação.<br />Pronto para começar?</p>'
                );
                */
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
                
                // Salvar após perder vida
                this.gameState.saveCurrentGame();
                
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
            
            // Salvar após ganhar vida
            this.gameState.saveCurrentGame();
        }
    }

    showNextPhaseModal() {
        console.log('=== Mostrando Modal de Próxima Fase ===');
        console.log('Estado atual antes da mudança:', {
            fase: this.gameState.currentPhase,
            subfase: this.gameState.currentSubPhase,
            questõesCompletadas: this.gameState.isSubPhaseComplete()
        });

        this.gameState.setIsPaused(true);
        clearInterval(this.gameState.timerInterval);
        
        // Primeiro determinar a mensagem correta
        const currentPhaseText = `${this.gameState.currentPhase}${this.gameState.currentSubPhase}`;
        let nextPhaseText;
        
        if (this.gameState.currentSubPhase === 'A') {
            // Se estamos na subfase A, próxima é B da mesma fase
            nextPhaseText = `${this.gameState.currentPhase}B`;
        } else {
            // Se estamos na subfase B, próxima é A da próxima fase
            nextPhaseText = `${this.gameState.currentPhase + 1}A`;
        }

        // Atualizar o modal com as mensagens corretas
        const modal = document.getElementById('nextPhaseModal');
        document.getElementById('currentPhase').textContent = currentPhaseText;
        document.getElementById('nextPhase').textContent = nextPhaseText;

        // Depois atualizar o estado do jogo
        if (this.gameState.currentSubPhase === 'A') {
            console.log('Avançando para subfase B');
            this.gameState.currentSubPhase = 'B';
            this.gameState.initializePhaseQuestions();
        } else {
            console.log('Completou fase inteira, avançando para próxima fase');
            this.gameState.currentPhase++;
            this.gameState.currentSubPhase = 'A'; // Importante: começar pela subfase A
            if (this.gameState.currentPhase > this.gameState.highestPhase) {
                this.gameState.highestPhase = this.gameState.currentPhase;
            }
            this.gameState.initializePhaseQuestions();
        }

        console.log('Novo estado após mudança:', {
            fase: this.gameState.currentPhase,
            subfase: this.gameState.currentSubPhase,
            proximaFase: nextPhaseText
        });

        this.updateProgressBar();
        modal.style.display = 'block';
        
        this.gameState.saveCurrentGame();
    }

    initializeGameOverListeners() {
        document.getElementById('restartGame').addEventListener('click', () => {
            document.getElementById('gameOverModal').style.display = 'none';
            this.openConfigModal(); // Abrir modal de nova partida
        });
    }

    initializePhaseListeners() {
        document.getElementById('startNextPhase').addEventListener('click', () => {
            document.getElementById('nextPhaseModal').style.display = 'none';
            
            // Não incrementar a fase aqui, pois já foi feito no showNextPhaseModal
            localStorage.setItem('currentPhase', this.gameState.currentPhase);
            localStorage.setItem('highestPhase', this.gameState.highestPhase);
            
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
            this.updateBackground();
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
            this.gameState.initializePhaseQuestions();
            this.updateProgressBar();
            this.generateQuestion();
            this.updateBackground();
        }
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
        document.querySelector('.player-name-display').textContent = this.gameState.playerName;
        document.getElementById('finalScore').textContent = this.gameState.score;
        
        // Adicionar a pontuação ao ranking automaticamente
        this.addHighScore(this.gameState.playerName, this.gameState.score);
        this.updateHighScoresDisplay();
        
        modal.style.display = 'block';
    }

    loadHighScores() {
        // Obter todas as partidas salvas e ordená-las por pontuação
        const savedGames = this.gameState.listAllSavedGames();
        const uniqueScores = new Map();

        // Para cada jogador, manter apenas a maior pontuação
        savedGames.forEach(game => {
            const existingScore = uniqueScores.get(game.playerName);
            if (!existingScore || game.score > existingScore.score) {
                uniqueScores.set(game.playerName, {
                    name: game.playerName,
                    score: game.score,
                    date: game.lastPlayedAt
                });
            }
        });

        // Converter o Map para array e ordenar por pontuação
        return Array.from(uniqueScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, this.gameState.MAX_HIGH_SCORES);
    }

    saveHighScores(scores) {
        // Este método não é mais necessário pois os scores são derivados das partidas salvas
        // Mantido para compatibilidade, mas não faz nada
        return;
    }

    addHighScore(name, scoreValue) {
        // Não precisamos mais salvar explicitamente no ranking
        // Apenas retornamos a posição atual no ranking
        const highScores = this.loadHighScores();
        return highScores.findIndex(s => s.name === name && s.score === scoreValue) + 1;
    }

    updateHighScoresDisplay(newScore = null) {
        const highScoresList = document.getElementById('highScoresList');
        const scores = this.loadHighScores();
        
        if (highScoresList) {
            highScoresList.innerHTML = scores
                .map((score, index) => {
                    // Verifica se este score é do jogo atual
                    const isCurrentGame = this.gameState.currentGameId && 
                        score.name === this.gameState.playerName && 
                        score.score === this.gameState.score;
                    
                    return `
                        <div class="score-item ${isCurrentGame ? 'pulse-animation' : ''} ${newScore && score.score === newScore.score && score.name === newScore.name ? 'highlight' : ''}">
                            <span class="score-rank">#${index + 1}</span>
                            <span class="score-name">${score.name}</span>
                            <span class="score-value">${score.score}</span>
                        </div>
                    `;
                })
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
        if (confirm('Tem certeza que deseja limpar o ranking? Esta ação irá apagar todas as partidas salvas.')) {
            // Limpar todas as partidas salvas
            Object.keys(this.gameState.savedGames).forEach(gameId => {
                this.gameState.deleteGame(gameId);
            });
            this.updateHighScoresDisplay();
            alert('Ranking e partidas salvas foram limpos com sucesso!');
        }
    }

    openConfigModal() {
        // Pausar o jogo atual se houver um jogador
        if (this.gameState.playerName) {
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
        }

        const modal = document.getElementById('configModal');
        const closeButton = document.getElementById('closeModal');
        const backButton = document.getElementById('backToMenu');
        
        document.getElementById('newGamePlayerName').value = '';
        document.getElementById('difficulty').value = 'easy';
        document.getElementById('lives-count').value = '4';
        
        // Mostrar/ocultar botões baseado no estado do jogo
        if (!this.gameState.playerName) {
            closeButton.style.display = 'none';
            backButton.style.display = 'block';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        } else {
            closeButton.style.display = 'block';
            backButton.style.display = 'none';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
        
        // Resetar estado das opções avançadas
        const advancedOptions = document.getElementById('advancedOptions');
        const toggleButton = document.getElementById('toggleAdvanced');
        advancedOptions.classList.remove('show');
        toggleButton.classList.remove('active');
        
        modal.style.display = 'block';
        document.getElementById('newGamePlayerName').focus();
    }

    saveConfig() {
        const playerName = document.getElementById('newGamePlayerName').value.trim();
        if (!playerName) {
            const input = document.getElementById('newGamePlayerName');
            input.style.borderColor = '#ff4757';
            input.placeholder = 'Digite seu nome primeiro!';
            setTimeout(() => {
                input.style.borderColor = '#3498db';
                input.placeholder = 'Digite seu nome';
            }, 2000);
            return;
        }

        const newDifficulty = document.getElementById('difficulty').value;
        const livesSelect = document.getElementById('lives-count');
        const newLivesCount = livesSelect.parentElement.style.display === 'none' ? 5 : parseInt(livesSelect.value);
        
        this.gameState.createNewGame(playerName);
        this.gameState.currentDifficulty = newDifficulty;
        this.gameState.MAX_LIVES = newLivesCount;
        this.gameState.lives = newLivesCount;
        
        this.gameState.initializePhaseQuestions();
        this.updateProgressBar();
        this.updateDisplay();
        this.generateQuestion();
        this.updateBackground();
        
        document.getElementById('configModal').style.display = 'none';
        this.pauseGame(this.gameState.PAUSE_TYPES.INITIAL);
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
        this.gameState.initializePhaseQuestions();
        this.updateProgressBar();
        this.updateDisplay();
        this.generateQuestion();
        this.updateBackground();
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');
        
        this.showSavedGamesModal();
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

    showSavedGamesModal() {
        // Pausar o jogo atual se houver um jogador
        if (this.gameState.playerName) {
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
        }

        const modal = document.getElementById('savedGamesModal');
        const listContainer = document.getElementById('savedGamesList');
        const closeButton = document.getElementById('closeSavedGames');
        const modalTitle = modal.querySelector('h2');
        const savedGames = this.gameState.listAllSavedGames();
        
        // Mostrar/ocultar botão de fechar e ajustar título baseado no estado do jogo
        if (!this.gameState.playerName) {
            closeButton.style.display = 'none';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            modalTitle.innerHTML = '<i class="fas fa-play"></i> Bem-vindo ao Jogo da Tabuada!';
            
            // Adicionar mensagem de boas-vindas se não existir
            if (!modal.querySelector('.pause-message')) {
                modalTitle.insertAdjacentHTML(
                    'afterend',
                    '<p class="pause-message">Pratique suas habilidades de multiplicação!</p>'
                );
            }
        } else {
            closeButton.style.display = 'block';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modalTitle.innerHTML = '<i class="fas fa-bars"></i> Menu do Jogo';
            
            // Remover mensagem de boas-vindas se existir
            const welcomeMessage = modal.querySelector('.pause-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
        }
        
        if (savedGames.length === 0) {
            listContainer.innerHTML = '<div class="no-saved-games">Nenhuma partida salva</div>';
        } else {
            listContainer.innerHTML = savedGames.map(game => `
                <div class="saved-game-item" data-game-id="${game.id}">
                    <div class="game-info-container">
                        <div class="game-title">${game.playerName || 'Jogador sem nome'}</div>
                        <div class="game-details">
                            Fase: ${game.currentPhase} | Pontos: ${game.score} | 
                            Última jogada: ${new Date(game.lastPlayedAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="game-actions">
                        ${game.lives > 0 ? `
                            <button class="game-action-btn load-game-btn no-margin-bottom" onclick="gameController.loadSavedGame('${game.id}')">
                                <i class="fas fa-play"></i> Jogar
                            </button>
                        ` : `
                            <span class="game-over-badge no-margin-bottom">
                                <i class="fas fa-skull"></i> <small>Game Over</small>
                            </span>
                        `}
                        <button class="game-action-btn delete-game-btn no-margin-bottom" onclick="gameController.deleteSavedGame('${game.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.style.display = 'block';
    }

    loadSavedGame(gameId) {
        if (this.gameState.loadGame(gameId)) {
            this.updateDisplay();
            this.updateProgressBar();
            this.generateQuestion();
            this.updateBackground();
            document.getElementById('savedGamesModal').style.display = 'none';
            this.pauseGame(this.gameState.PAUSE_TYPES.TIMER_CLICK);
        } else {
            alert('Erro ao carregar o jogo!');
        }
    }

    deleteSavedGame(gameId) {
        if (confirm('Tem certeza que deseja excluir esta partida?')) {
            if (this.gameState.deleteGame(gameId)) {
                this.showSavedGamesModal(); // Atualiza a lista
            } else {
                alert('Erro ao excluir a partida!');
            }
        }
    }

    updateProgressBar() {
        console.log('=== Atualizando Barra de Progresso ===');
        
        document.querySelectorAll('.phase').forEach(phase => {
            const phaseNumber = parseInt(phase.dataset.phase);
            const progress = this.gameState.getPhaseProgress(phaseNumber);

            console.log('Atualizando fase:', {
                numero: phaseNumber,
                progresso: progress
            });

            if (phaseNumber <= this.gameState.highestPhase) {
                // Remover todas as classes primeiro
                phase.classList.remove('locked', 'half-complete', 'complete');
                
                // Aplicar a classe apropriada baseada no progresso
                switch (progress) {
                    case 'half':
                        phase.classList.add('half-complete');
                        break;
                    case 'complete':
                        phase.classList.add('complete');
                        break;
                    case 'started':
                        // Mantém apenas a cor base (azul)
                        break;
                }

                // Atualizar o conteúdo
                if (phaseNumber === this.gameState.currentPhase) {
                    phase.innerHTML = `<i class="fas fa-calculator"></i><span>${phaseNumber}${this.gameState.currentSubPhase}</span>`;
                } else if (progress === 'complete') {
                    phase.innerHTML = `<i class="fas fa-check"></i><span>${phaseNumber}</span>`;
                } else {
                    phase.innerHTML = `<i class="fas fa-calculator"></i><span>${phaseNumber}</span>`;
                }
            } else {
                phase.classList.add('locked');
                phase.innerHTML = `<i class="fas fa-lock"></i><span>${phaseNumber}</span>`;
            }
        });
    }
}

// Criar instância do controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    window.gameController.init();
}); 