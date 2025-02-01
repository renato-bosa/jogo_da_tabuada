class CircleClicker extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        this.circle = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 20,
            color: '#ff0000'
        };
        
        this.timeLeft = 30; // 30 segundos de jogo
        this.lastTime = Date.now();
    }

    handleInput(type, event) {
        if (type === 'down') {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Verifica se clicou no círculo
            const distance = Math.sqrt(
                Math.pow(x - this.circle.x, 2) + 
                Math.pow(y - this.circle.y, 2)
            );
            
            if (distance <= this.circle.radius) {
                this.score++;
                this.moveCircle();
            }
        }
    }

    moveCircle() {
        this.circle.x = Math.random() * (this.canvas.width - 40) + 20;
        this.circle.y = Math.random() * (this.canvas.height - 40) + 20;
    }

    update() {
        const currentTime = Date.now();
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.timeLeft -= delta;
        
        if (this.timeLeft <= 0) {
            this.stop();
            alert(`Fim de jogo! Pontuação: ${this.score}`);
        }
    }

    render() {
        // Limpa o canvas
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenha o círculo
        this.context.beginPath();
        this.context.arc(this.circle.x, this.circle.y, this.circle.radius, 0, Math.PI * 2);
        this.context.fillStyle = this.circle.color;
        this.context.fill();
        
        // Desenha o placar e tempo
        this.context.fillStyle = '#000000';
        this.context.font = '20px Arial';
        this.context.fillText(`Pontos: ${this.score}`, 10, 30);
        this.context.fillText(`Tempo: ${Math.ceil(this.timeLeft)}s`, 10, 60);
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('CircleClicker', CircleClicker); 