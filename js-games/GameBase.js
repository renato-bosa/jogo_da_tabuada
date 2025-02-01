class GameBase {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Configuração padrão do tamanho
        this.canvas.width = 480;
        this.canvas.height = 360;
        
        // Adiciona o canvas ao container
        this.container.appendChild(this.canvas);
        
        // Estado do jogo
        this.isRunning = false;
        this.score = 0;
        
        // Eventos de input
        this.setupInputEvents();
    }

    setupInputEvents() {
        // Mouse/Touch events
        this.canvas.addEventListener('mousedown', (e) => this.handleInput('down', e));
        this.canvas.addEventListener('mousemove', (e) => this.handleInput('move', e));
        this.canvas.addEventListener('mouseup', (e) => this.handleInput('up', e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput('down', e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleInput('move', e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleInput('up', e.touches[0]);
        });

        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
        window.addEventListener('keyup', (e) => this.handleKeyboard(e));
    }

    handleInput(type, event) {
        // Será implementado pelos jogos específicos
    }

    handleKeyboard(event) {
        // Será implementado pelos jogos específicos
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Será implementado pelos jogos específicos
    }

    render() {
        // Será implementado pelos jogos específicos
    }
} 