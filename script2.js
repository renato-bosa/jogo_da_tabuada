class GameState {
    constructor() {
        // Estado do jogo atual
        this.currentGameState = {
            currentGameId: null,
            playerName: '',
            createdAt: new Date(),
            lastPlayedAt: new Date(),
            isPaused: true,
            currentPhase: 2,
            highestPhase: 2,
            currentQuestion: {},
            score: 0,
            lives: 5,
            timer: 30,
            timerInterval: null,
            attemptsHistory: [],
            currentSubPhase: 'A', // 'A' ou 'B'
            currentQuestions: {}, // Mover questions para aqui
            phaseStats: this.initializePhaseStats() // Inicializar estatísticas das fases
        };

        // Configurações globais
        this.globalConfigs = {
            MAX_HISTORY: 5,
            MAX_LIVES: 5,
            MAX_HIGH_SCORES: 5,
            currentDifficulty: 'easy',
            difficultySettings: {
                easy: { baseTime: 30, levelTimeDecrease: 5 },
                medium: { baseTime: 15, levelTimeDecrease: 3 },
                hard: { baseTime: 10, levelTimeDecrease: 2 }
            },
            PAUSE_TYPES: {
                INITIAL: 'initial',
                TIMER_CLICK: 'timer_click',
                NEXT_PHASE: 'next_phase',
                WRONG_ANSWER: 'wrong_answer'
            }
        };

        // Armazenamento de todas as partidas
        this.savedGames = {};

        // Carregar jogos salvos ao inicializar
        this.loadSavedGames();
    }

    // Método para inicializar as estatísticas das fases
    initializePhaseStats() {
        const phaseStats = {};
        for (let phase = 1; phase <= 10; phase++) {
            for (let subPhase = 'A'; subPhase <= 'B'; subPhase = String.fromCharCode(subPhase.charCodeAt(0) + 1)) {
                phaseStats[`${phase}${subPhase}`] = {
                    completed: false,
                    errors: 0,
                    corrects: 0,
                    totalTime: 0,
                    bestTime: null,
                    completionDate: null,
                    attempts: 0,
                    accuracy: 0,
                    startTime: Date.now()
                };
            }
        }
        return phaseStats;
    }

    // Método para obter todos os atributos da classe como JSON
    dumpState() {
        const state = {};
        
        // Obter todos os atributos da instância
        for (const [key, value] of Object.entries(this)) {
            // Se o valor for um objeto, converta-o em JSON
            if (typeof value === 'object' && value !== null) {
                state[key] = JSON.parse(JSON.stringify(value)); // Para evitar referências circulares
            } else {
                state[key] = value;
            }
        }

        return JSON.stringify(state, null, 2); // Formatação com 2 espaços
    }

    // Métodos para gerenciar o estado

    getPhaseStats() { return this.currentGameState.phaseStats; }
    setPhaseStats(phase, subphase, object) { this.currentGameState.phaseStats[`${phase}${subphase}`] = object; }

    getIsPaused() { return this.currentGameState.isPaused; }
    setIsPaused(value) { this.currentGameState.isPaused = value; }
    
    getCurrentPhase() { return this.currentGameState.currentPhase; }
    setCurrentPhase(value) { this.currentGameState.currentPhase = value; }
    
    getScore() { return this.currentGameState.score; }
    setScore(value) { this.currentGameState.score = value; }
    
    getLives() { return this.currentGameState.lives; }
    setLives(value) { this.currentGameState.lives = value; }

    // Métodos para salvar/carregar estado
    saveToLocalStorage() {
        localStorage.setItem('currentPhase', this.currentGameState.currentPhase);
        localStorage.setItem('highestPhase', this.currentGameState.highestPhase);
        localStorage.setItem('score', this.currentGameState.score);
        localStorage.setItem('lives', this.currentGameState.lives);
        localStorage.setItem('difficulty', this.globalConfigs.currentDifficulty);
        localStorage.setItem('questions', JSON.stringify(this.currentGameState.currentQuestions));
    }

    loadFromLocalStorage() {
        const savedPhase = localStorage.getItem('currentPhase');
        if (savedPhase) this.currentGameState.currentPhase = parseInt(savedPhase);

        const savedHighestPhase = localStorage.getItem('highestPhase');
        if (savedHighestPhase) this.currentGameState.highestPhase = parseInt(savedHighestPhase);

        const savedScore = localStorage.getItem('score');
        if (savedScore) this.currentGameState.score = parseInt(savedScore);

        const savedLives = localStorage.getItem('lives');
        if (savedLives) this.currentGameState.lives = parseInt(savedLives);

        const savedDifficulty = localStorage.getItem('difficulty');
        if (savedDifficulty) this.globalConfigs.currentDifficulty = savedDifficulty;

        const savedQuestions = localStorage.getItem('questions');
        if (savedQuestions) this.currentGameState.currentQuestions = JSON.parse(savedQuestions);
    }

    listAllSavedGames() {
        return Object.values(this.savedGames)
            .sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt));
    }

    loadGame(gameId) {
        const game = this.savedGames[gameId];
        if (!game) return false;
        
        this.currentGameState.currentGameId = gameId;
        this.currentGameState.playerName = game.playerName;
        this.currentGameState.createdAt = new Date(game.createdAt);
        this.currentGameState.lastPlayedAt = new Date(game.lastPlayedAt);
        this.currentGameState.isPaused = true;
        this.currentGameState.currentPhase = game.currentPhase;
        this.currentGameState.currentSubPhase = game.currentSubPhase || 'A';
        this.currentGameState.highestPhase = game.highestPhase;
        this.currentGameState.score = game.score;
        this.currentGameState.lives = game.lives;
        this.globalConfigs.currentDifficulty = game.currentDifficulty;
        this.currentGameState.currentQuestions = { ...game.questions };
        this.currentGameState.attemptsHistory = [];
        this.currentGameState.phaseStats = game.phaseStats ? { ...game.phaseStats } : this.initializePhaseStats(); // Carregar phaseStats
        
        return true;
    }

    reset() {
        // Resetar fase atual e mais alta
        this.currentGameState.currentPhase = 2;
        this.currentGameState.highestPhase = 2;
        this.currentGameState.currentSubPhase = 'A';
        
        // Resetar outros valores
        this.currentGameState.score = 0;
        this.currentGameState.lives = this.globalConfigs.MAX_LIVES;
        this.currentGameState.attemptsHistory = [];
        this.currentGameState.currentQuestions = {};
        this.currentGameState.phaseStats = this.initializePhaseStats(); // Resetar estatísticas das fases

        // Limpar localStorage
        localStorage.removeItem('currentPhase');
        localStorage.removeItem('highestPhase');
        localStorage.removeItem('score');
        localStorage.removeItem('lives');
        localStorage.removeItem('questions');

        // Resetar as cores das fases no mapa de progresso
        this.resetPhaseColors();
    }

    // Método para resetar as cores das fases no mapa de progresso
    resetPhaseColors() {
        const phases = document.querySelectorAll('.phase');
        phases.forEach(phase => {
            phase.classList.remove('half-complete', 'complete', 'locked');
            phase.innerHTML = `<i class="fas fa-lock"></i><span>${phase.dataset.phase}</span>`; // Resetar para o estado bloqueado
        });
    }

    saveCurrentGame() {
        if (!this.currentGameState.currentGameId) {
            this.currentGameState.currentGameId = crypto.randomUUID();
        }
        
        this.savedGames[this.currentGameState.currentGameId] = {
            id: this.currentGameState.currentGameId,
            playerName: this.currentGameState.playerName,
            createdAt: this.currentGameState.createdAt,
            lastPlayedAt: new Date(),
            isPaused: true,
            currentPhase: this.currentGameState.currentPhase,
            currentSubPhase: this.currentGameState.currentSubPhase,
            highestPhase: this.currentGameState.highestPhase,
            score: this.currentGameState.score,
            lives: this.currentGameState.lives,
            currentDifficulty: this.globalConfigs.currentDifficulty,
            questions: { ...this.currentGameState.currentQuestions },
            phaseStats: { ...this.currentGameState.phaseStats } // Adicionar phaseStats
        };
        
        localStorage.setItem('savedGames', JSON.stringify(this.savedGames));
        return this.currentGameState.currentGameId;
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
        this.currentGameState.currentGameId = crypto.randomUUID();
        this.currentGameState.playerName = playerName;
        this.currentGameState.createdAt = new Date();
        this.currentGameState.lastPlayedAt = new Date();
        this.currentGameState.currentSubPhase = 'A';
    }

    initializePhaseQuestions() {
        console.log('Inicializando questões para fase:', this.currentGameState.currentPhase, this.currentGameState.currentSubPhase);
        this.currentGameState.currentQuestions = {};
        
        // Inicializar estatísticas da subfase atual
        const currentPhaseKey = `${this.currentGameState.currentPhase}${this.currentGameState.currentSubPhase}`;
        this.currentGameState.phaseStats[currentPhaseKey].startTime = Date.now();
        
        if (this.currentGameState.currentPhase === 10) {
            // Fase especial - sortear questões aleatórias
            const minTable = this.currentGameState.currentSubPhase === 'A' ? 2 : 6;
            const maxTable = this.currentGameState.currentSubPhase === 'A' ? 5 : 9;
            const questionsNeeded = 5;
            
            while (Object.keys(this.currentGameState.currentQuestions).length < questionsNeeded) {
                const table = Math.floor(Math.random() * (maxTable - minTable + 1)) + minTable;
                const number = Math.floor(Math.random() * 10) + 1;
                const key = `${table}x${number}`;
                
                // Evitar questões duplicadas
                if (!this.currentGameState.currentQuestions[key]) {
                    this.currentGameState.currentQuestions[key] = {
                        num1: table,
                        num2: number,
                        answer: table * number,
                        masteryLevel: 0
                    };
                }
            }
        } else {
            // Lógica existente para outras fases
            const startNum = this.currentGameState.currentSubPhase === 'A' ? 1 : 6;
            const endNum = this.currentGameState.currentSubPhase === 'A' ? 5 : 10;
            
            for (let i = startNum; i <= endNum; i++) {
                const key = `${this.currentGameState.currentPhase}x${i}`;
                this.currentGameState.currentQuestions[key] = {
                    num1: this.currentGameState.currentPhase,
                    num2: i,
                    answer: this.currentGameState.currentPhase * i,
                    masteryLevel: 0
                };
            }
        }
    }

    // Adicionar método para verificar progresso da fase
    getPhaseProgress(phase) {
        console.log('=== Verificando Progresso da Fase ===', {
            faseVerificada: phase,
            faseAtual: this.currentGameState.currentPhase,
            subfaseAtual: this.currentGameState.currentSubPhase
        });

        // Se for a fase atual
        if (phase === this.currentGameState.currentPhase) {
            const isComplete = this.isSubPhaseComplete();
            console.log('Verificando fase atual:', {
                subfaseCompleta: isComplete,
                subfaseAtual: this.currentGameState.currentSubPhase
            });

            if (this.currentGameState.currentSubPhase === 'A') {
                return isComplete ? 'half' : 'started';
            } else { // subfase B
                return isComplete ? 'complete' : 'half';
            }
        }

        // Para fases anteriores à atual
        if (phase < this.currentGameState.currentPhase) {
            console.log('Fase anterior à atual - marcando como completa');
            return 'complete';
        }

        // Para fases posteriores à atual
        if (phase > this.currentGameState.currentPhase) {
            console.log('Fase posterior à atual - marcando como none');
            return 'none';
        }

        // Caso padrão (não deveria chegar aqui)
        console.log('Caso não previsto - retornando started');
        return 'started';
    }

    isSubPhaseComplete(questions = null) {
        const questionsToCheck = questions || this.currentGameState.currentQuestions;
        const complete = Object.values(questionsToCheck).every(q => q.masteryLevel === 2);
        
        console.log('Verificando conclusão da subfase:', {
            questoes: questionsToCheck,
            completa: complete
        });
        
        return complete;
    }

    // Adicionar método para processar estatísticas durante o jogo
    updatePhaseStats(isCorrect) {
        const currentPhaseKey = `${this.currentGameState.currentPhase}${this.currentGameState.currentSubPhase}`;
        
        // Verificar se existe estatística para esta fase/subfase
        if (!this.currentGameState.phaseStats[currentPhaseKey]) {
            this.currentGameState.phaseStats[currentPhaseKey] = {
                completed: false,
                errors: 0,
                corrects: 0,
                totalTime: 0,
                bestTime: null,
                completionDate: null,
                attempts: 0,
                accuracy: 0,
                startTime: Date.now()
            };
        }
        
        const stats = this.currentGameState.phaseStats[currentPhaseKey];
        
        // Garantir que as propriedades existam
        if (!stats.attempts) stats.attempts = 0;
        if (!stats.corrects) stats.corrects = 0;
        if (!stats.errors) stats.errors = 0;
        if (!stats.totalTime) stats.totalTime = 0;
        if (!stats.startTime) stats.startTime = Date.now();
        
        // Atualizar contadores básicos
        stats.attempts++;
        if (isCorrect) {
            stats.corrects++;
        } else {
            stats.errors++;
        }
        
        // Calcular acurácia
        stats.accuracy = (stats.corrects / stats.attempts) * 100;
        
        // Atualizar tempo total e melhor tempo
        const currentTime = Date.now();
        const timeSpent = currentTime - stats.startTime;
        stats.totalTime += timeSpent;
        
        // Atualizar melhor tempo se for uma resposta correta
        if (isCorrect && (!stats.bestTime || timeSpent < stats.bestTime)) {
            stats.bestTime = timeSpent;
        }
        
        // Resetar tempo inicial para próxima questão
        stats.startTime = Date.now();
    }

    // Atualizar método para finalizar estatísticas da subfase
    completePhaseStats() {
        const currentPhaseKey = `${this.currentGameState.currentPhase}${this.currentGameState.currentSubPhase}`;
        const stats = this.currentGameState.phaseStats[currentPhaseKey];
        
        // Garantir que todas as propriedades existam
        if (!stats) {
            console.error('Estatísticas não encontradas para:', currentPhaseKey);
            return;
        }
        
        // Atualizar status de conclusão
        stats.completed = true;
        stats.completionDate = new Date().toISOString();
        
        console.log('Estatísticas finalizadas para', currentPhaseKey, ':', stats);
        
        // Salvar estatísticas no localStorage
        this.savePhaseStats();
    }

    // Método para combinar estatísticas das subfases para exibição
    getCombinedPhaseStats(phase) {
        const statsA = this.currentGameState.phaseStats[`${phase}A`];
        const statsB = this.currentGameState.phaseStats[`${phase}B`];
        
        return {
            errors: statsA.errors + statsB.errors,
            corrects: statsA.corrects + statsB.corrects,
            totalTime: statsA.totalTime + statsB.totalTime,
            attempts: statsA.attempts + statsB.attempts,
            accuracy: ((statsA.corrects + statsB.corrects) / (statsA.attempts + statsB.attempts)) * 100 || 0,
            bestTime: Math.min(
                statsA.bestTime || Number.MAX_VALUE,
                statsB.bestTime || Number.MAX_VALUE
            ) === Number.MAX_VALUE ? null : Math.min(
                statsA.bestTime || Number.MAX_VALUE,
                statsB.bestTime || Number.MAX_VALUE
            ),
            completionDate: statsB.completionDate // Data de conclusão da fase inteira
        };
    }

    // Método para incrementar a pontuação
    incrementScore(points) {
        this.currentGameState.score += points;
    }

    // Método para obter a pontuação
    getScore() {
        return this.currentGameState.score;
    }

    // Método para resetar a pontuação
    resetScore() {
        this.currentGameState.score = 0;
    }

    // Método para obter as vidas
    getLives() {
        return this.currentGameState.lives;
    }

    // Método para decrementar vidas
    decrementLives() {
        if (this.currentGameState.lives > 0) {
            this.currentGameState.lives--;
        }
    }

    // Método para resetar vidas
    resetLives() {
        this.currentGameState.lives = this.globalConfigs.MAX_LIVES;
    }

    // Adicionar método para salvar estatísticas
    savePhaseStats() {
        localStorage.setItem('phaseStats', JSON.stringify(this.currentGameState.phaseStats));
    }

    // Adicionar método para carregar estatísticas
    loadPhaseStats() {
        const savedStats = localStorage.getItem('phaseStats');
        if (savedStats) {
            this.currentGameState.phaseStats = JSON.parse(savedStats);
        }
    }

    // Atualizar o método handleCorrectAnswer para usar as novas funções
    handleCorrectAnswer() {
        console.log('=== Resposta Correta ===');
        this.playSound('correctSound');
        this.gameState.incrementScore(10);
        
        // Atualizar estatísticas da subfase atual
        this.gameState.updatePhaseStats(true);
        
        // Atualizar nível de domínio da questão atual
        const key = `${this.currentGameState.currentQuestion.num1}x${this.currentGameState.currentQuestion.num2}`;
        if (this.currentGameState.currentQuestions[key].masteryLevel < 2) {
            this.currentGameState.currentQuestions[key].masteryLevel++;
        }
        
        console.log('Novo estado das questões:', this.currentGameState.currentQuestions);
        
        this.updateHistory(true);
        this.animateScoreElement();
        
        // Verificar se completou a subfase
        if (this.isSubPhaseComplete()) {
            console.log('Subfase completada!');
            
            // Marcar a subfase atual como completa antes de mostrar o modal
            this.completePhaseStats();
            
            // Mostrar o modal com as estatísticas atualizadas
            this.showNextPhaseModal();
        }
        
        this.saveCurrentGame();
    }

    // Atualizar o método handleWrongAnswer
    handleWrongAnswer() {
        console.log('Iniciando handleWrongAnswer');
        this.playSound('wrongSound');
        
        // Atualizar estatísticas
        this.updatePhaseStats(false);
        
        const key = `${this.currentGameState.currentQuestion.num1}x${this.currentGameState.currentQuestion.num2}`;
        this.currentGameState.currentQuestions[key].masteryLevel = 0;
        
        console.log('Pausando o jogo');
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');
        
        console.log('Mostrando modal de resposta errada');
        this.showWrongAnswerModal();
        // this.gameState.decrementLives();
        this.loseLife();
        this.updateHistory(false);
        
        // Salvar após resposta errada
        this.gameState.saveCurrentGame();
        
        console.log('handleWrongAnswer finalizado');
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
            9: 'img/fase-9-landscape.webp',
            10: 'img/fase-10-landscape.webp'
        };
        this.initializeEventListeners();
    }

    // Adicionar novo método para atualizar o background
    updateBackground() {
        if (!this.gameState.currentGameState.playerName) {
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
            this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
        });

        // Botão de retomar
        document.getElementById('resumeGame').addEventListener('click', () => {
            this.resumeGame();
        });

        // Novos event listeners
        // Botão de fechar modal de configurações
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('configModal').style.display = 'none';
            if (this.gameState.currentGameState.playerName) {
                this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
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
            
            if (e.target === configModal && this.gameState.currentGameState.playerName) {
                configModal.style.display = 'none';
                this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
            }
            if (e.target === highScoresModal) {
                highScoresModal.style.display = 'none';
            }
            if (e.target === savedGamesModal && this.gameState.currentGameState.playerName) {
                savedGamesModal.style.display = 'none';
                this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
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
            if (this.gameState.currentGameState.playerName) {
                this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
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
            if (this.gameState.currentGameState.playerName) {
                this.showSavedGamesModal();
            } else {
                this.showSavedGamesModal();
            }
        });
    }

    checkAnswer() {
        console.log('=== Verificando Resposta ===');
        console.log('Estado atual:', {
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            questões: this.gameState.currentGameState.currentQuestions
        });

        if (this.gameState.getIsPaused()) {
            console.log('Jogo pausado, ignorando resposta');
            return;
        }
        
        const userAnswer = parseInt(document.getElementById('answer').value);
        const correctAnswer = this.gameState.currentGameState.currentQuestion.answer;
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
        this.gameState.incrementScore(10);

        // Atualizar estatísticas da subfase atual
        // (usamos o método updatePhaseStats com o parâmetro true para indicar que a resposta é correta.)
        this.gameState.updatePhaseStats(true);
        
        const key = `${this.gameState.currentGameState.currentQuestion.num1}x${this.gameState.currentGameState.currentQuestion.num2}`;
        if (this.gameState.currentGameState.currentQuestions[key].masteryLevel < 2) {
            this.gameState.currentGameState.currentQuestions[key].masteryLevel++;
        }
        
        console.log('Novo estado das questões:', this.gameState.currentGameState.currentQuestions);
        
        this.updateHistory(true);
        this.animateScoreElement();
        
        // Verificar se completou a subfase
        if (this.gameState.isSubPhaseComplete()) {
            console.log('Subfase completada!');
            
            // Marcar a subfase atual como completa antes de mostrar o modal
            this.gameState.completePhaseStats();
            
            // Mostrar o modal com as estatísticas atualizadas
            this.showNextPhaseModal();
        }
        
        this.gameState.saveCurrentGame();
    }

    handleWrongAnswer() {
        console.log('Iniciando handleWrongAnswer');
        this.playSound('wrongSound');

        // Atualizar estatsticas
        // (usamos o método updatePhaseStats com o parâmetro false para indicar que a resposta é errada.)
        this.gameState.updatePhaseStats(false);
        
        const key = `${this.gameState.currentGameState.currentQuestion.num1}x${this.gameState.currentGameState.currentQuestion.num2}`;
        this.gameState.currentGameState.currentQuestions[key].masteryLevel = 0;
        
        console.log('Pausando o jogo');
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');
        
        console.log('Mostrando modal de resposta errada');
        this.showWrongAnswerModal();
        // this.gameState.decrementLives();
        this.loseLife();
        this.updateHistory(false);
        
        // Salvar após resposta errada
        this.gameState.saveCurrentGame();
        
        console.log('handleWrongAnswer finalizado');
    }

    generateQuestion() {
        console.log('=== Gerando Nova Questão ===');
        console.log('Estado atual:', {
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            questões: this.gameState.currentGameState.currentQuestions
        });

        const questionKey = this.selectNextQuestion();
        
        if (questionKey === null && this.gameState.isSubPhaseComplete()) {
            console.log('Todas as questões desta subfase foram completadas');
            this.showNextPhaseModal();
            return;
        }

        if (questionKey) {
            this.gameState.currentGameState.currentQuestion = this.gameState.currentGameState.currentQuestions[questionKey];
            console.log('Questão selecionada:', this.gameState.currentGameState.currentQuestion);
            
            document.getElementById('question').textContent = 
                `${this.gameState.currentGameState.currentQuestion.num1} × ${this.gameState.currentGameState.currentQuestion.num2} = ?`;
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

        Object.entries(this.gameState.currentGameState.currentQuestions).forEach(([key, question]) => {
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
        return Object.values(this.gameState.currentGameState.currentQuestions)
            .every(q => q.masteryLevel === 2);
    }

    startTimer() {
        if (this.gameState.getIsPaused()) return;
        
        clearInterval(this.gameState.timerInterval);
        const diffSettings = this.gameState.globalConfigs.difficultySettings[this.gameState.globalConfigs.currentDifficulty];
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

    pauseGame(pauseType = this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK) {
        console.log('=== Chamada do pauseGame ===', {
            tipo: pauseType,
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            trace: new Error().stack
        });
        
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
            case this.gameState.globalConfigs.PAUSE_TYPES.INITIAL:
                modalTitle.innerHTML = '<i class="fas fa-play"></i> Pronto para começar?';
                resumeButton.innerHTML = '<i class="fas fa-play"></i> Iniciar Jogo';
                break;
                
            case this.gameState.globalConfigs.PAUSE_TYPES.NEXT_PHASE:
                // Mostrar mensagem especial apenas quando iniciar uma nova fase numérica (subfase A)
                if (this.gameState.currentGameState.currentSubPhase === 'A') {
                    modalTitle.innerHTML = `<i class="fas fa-calculator"></i> Tabuada do ${this.gameState.currentGameState.currentPhase}`;
                    resumeButton.innerHTML = '<i class="fas fa-play"></i> Começar Nova Fase';
                    modalTitle.insertAdjacentHTML(
                        'afterend',
                        '<p class="pause-message">Prepare-se para a próxima fase!</p>'
                    );
                } else {
                    modalTitle.innerHTML = '<i class="fas fa-pause"></i> Jogo Pausado';
                    resumeButton.innerHTML = '<i class="fas fa-play"></i> Continuar Jogo';
                }
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
        
        if (this.gameState.currentGameState.lives > 0) {
            hearts[this.gameState.currentGameState.lives - 1].classList.add('heart-lost');
            livesElement.classList.remove('lives-highlight');
            void livesElement.offsetWidth;
            livesElement.classList.add('lives-highlight');
            
            setTimeout(() => {
                this.gameState.decrementLives();
                this.updateLives();
                
                // Salvar após perder vida
                this.gameState.saveCurrentGame();
                
                if (this.gameState.currentGameState.lives <= 0) {
                    this.gameOver();
                }
            }, 500);
        }
    }

    updateLives() {
        const heartsContainer = document.querySelector('.hearts-container');
        heartsContainer.innerHTML = '';
        
        for (let i = 0; i < this.gameState.globalConfigs.MAX_LIVES; i++) {
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart';
            if (i >= this.gameState.currentGameState.lives) {
                heart.style.opacity = '0.3';
            }
            heartsContainer.appendChild(heart);
        }
    }

    gainLife() {
        if (this.gameState.currentGameState.lives < this.gameState.globalConfigs.MAX_LIVES) {
            this.gameState.currentGameState.lives++;
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
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            questõesCompletadas: this.gameState.isSubPhaseComplete()
        });

        this.gameState.setIsPaused(true);
        clearInterval(this.gameState.timerInterval);
        
        // Verificar se completou a fase 10B (Zerou o jogo)
        if (this.gameState.currentGameState.currentPhase === 10 && this.gameState.currentGameState.currentSubPhase === 'B' && this.gameState.isSubPhaseComplete()) {

            // Obter estatísticas combinadas da fase 10
            const stats = this.gameState.getCombinedPhaseStats(10);
            
            // Mostrar modal especial de conclusão do jogo
            const modal = document.getElementById('nextPhaseModal');
            const modalContent = modal.querySelector('.modal-content');
            
            modalContent.innerHTML = `
                <h2><i class="fas fa-crown"></i> Parabéns!</h2>
                <p>Você completou a última fase do Jogo da Tabuada!</p>
                <div class="phase-stats">
                    <div class="stat-item">
                        <i class="fas fa-check"></i>
                        <span>Acertos: ${stats.corrects}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-times"></i>
                        <span>Erros: ${stats.errors}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-percentage"></i>
                        <span>Taxa de Acerto: ${Math.round(stats.accuracy)}%</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>Tempo Total: ${Math.round(stats.totalTime / 1000)}s</span>
                    </div>
                </div>
                <p>Você pode continuar jogando para melhorar a sua pontuação e suas habilidades!</p>
                <button id="startNextPhase" class="next-phase-btn">
                    Continuar <i class="fas fa-redo"></i>
                </button>
            `;
            
            // Chamar o efeito de confete especial
            setTimeout(() => {
                // Chama o confete dourado primeiro
                this.celebrateGameCompletion();
                // Chama o confete colorido normal com um pequeno atraso
                setTimeout(() => this.celebrateCompletion(), 50);
            }, 50);
            
            modal.style.display = 'block';
            
            // Reattach event listener para o botão
            document.getElementById('startNextPhase').addEventListener('click', () => {
                modal.style.display = 'none';
                // Reiniciar a fase 10 ao invés de avançar
                this.gameState.currentGameState.currentSubPhase = 'A';
                this.gameState.initializePhaseQuestions();
                this.gameState.resetPhaseStats();
                this.generateQuestion();
                this.gameState.setIsPaused(false);
                document.getElementById('game').classList.remove('game-paused');
            });
            
            return;
        }

        // Primeiro determinar a mensagem correta

        // Determinar a mensagem de "você dominou"
        if (this.gameState.currentGameState.currentPhase != 10) {
            var currentPhaseText = `tabuada do <span id="currentPhase">${this.gameState.currentGameState.currentPhase} (parte ${this.gameState.currentGameState.currentSubPhase})</span>`;
        } else {
            var currentPhaseText = `<span id="currentPhase">Fase Final (parte ${this.gameState.currentGameState.currentSubPhase})</span>`;
        }

        let nextPhaseText;
        let showStats = false;
        
        // Determinar a mensagem de "próxima fase"
        if (this.gameState.currentGameState.currentSubPhase === 'A') {
            // Se estamos na subfase A, próxima é B da mesma fase
            nextPhaseText = `tabuada do ${this.gameState.currentGameState.currentPhase} (parte B)`;
        } else {
            // Se estamos na subfase B, próxima é A da próxima fase
            nextPhaseText = `tabuada do ${this.gameState.currentGameState.currentPhase + 1} (parte A)`;
            showStats = true; // Mostrar estatísticas apenas ao completar a fase inteira
        }

        // Se a fase atual é a 9 e a subfase é B, então a próxima fase é a final
        if (this.gameState.currentGameState.currentPhase == 9 && this.gameState.currentGameState.currentSubPhase == 'B') {
            nextPhaseText = `<span id="nextPhase">Fase Final</span> (parte A)`;
        }

        // Se a fase atual é a 10 e a subfase é A, então a próxima fase é a final
        if (this.gameState.currentGameState.currentPhase == 10 && this.gameState.currentGameState.currentSubPhase == 'A') {
            nextPhaseText = `<span id="nextPhase">Fase Final</span> (parte B)`;
        }

        // Atualizar o modal com as mensagens corretas
        const modal = document.getElementById('nextPhaseModal');
        const modalContent = modal.querySelector('.modal-content');

        // Montar string da mensagem de parabéns:
        var congratsMessage = `
            <h2>Parabéns! <i class="fas fa-star"></i></h2>
            <p>Você dominou a ${currentPhaseText}</p>
            ${this.gameState.currentGameState.lives < this.gameState.globalConfigs.MAX_LIVES ? `
                <div class="bonus-life">
                    <i class="fas fa-heart"></i>
                    Você ganhou uma vida extra!
                </div>
            ` : ''}
            ${showStats ? `
                <div class="phase-stats">
                    <div class="stat-item">
                        <i class="fas fa-check"></i>
                        <span>Acertos: ${this.gameState.phaseStats.corrects}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-times"></i>
                        <span>Erros: ${this.gameState.phaseStats.errors}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-percentage"></i>
                        <span>Taxa de Acerto: ${Math.round((this.gameState.phaseStats.corrects / (this.gameState.phaseStats.corrects + this.gameState.phaseStats.errors)) * 100)}%</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>Tempo Total: ${Math.round((Date.now() - this.gameState.phaseStats.startTime) / 1000)}s</span>
                    </div>
                </div>
            ` : ''}
            <p>Próxima fase: <span id="nextPhase">${nextPhaseText}</span></p>
            <button id="startNextPhase" class="next-phase-btn">
                Continuar <i class="fas fa-arrow-right"></i>
            </button>
        `;
        
        // Atualizar o modal com a mensagem de parabéns
        modalContent.innerHTML = congratsMessage;

        // Depois atualizar o estado do jogo
        if (this.gameState.currentGameState.currentSubPhase === 'A') {
            console.log('Avançando para subfase B');

            // Acumular estatísticas da subfase A
            // this.gameState.accumulatePhaseStats();
            // Agora não acumulamos estatísticas, armazenamos separadamente para cada subfase.

            // Atualizar a subfase para B
            this.gameState.currentGameState.currentSubPhase = 'B';
            
            // Ganhar vida ao completar subfase A
            if (this.gameState.currentGameState.lives < this.gameState.globalConfigs.MAX_LIVES) {
                this.gainLife();
            }
            
            // Reiniciar estatísticas para a subfase B
            this.gameState.phaseStats = {
                errors: 0,
                corrects: 0,
                totalTime: 0,
                startTime: Date.now()
            };
            this.gameState.initializePhaseQuestions();
        } else {
            console.log('Completou fase inteira, avançando para próxima fase');
            
            // Ganhar vida ao completar a fase inteira
            if (this.gameState.currentGameState.lives < this.gameState.globalConfigs.MAX_LIVES) {
                this.gainLife();
            }
            
            // Usar estatísticas combinadas das subfases A e B
            const stats = this.gameState.getCombinedPhaseStats(this.gameState.currentGameState.currentPhase);
            modalContent.innerHTML = `
                <h2>Parabéns! <i class="fas fa-star"></i></h2>
                <p>Você dominou a tabuada do <span id="currentPhase">${this.gameState.currentGameState.currentPhase}</span>!</p>
                ${this.gameState.currentGameState.lives < this.gameState.globalConfigs.MAX_LIVES ? `
                    <div class="bonus-life">
                        <i class="fas fa-heart"></i>
                        Você ganhou uma vida extra!
                    </div>
                ` : ''}
                ${showStats ? `
                    <div class="phase-stats">
                        <div class="stat-item">
                            <i class="fas fa-check"></i>
                            <span>Acertos: ${stats.corrects}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-times"></i>
                            <span>Erros: ${stats.errors}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-percentage"></i>
                            <span>Taxa de Acerto: ${Math.round(stats.accuracy)}%</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-clock"></i>
                            <span>Tempo Total: ${Math.round(stats.totalTime / 1000)}s</span>
                        </div>
                    </div>
                ` : ''}
                <p>Próxima fase: Tabuada do <span id="nextPhase">${nextPhaseText}</span></p>
                <button id="startNextPhase" class="next-phase-btn">
                    Continuar <i class="fas fa-arrow-right"></i>
                </button>
            `;
            
            // Chamar o efeito de confete após mostrar o modal
            setTimeout(() => this.celebrateCompletion(), 50);
            
            // Resetar estatísticas para a próxima fase
            this.gameState.currentGameState.currentPhase++;
            this.gameState.currentGameState.currentSubPhase = 'A';

            // Garante que highestPhase seja atualizado com o novo progresso
            if (this.gameState.currentGameState.highestPhase < this.gameState.currentGameState.currentPhase) {
                this.gameState.currentGameState.highestPhase = this.gameState.currentGameState.currentPhase;
            }
            
            this.gameState.initializePhaseQuestions();
        }

        console.log('Novo estado após mudança:', {
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            proximaFase: nextPhaseText
        });

        this.updateProgressBar();
        modal.style.display = 'block';
        
        // Reattach event listener para o novo botão
        document.getElementById('startNextPhase').addEventListener('click', () => {
            console.log('=== Clique no botão Continuar ===');
            console.log('Estado atual:', {
                fase: this.gameState.currentGameState.currentPhase,
                subfase: this.gameState.currentGameState.currentSubPhase
            });
            
            modal.style.display = 'none';
            
            // Se completou a fase inteira (subfase B), mostra o modal de pausa
            if (this.gameState.currentGameState.currentSubPhase === 'B') {
                console.log('Subfase B: Continuando jogo sem pausar');
                // Apenas fecha o modal e continua o jogo
                this.gameState.setIsPaused(false);
                document.getElementById('game').classList.remove('game-paused');
                this.generateQuestion();
            } else {
                console.log('Subfase A: Mostrando modal de pausa para próxima fase');
                // Completou a fase inteira, mostra o modal de pausa para próxima fase
                this.gameState.setIsPaused(true);
                document.getElementById('game').classList.add('game-paused');
                this.updateBackground();
                // this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.NEXT_PHASE);

                // Ao invés de mostrar o modal de pausa, mostra o modal de navegação para a fase recém aberta:
                this.showPhaseHistory(this.gameState.currentGameState.currentPhase);
                // this.generateQuestion();
            }
        });
        
        console.log('Estado do jogo após configurar modal:', {
            fase: this.gameState.currentGameState.currentPhase,
            subfase: this.gameState.currentGameState.currentSubPhase,
            pausado: this.gameState.getIsPaused()
        });
        
        this.gameState.saveCurrentGame();
    }

    directPhaseClick(phaseNumber) {
        // Verificar se a fase já foi concluída (Usando 'B' para testar sempre pela fase completa)
        const phaseStats = this.gameState.currentGameState.phaseStats[`${phaseNumber}B`];

        console.log('Avaliando conclusão da fase ' + phaseNumber + ':');
        console.log('phaseStats:', phaseStats);

        if (phaseStats && phaseStats.completed) {
            console.log('Fase completa, iniciando modal de estatísticas.');
            // this.showStatsModal(phaseStats, phaseNumber);
            this.showPhaseHistory(phaseNumber);
        } else {
            console.log('Fase clicada não está concluída, iniciando fase.');
            // Caso a fase ainda não tenha sido completada inicia a fase imediatamente
            this.changePhase(phaseNumber);
        }
    }

    showStatsModal(phaseStats, phase) {
        // Pausar o jogo
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');

        // Guardar a fase atual para restaurar depois
        const currentPhase = this.gameState.currentGameState.currentPhase;
        
        // Mudar temporariamente o background para a fase selecionada
        document.body.style.background = `url('${this.backgroundImages[phase]}') no-repeat center center fixed`;
        document.body.style.backgroundSize = 'cover';

        const modal = document.getElementById('statsModal');
        const stats = this.gameState.getCombinedPhaseStats(phase);
        
        document.getElementById('statsPhase').textContent = phase;
        document.getElementById('statsDetails').innerHTML = `
            <div class="phase-stats">
                <div class="stat-item accuracy-stat">
                    <div class="accuracy-header">
                        <i class="fas fa-percentage"></i>
                        <span>Taxa de Acerto: ${Math.round(stats.accuracy)}%</span>
                    </div>
                    <div class="accuracy-bar">
                        <div class="accuracy-progress" style="width: ${Math.round(stats.accuracy)}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <i class="fas fa-check"></i>
                    <span>Acertos: ${stats.corrects}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-times"></i>
                    <span>Erros: ${stats.errors}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-clock"></i>
                    <span>Tempo Total: ${Math.round(stats.totalTime / 1000)}s</span>
                </div>
                ${stats.completionDate ? `
                    <div class="stat-item">
                        <i class="fas fa-calendar"></i>
                        <span>Concluído em: ${new Date(stats.completionDate).toLocaleDateString()}</span>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'block';

        // Configurar os event listeners dos botões
        document.getElementById('replayPhase').onclick = () => {
            // Avisa usuário que se ele continuar, perderá a pontuação atual
            if (confirm('Ao rejogar a fase, você perderá as estatísticas atuais. Deseja continuar?')) {
                modal.style.display = 'none';
                this.changePhase(phase);
                // Despausar o jogo ao iniciar a fase
                this.gameState.setIsPaused(false);
                document.getElementById('game').classList.remove('game-paused');
                // Não precisa restaurar o background aqui pois changePhase já atualiza
            }
        };
        
        document.getElementById('closeStats').onclick = () => {
            modal.style.display = 'none';
            // Despausar o jogo ao fechar o modal
            this.gameState.setIsPaused(false);
            document.getElementById('game').classList.remove('game-paused');
            // Restaurar o background para a fase atual
            document.body.style.background = `url('${this.backgroundImages[currentPhase]}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
        };
    }
    

    initializeGameOverListeners() {
        document.getElementById('restartGame').addEventListener('click', () => {
            document.getElementById('gameOverModal').style.display = 'none';
            this.openConfigModal(); // Abrir modal de nova partida
        });
    }

    initializePhaseListeners() {
        document.querySelectorAll('.phase').forEach(phase => {
            phase.addEventListener('click', () => {
                const phaseNumber = parseInt(phase.dataset.phase);
                this.directPhaseClick(phaseNumber);
            });
        });
    }

    changePhase(newPhase) {
        // Caso a fase já esteja liberada...
        if (newPhase >= 2 && newPhase <= this.gameState.currentGameState.highestPhase) {
            this.gameState.currentGameState.currentPhase = newPhase;
            this.gameState.currentGameState.currentSubPhase = 'A'; // Sempre começar pela subfase A
            
            // Reinicializar estatísticas da fase
            this.gameState.currentGameState.phaseStats[`${newPhase}A`] = {
                completed: false,
                errors: 0,
                corrects: 0,
                totalTime: 0,
                bestTime: null,
                completionDate: null,
                attempts: 0,
                accuracy: 0,
                startTime: Date.now()
            };
            
            this.gameState.currentGameState.phaseStats[`${newPhase}B`] = {
                completed: false,
                errors: 0,
                corrects: 0,
                totalTime: 0,
                bestTime: null,
                completionDate: null,
                attempts: 0,
                accuracy: 0,
                startTime: Date.now()
            };

            localStorage.setItem('currentPhase', this.gameState.currentGameState.currentPhase);
            this.gameState.initializePhaseQuestions();
            this.updateProgressBar();
            this.generateQuestion();
            this.updateBackground();
            
            // Salvar o estado atualizado
            this.gameState.saveCurrentGame();
        }
    }

    updateHistory(isCorrect) {
        if (typeof isCorrect === 'boolean') {
            this.gameState.currentGameState.attemptsHistory.push(isCorrect);
            if (this.gameState.currentGameState.attemptsHistory.length > this.gameState.globalConfigs.MAX_HISTORY) {
                this.gameState.currentGameState.attemptsHistory = this.gameState.currentGameState.attemptsHistory.slice(-this.gameState.globalConfigs.MAX_HISTORY);
            }
        }
        
        const historyContainer = document.getElementById('attempts-history');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            this.gameState.currentGameState.attemptsHistory.forEach((attempt, index) => {
                const icon = document.createElement('i');
                icon.className = `fas ${attempt ? 'fa-check-circle' : 'fa-times-circle'} attempt-icon ${attempt ? 'correct' : 'wrong'}`;
                if (index === this.gameState.currentGameState.attemptsHistory.length - 1) {
                    icon.classList.add('new');
                }
                historyContainer.appendChild(icon);
            });
        }
    }

    gameOver() {
        const modal = document.getElementById('gameOverModal');
        document.querySelector('.player-name-display').textContent = this.gameState.currentGameState.playerName;
        document.getElementById('finalScore').textContent = this.gameState.currentGameState.score;
        
        // Adicionar a pontuação ao ranking automaticamente
        this.addHighScore(this.gameState.currentGameState.playerName, this.gameState.currentGameState.score);
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
            .slice(0, this.gameState.globalConfigs.MAX_HIGH_SCORES);
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
                    const isCurrentGame = this.gameState.currentGameState.currentGameId && 
                        score.name === this.gameState.currentGameState.playerName && 
                        score.score === this.gameState.currentGameState.score;
                    
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
        const question = `${this.gameState.currentGameState.currentQuestion.num1} × ${this.gameState.currentGameState.currentQuestion.num2}`;
        const answer = this.gameState.currentGameState.currentQuestion.answer;
        
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
        localStorage.setItem('questions', JSON.stringify(this.gameState.currentGameState.currentQuestions));
    }

    loadProgress() {
        const savedQuestions = localStorage.getItem('questions');
        if (savedQuestions) {
            const loadedQuestions = JSON.parse(savedQuestions);
            const firstQuestion = Object.keys(loadedQuestions)[0];
            const savedPhaseNumber = parseInt(firstQuestion.split('x')[0]);
            
            if (savedPhaseNumber === this.gameState.currentGameState.currentPhase) {
                this.gameState.currentGameState.currentQuestions = loadedQuestions;
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
        if (this.gameState.currentGameState.playerName) {
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
        if (!this.gameState.currentGameState.playerName) {
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
        
        // Inicializar o seletor de emoji
        const emojiPicker = document.getElementById('emojiPicker');
        const commonEmojis = [
            '🎮', '🎯', '🧮', '🔢', '🎲',
            '🌟', '🚀', '🎓', '🧠', '💡',
            '⭐', '🏆', '💪', '🎨', '😜',
            '😎', '😃', '👽', '👾', '🤖',
            '🤯', '🤠', '🤪', '🤭', '😉',
            '⚽', '🏀', '🏈', '🏉', '🏐',
            '🎸', '🎹', '🥁'
        ];
        
        emojiPicker.innerHTML = commonEmojis.map(emoji => `
            <span class="emoji-option" role="button" tabindex="0">${emoji}</span>
        `).join('');
        
        // Adicionar listeners para os emojis
        document.querySelectorAll('.emoji-option').forEach(option => {
            option.addEventListener('click', () => {
                const input = document.getElementById('newGamePlayerName');
                const cursorPos = input.selectionStart;
                const textBefore = input.value.substring(0, cursorPos);
                const textAfter = input.value.substring(cursorPos);
                
                input.value = textBefore + option.textContent + textAfter;
                input.focus();
                // Posicionar o cursor após o emoji
                const newPos = cursorPos + option.textContent.length;
                input.setSelectionRange(newPos, newPos);
            });
            
            // Permitir seleção por teclado também
            option.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    option.click();
                }
            });
        });
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
        this.gameState.globalConfigs.currentDifficulty = newDifficulty;
        this.gameState.globalConfigs.MAX_LIVES = newLivesCount;
        this.gameState.currentGameState.lives = newLivesCount;
        
        this.gameState.initializePhaseQuestions();
        this.updateProgressBar();
        this.updateDisplay();
        this.generateQuestion();
        this.updateBackground();
        
        document.getElementById('configModal').style.display = 'none';
        
        // Ao invés de mostrar o modal de pausa, mostrar o modal de história na posição inicial
        this.showPhaseHistory(0);
        
        // Atualizar o nome do jogador na interface
        document.getElementById('playerNameDisplay').textContent = playerName;
    }

    updateDisplay() {
        document.getElementById('scoreValue').textContent = this.gameState.currentGameState.score;
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
        if (this.gameState.currentGameState.playerName) {
            this.gameState.setIsPaused(true);
            document.getElementById('game').classList.add('game-paused');
        }

        const modal = document.getElementById('savedGamesModal');
        const listContainer = document.getElementById('savedGamesList');
        const closeButton = document.getElementById('closeSavedGames');
        const modalTitle = modal.querySelector('h2');
        const savedGames = this.gameState.listAllSavedGames();
        
        // Mostrar/ocultar botão de fechar e ajustar título baseado no estado do jogo
        if (!this.gameState.currentGameState.playerName) {
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
            // Atualizar o nome do jogador na interface
            document.getElementById('playerNameDisplay').textContent = this.gameState.currentGameState.playerName;
            
            this.updateDisplay();
            this.updateProgressBar();
            this.generateQuestion();
            this.updateBackground();
            document.getElementById('savedGamesModal').style.display = 'none';
            this.pauseGame(this.gameState.globalConfigs.PAUSE_TYPES.TIMER_CLICK);
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

            if (phaseNumber <= this.gameState.currentGameState.highestPhase) {
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
                if (phaseNumber === 10) {
                    // Fase especial - mostrar estrela
                    if (phaseNumber === this.gameState.currentGameState.currentPhase) {
                        phase.innerHTML = `<i class="fas fa-crown"></i><span>★${this.gameState.currentGameState.currentSubPhase}</span>`;
                    } else if (progress === 'complete') {
                        phase.innerHTML = `<i class="fas fa-crown"></i><span>★</span>`;
                    } else {
                        phase.innerHTML = `<i class="fas fa-crown"></i><span>★</span>`;
                    }
                } else if (phaseNumber === this.gameState.currentGameState.currentPhase) {
                    phase.innerHTML = `<i class="fas fa-calculator"></i><span>${phaseNumber}${this.gameState.currentGameState.currentSubPhase}</span>`;
                } else if (progress === 'complete') {
                    phase.innerHTML = `<i class="fas fa-check"></i><span>${phaseNumber}</span>`;
                } else {
                    phase.innerHTML = `<i class="fas fa-calculator"></i><span>${phaseNumber}</span>`;
                }
            } else {
                phase.classList.add('locked');
                if (phaseNumber === 10) {
                    phase.innerHTML = `<i class="fas fa-lock"></i><span>★</span>`;
                } else {
                    phase.innerHTML = `<i class="fas fa-lock"></i><span>${phaseNumber}</span>`;
                }
            }
        });
    }

    // Adicionar novo método para o efeito de confete
    celebrateCompletion() {
        // Configurar o canvas do confete
        const myCanvas = document.createElement('canvas');
        myCanvas.style.position = 'fixed';
        myCanvas.style.top = '0';
        myCanvas.style.left = '0';
        myCanvas.style.width = '100%';
        myCanvas.style.height = '100%';
        myCanvas.style.pointerEvents = 'none';
        myCanvas.style.zIndex = '9999';
        document.body.appendChild(myCanvas);

        const myConfetti = confetti.create(myCanvas, { 
            resize: true,
            useWorker: true // Usar Web Worker para melhor performance
        });

        // Explosão inicial mais intensa
        myConfetti({
            particleCount: 200,
            spread: 150,
            origin: { y: 0.6 },
            colors: ['#1e3c72', '#2ed573', '#ffd700', '#ff4757'],
            disableForReducedMotion: true,
            /*
            // Configurações avançadas
            gravity: 0.8, // Ajustar gravidade para queda mais natural
            scalar: 1.2, // Tamanho dos confetes
            ticks: 300, // Duração da animação
            decay: 0.95 // Taxa de decaimento da velocidade
            */
        });

        // Explosões menores em intervalos
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count >= 5) { // Limitar a 5 explosões adicionais
                clearInterval(interval);
                
                // Remover o canvas após os confetes terminarem de cair
                setTimeout(() => {
                    if (myCanvas.parentNode === document.body) {
                        document.body.removeChild(myCanvas);
                    }
                }, 5000); // Esperar 5 segundos após a última explosão
                return;
            }

            // Explosões menores em posições aleatórias
            myConfetti({
                particleCount: 30,
                spread: 70,
                origin: { 
                    x: Math.random(),
                    y: Math.random() - 0.2
                },
                colors: ['#1e3c72', '#2ed573', '#ffd700', '#ff4757'],
                disableForReducedMotion: true,
                gravity: 0.8,
                scalar: 1,
                ticks: 250,
                decay: 0.95
            });
        }, 300); // Intervalo entre explosões
    }

    celebrateGameCompletion() {
        const myCanvas = document.createElement('canvas');
        myCanvas.style.position = 'fixed';
        myCanvas.style.top = '0';
        myCanvas.style.left = '0';
        myCanvas.style.width = '100%';
        myCanvas.style.height = '100%';
        myCanvas.style.pointerEvents = 'none';
        myCanvas.style.zIndex = '999';
        document.body.appendChild(myCanvas);

        const myConfetti = confetti.create(myCanvas, {
            resize: true,
            useWorker: true
        });

        // Função para criar explosões douradas
        const createGoldenExplosion = (config) => {
            myConfetti({
                ...config,
                colors: ['#FFD700', '#FFA500', '#DAA520', '#FFD700'],
                gravity: 0.5,
                shapes: ['star', 'circle']
            });
        };

        // Explosão inicial mais intensa
        createGoldenExplosion({
            particleCount: 300,
            spread: 180,
            origin: { y: 0.6 },
            scalar: 1.5,
            ticks: 400
        });

        // Série de explosões menores
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count >= 8) {
                clearInterval(interval);
                setTimeout(() => {
                    if (myCanvas.parentNode === document.body) {
                        document.body.removeChild(myCanvas);
                    }
                }, 6000);
                return;
            }

            // Explosões douradas em posições aleatórias
            createGoldenExplosion({
                particleCount: 50,
                spread: 90,
                origin: {
                    x: Math.random(),
                    y: Math.random() - 0.2
                },
                scalar: 1.2,
                ticks: 300
            });
        }, 400);
    }

    showPhaseHistory(phase) {
        // Pausar o jogo
        this.gameState.setIsPaused(true);
        document.getElementById('game').classList.add('game-paused');

        // Guardar a fase atual para restaurar depois
        const currentPhase = this.gameState.currentGameState.currentPhase;
        
        // Mudar temporariamente o background
        if (phase === 0) {
            // Usar o background padrão do jogo (gradiente azul)
            // document.body.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
            document.body.style.background = `url('img/Numi.webp') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
        } else {
            document.body.style.background = `url('${this.backgroundImages[phase]}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
        }

        const modal = document.getElementById('phaseHistoryModal');
        
        // Atualizar título e subtítulo
        document.getElementById('statsPhase').textContent = phase === 0 ? 'Ajude Numi a derrotar Ignórius!' : `Fase ${phase}`;
        document.getElementById('phaseSubtitle').textContent = this.getPhaseSubtitle(phase);
        
        // Atualizar história da fase
        document.getElementById('phaseStory').innerHTML = this.getPhaseStory(phase);
        
        // Atualizar estatísticas apenas se não for a fase de introdução
        if (phase === 0) {
            document.getElementById('statsDetails').style.display = 'none'; // Ocultar completamente
            document.getElementById('replayPhase').style.display = 'none';
        } else {
            const isCurrentPhase = phase === this.gameState.currentGameState.currentPhase;
            const isCompleted = this.gameState.currentGameState.phaseStats[`${phase}B`]?.completed;
            
            // Ajustar texto do botão baseado no estado da fase
            const replayButton = document.getElementById('replayPhase');
            replayButton.style.display = 'block';
            replayButton.innerHTML = isCompleted ? 
                '<i class="fas fa-redo"></i> Jogar Novamente' : 
                '<i class="fas fa-play"></i> Jogar';

            // Mostrar ou ocultar statsDetails baseado no estado de conclusão
            const statsDetails = document.getElementById('statsDetails');
            if (isCurrentPhase && !isCompleted) {
                statsDetails.style.display = 'none'; // Ocultar completamente quando não concluída
            } else {
                statsDetails.style.display = 'block';
                statsDetails.innerHTML = `
                    <div class="phase-stats with-stats">
                        <div class="stat-item accuracy-stat">
                            <div class="accuracy-header">
                                <i class="fas fa-percentage"></i>
                                <span>Taxa de Acerto: ${Math.round(this.gameState.getCombinedPhaseStats(phase).accuracy)}%</span>
                            </div>
                            <div class="accuracy-bar">
                                <div class="accuracy-progress" style="width: ${Math.round(this.gameState.getCombinedPhaseStats(phase).accuracy)}%"></div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-check"></i>
                            <span>Acertos: ${this.gameState.getCombinedPhaseStats(phase).corrects}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-times"></i>
                            <span>Erros: ${this.gameState.getCombinedPhaseStats(phase).errors}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-clock"></i>
                            <span>Tempo Total: ${Math.round(this.gameState.getCombinedPhaseStats(phase).totalTime / 1000)}s</span>
                        </div>
                        ${this.gameState.getCombinedPhaseStats(phase).completionDate ? `
                            <div class="stat-item">
                                <i class="fas fa-calendar"></i>
                                <span>Concluído em: ${new Date(this.gameState.getCombinedPhaseStats(phase).completionDate).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }

        // Configurar navegação
        this.setupPhaseNavigation(phase);

        // Ajustar o estilo do botão de próximo quando estiver na fase 0
        const nextBtn = document.getElementById('nextPhase');
        if (phase === 0) {
            nextBtn.className = 'nav-arrow next-phase-btn';
            nextBtn.innerHTML = 'Continuar <i class="fas fa-arrow-right"></i>';
        } else {
            nextBtn.className = 'nav-arrow';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }

        // Desabilitar o botão se a fase atual for menor ou igual à fase máxima concluída
        if (phase !== 0 && phase === this.gameState.currentGameState.highestPhase) {
            console.log('Fase atual: ', phase);
            console.log('Fase máxima concluída: ', this.gameState.currentGameState.highestPhase);
            nextBtn.classList.add('disabled');
        }

        modal.style.display = 'block';

        // Configurar os event listeners dos botões
        document.getElementById('replayPhase').onclick = () => {
            if (phase === 0) {
                // Se estiver na fase inicial, apenas iniciar o jogo
                modal.style.display = 'none';
                this.gameState.setIsPaused(false);
                document.getElementById('game').classList.remove('game-paused');
                this.generateQuestion();
            } else {
                // Para outras fases, manter o comportamento atual
    
                // Testar se a fase atual já foi concluída
                if (this.gameState.currentGameState.phaseStats[`${phase}B`]?.completed) {
                    if (confirm('Ao rejogar a fase, você perderá as estatísticas atuais. Deseja continuar?')) {
                        modal.style.display = 'none';
                        this.changePhase(phase);
                        this.gameState.setIsPaused(false);
                        document.getElementById('game').classList.remove('game-paused');
                    }
                } else {
                    // Se a fase não foi concluída, permitir (re)jogar sem aviso.
                    modal.style.display = 'none';
                    this.changePhase(phase);
                    /*
                    this.gameState.setIsPaused(false);
                    document.getElementById('game').classList.remove('game-paused');
                    console.log('Estado da Pausa: ', this.gameState.isPaused);
                    */
                    this.resumeGame();
                }
            }
        };
        
        document.getElementById('closeStats').onclick = () => {
            modal.style.display = 'none';
            this.gameState.setIsPaused(false);
            document.getElementById('game').classList.remove('game-paused');
            document.body.style.background = `url('${this.backgroundImages[currentPhase]}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';
        };
    }

    setupPhaseNavigation(currentPhase) {
        const prevBtn = document.getElementById('prevPhase');
        const nextBtn = document.getElementById('nextPhase');
        
        // Encontrar fases disponíveis
        const availablePhases = this.getAvailablePhases();
        const currentIndex = availablePhases.indexOf(currentPhase);
        
        // Configurar botão anterior
        prevBtn.classList.toggle('disabled', currentIndex <= 0);
        prevBtn.onclick = () => {
            if (currentIndex > 0) {
                this.showPhaseHistory(availablePhases[currentIndex - 1]);
            }
        };
        
        // Configurar botão próximo
        nextBtn.classList.toggle('disabled', currentIndex >= availablePhases.length - 1);
        nextBtn.onclick = () => {
            if (currentIndex < availablePhases.length - 1) {
                this.showPhaseHistory(availablePhases[currentIndex + 1]);
            }
        };
    }

    getAvailablePhases() {
        const phases = [];
        // Adicionar fase inicial (0) se houver história
        phases.push(0);
        
        // Adicionar fases completadas e fase atual
        for (let phase = 2; phase <= 10; phase++) {
            // Incluir se a fase foi completada OU se é a fase atual
            if (this.gameState.currentGameState.phaseStats[`${phase}B`]?.completed || 
                phase === this.gameState.currentGameState.currentPhase) {
                phases.push(phase);
            }
        }
        return phases;
    }

    getPhaseSubtitle(phase) {
        if (phase === 0) return "O Início da Jornada";
        if (phase === 2) return "Selva Amazônica";
        if (phase === 10) return "A Fase Final";
        return `Tabuada do ${phase}`;
    }

    getPhaseStory(phase) {
        // Retorna o HTML com a história da fase
        const hasBackground = phase > 0 && this.backgroundImages[phase];
        const storyWrapper = hasBackground ? 'story-with-thumbnail' : '';
        const thumbnail = hasBackground ? `
            <div class="phase-thumbnail" style="background-image: url('${this.backgroundImages[phase]}')"></div>
        ` : '';

        switch(phase) {
            case 0:
                return `
                    <!-- <img src="img/Numi.webp" alt="Início da jornada"> -->
                    <div class="phase-thumbnail" style="background-image: url('img/Numi.webp'); height: 230px; width: 230px; float: left; margin-right: 10px;"></div>
                    <p>Olá, meu nome é <b>Numi</b>, o guardião da matemática!</p>
                    <img src="img/Ignorius.webp" alt="Ignórius" style="height: 110px; width: 110px; float: right; margin-left: 10px;">
                    <p>O vilão <b>Ignórius</b> está tentando dominar o mundo e eu preciso de sua ajuda para derrotá-lo!</p>
                    <div style="clear: right;"></div>
                    <!-- <p>Em um mundo onde os números são a chave para desbloquear o conhecimento, 
                    você começa sua jornada para se tornar um mestre da matemática...</p> -->
                    <br />
                    <p style="text-align: center;">Para isso, saíremos em uma jornada para nos tornar mestres da matemática!</p>
                    <!-- <p style="text-align: center;">Vamos começar?</p> -->
                `;
            case 2:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p>Sua jornada começa na <b>selva Amazônica</b>!</p>
                        <br />
                        <p>Aqui você vai aprender a <b>tabuada do 2</b>.</p>
                        <!-- <p>Os números pares serão seus primeiros aliados na construção do seu conhecimento matemático...</p> -->
                    </div>
                `;
            case 3:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p><b>Cuidado com a múmia!</b></p>
                        <br />
                        <p>Visite as pirâmides do <b>Egito</b>, e aprenda a <b>tabuada do 3</b>!</p>
                    </div>
                `;
            case 4:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p><b>Konnichiwa!</b></p>
                        <br />
                        <p>Aqui no <b>Japão</b> você vai aprender a <b>tabuada do 4</b>!</p>
                    </div>
                `;
            case 5:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p><b>Grecia!</b></p>
                        <br />
                        <p>Aqui você vai aprender a <b>tabuada do 5</b>!</p>
                    </div>
                `;
            case 6:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p>Você já chegou à <b>Grande Muralha da China</b> e está mais perto de completar sua jornada!</p>
                        <br />
                        <p>Aqui você vai aprender a <b>tabuada do 6</b>!</p>
                    </div>
                `;
            case 7:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p><b>Veneza!</b> Embarque em uma gondola e vamos aprender a <b>tabuada do 7</b>!</p>
                    </div>
                `;
            case 8:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p><b>Londres!</b> Aqui você vai aprender a <b>tabuada do 8</b>!</p>
                    </div>
                `;
            case 9:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p>Brr! Que frio! Aqui na <b>Antártica</b> vamos aprender a <b>tabuada do 9</b>!</p>
                    </div>
                `;
            case 10:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p>Você entrou em um portal para <b>outra dimensão</b>.</p>
                        <br />
                        <p>Nesse mundo surreal, você precisará <b>testar os conhecimentos</b> que adquiriu para <b>conquistar a vitória</b>!</p>
                    </div>
                `;
            default:
                return `
                    <div class="${storyWrapper}">
                        ${thumbnail}
                        <p>Você dominou a tabuada do ${phase}!</p>
                    </div>
                `;
        }
    }
}

// Criar instância do controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.gameController = new GameController();
    window.gameController.init();
}); 