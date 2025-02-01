class PlatformHero extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Estado de conclusão do jogo
        this.isCompleted = false;
        this.hasNotifiedCompletion = false;
        
        // Configurações do jogador
        this.player = {
            x: 50,
            y: this.canvas.height - 100,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 4,
            jumpForce: 12,
            isJumping: false,
            direction: 1, // 1 direita, -1 esquerda
            color: '#ff4444'
        };
        
        // Física
        this.gravity = 0.5;
        this.friction = 0.85;
        this.acceleration = 0.8;
        this.maxSpeed = 6;
        
        // Plataformas
        this.platforms = [
            // Chão
            { x: 0, y: this.canvas.height - 40, width: this.canvas.width, height: 40, color: '#4a9f4a' },
            // Plataformas
            { x: 200, y: this.canvas.height - 120, width: 100, height: 20, color: '#8b4513' },
            { x: 350, y: this.canvas.height - 180, width: 100, height: 20, color: '#8b4513' },
            { x: 100, y: this.canvas.height - 220, width: 100, height: 20, color: '#8b4513' },
            { x: 280, y: this.canvas.height - 280, width: 100, height: 20, color: '#8b4513' }
        ];
        
        // Moedas
        this.coins = [
            { x: 230, y: this.canvas.height - 150, size: 15, collected: false },
            { x: 380, y: this.canvas.height - 210, size: 15, collected: false },
            { x: 130, y: this.canvas.height - 250, size: 15, collected: false },
            { x: 310, y: this.canvas.height - 310, size: 15, collected: false }
        ];
        
        // Estado do jogo
        this.score = 0;
        this.keys = {
            left: false,
            right: false,
            up: false
        };
        
        // Configurar eventos do teclado
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'ArrowUp':
            case ' ':
                this.keys.up = true;
                break;
        }
    }

    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowUp':
            case ' ':
                this.keys.up = false;
                break;
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    update() {
        // Movimento horizontal com aceleração
        if (this.keys.left) {
            this.player.velocityX -= this.acceleration;
            this.player.velocityX = Math.max(this.player.velocityX, -this.maxSpeed);
            this.player.direction = -1;
        }
        if (this.keys.right) {
            this.player.velocityX += this.acceleration;
            this.player.velocityX = Math.min(this.player.velocityX, this.maxSpeed);
            this.player.direction = 1;
        }
        
        // Aplicar fricção
        if (!this.keys.left && !this.keys.right) {
            this.player.velocityX *= this.friction;
            // Parar completamente se a velocidade for muito baixa
            if (Math.abs(this.player.velocityX) < 0.1) {
                this.player.velocityX = 0;
            }
        }
        
        // Aplicar gravidade
        this.player.velocityY += this.gravity;
        
        // Atualizar posição
        // Movimento em X com verificação de colisão por etapa
        const nextX = this.player.x + this.player.velocityX;
        let canMoveX = true;
        
        // Verificar colisão horizontal antes de mover
        const futurePlayerX = {
            x: nextX,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        
        for (let platform of this.platforms) {
            if (this.checkCollision(futurePlayerX, platform)) {
                canMoveX = false;
                if (this.player.velocityX > 0) {
                    this.player.x = platform.x - this.player.width;
                } else if (this.player.velocityX < 0) {
                    this.player.x = platform.x + platform.width;
                }
                this.player.velocityX = 0;
                break;
            }
        }
        
        if (canMoveX) {
            this.player.x = nextX;
        }
        
        // Movimento em Y com verificação de colisão
        this.player.y += this.player.velocityY;
        
        // Verificar colisões com plataformas
        let onGround = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                // Colisão vertical
                if (this.player.velocityY > 0) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    onGround = true;
                    this.player.isJumping = false;
                } else if (this.player.velocityY < 0) {
                    // Bateu a cabeça
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
            }
        });
        
        // Permitir pulo apenas quando no chão
        if (onGround && this.keys.up && !this.player.isJumping) {
            this.player.velocityY = -this.player.jumpForce;
            this.player.isJumping = true;
        }
        
        // Coletar moedas
        this.coins.forEach(coin => {
            if (!coin.collected && 
                Math.hypot(this.player.x + this.player.width/2 - coin.x,
                          this.player.y + this.player.height/2 - coin.y) < coin.size + 20) {
                coin.collected = true;
                this.score += 10;
                
                // Verifica se todas as moedas foram coletadas
                if (this.coins.every(c => c.collected) && !this.hasNotifiedCompletion) {
                    this.isCompleted = true;
                    this.hasNotifiedCompletion = true;
                    // Opcional: Dispara um evento customizado
                    const event = new CustomEvent('gameCompleted', { 
                        detail: { 
                            game: 'PlatformHero',
                            score: this.score 
                        }
                    });
                    window.dispatchEvent(event);
                }
            }
        });
        
        // Limites da tela
        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
    }

    render() {
        // Limpar canvas
        this.context.fillStyle = '#87CEEB';  // Céu azul
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar plataformas
        this.platforms.forEach(platform => {
            this.context.fillStyle = platform.color;
            this.context.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Desenhar moedas não coletadas
        this.coins.forEach(coin => {
            if (!coin.collected) {
                this.context.beginPath();
                this.context.arc(coin.x, coin.y, coin.size/2, 0, Math.PI * 2);
                this.context.fillStyle = '#FFD700';
                this.context.fill();
                this.context.strokeStyle = '#DAA520';
                this.context.lineWidth = 2;
                this.context.stroke();
            }
        });
        
        // Desenhar jogador
        this.context.fillStyle = this.player.color;
        this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Olhos do personagem
        const eyeOffset = this.player.direction > 0 ? 20 : 5;
        this.context.fillStyle = 'white';
        this.context.fillRect(this.player.x + eyeOffset, this.player.y + 10, 5, 5);
        
        // Instruções
        this.context.font = 'bold 20px Arial';
        this.context.textAlign = 'center';
        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        const instructions = 'Use as setas para mover e pular';
        this.context.strokeText(instructions, this.canvas.width/2, 30);
        this.context.fillText(instructions, this.canvas.width/2, 30);

        // Mensagem de conclusão
        if (this.isCompleted) {
            this.context.font = 'bold 24px Arial';
            this.context.textAlign = 'center';
            this.context.fillStyle = 'white';
            this.context.strokeStyle = 'black';
            this.context.lineWidth = 3;
            const message = 'Parabéns! Você coletou todas as moedas!';
            this.context.strokeText(message, this.canvas.width/2, this.canvas.height/2);
            this.context.fillText(message, this.canvas.width/2, this.canvas.height/2);
        }
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('PlatformHero', PlatformHero); 