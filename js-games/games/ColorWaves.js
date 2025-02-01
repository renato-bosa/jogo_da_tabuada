class ColorWaves extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações das ondas
        this.waves = [];
        this.maxWaves = 15;
        this.hue = 0;
        
        // Configuração do gradiente de fundo
        this.backgroundHue = 200;
        this.backgroundLightness = 15;
        
        // Velocidade da animação
        this.waveSpeed = 0.5;
        this.colorSpeed = 0.2;
    }

    handleInput(type, event) {
        if (type === 'down') {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Cria uma nova onda no ponto clicado
            this.createWave(x, y);
        }
    }

    createWave(x, y) {
        // Remove a onda mais antiga se atingir o limite
        if (this.waves.length >= this.maxWaves) {
            this.waves.shift();
        }
        
        // Cria uma nova onda com cor atual
        this.waves.push({
            x: x,
            y: y,
            radius: 0,
            hue: this.hue,
            opacity: 0.7
        });
        
        // Muda a cor para a próxima onda
        this.hue = (this.hue + 30) % 360;
    }

    update() {
        // Atualiza o fundo
        this.backgroundHue = (this.backgroundHue + 0.1) % 360;
        
        // Atualiza cada onda
        this.waves.forEach((wave, index) => {
            wave.radius += this.waveSpeed;
            wave.opacity -= 0.001;
            
            // Remove ondas que ficaram transparentes
            if (wave.opacity <= 0) {
                this.waves.splice(index, 1);
            }
        });
    }

    render() {
        // Desenha o fundo com gradiente
        const gradient = this.context.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        
        gradient.addColorStop(0, `hsl(${this.backgroundHue}, 70%, ${this.backgroundLightness}%)`);
        gradient.addColorStop(1, `hsl(${(this.backgroundHue + 60) % 360}, 70%, ${this.backgroundLightness - 5}%)`);
        
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenha as ondas
        this.waves.forEach(wave => {
            this.context.beginPath();
            this.context.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.context.fillStyle = `hsla(${wave.hue}, 70%, 60%, ${wave.opacity})`;
            this.context.fill();
            
            // Borda suave para cada onda
            this.context.strokeStyle = `hsla(${wave.hue}, 70%, 70%, ${wave.opacity * 0.5})`;
            this.context.lineWidth = 2;
            this.context.stroke();
        });

        // Adiciona uma mensagem suave
        this.context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.context.font = '20px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('Clique para criar ondas coloridas', this.canvas.width / 2, 30);
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('ColorWaves', ColorWaves); 