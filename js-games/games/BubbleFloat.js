class BubbleFloat extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações das bolhas
        this.bubbles = [];
        this.maxBubbles = 50;
        
        // Controle de criação
        this.createCooldown = 0;
        this.createInterval = 16;  // Frames entre cada bolha
        this.lastCreateX = null;
        this.lastCreateY = null;
        this.minDistance = 30;    // Distância mínima entre bolhas
        this.lastCreateTime = 0;     // Último momento em que uma bolha foi criada
        this.resetSpacingDelay = 250; // Tempo para resetar o controle de espaçamento (ms)
        
        // Configurações físicas
        this.gravity = -0.08;      // Gravidade mais suave
        this.friction = 0.995;     // Menos fricção
        this.repulsion = 0.8;      // Mais repulsão entre bolhas
        this.bounciness = 0.9;     // Coeficiente de restituição para quicar
        this.attraction = 0.3;
        
        // Configurações visuais
        this.minSize = 10;
        this.maxSize = 40;
        this.baseHue = Math.random() * 360;
        this.glowAmount = 0;
        this.glowSpeed = 0.02;
        this.hueSpeed = 0.5;        // Velocidade de mudança da cor base
        this.hueRange = 120;        // Variação de cor entre bolhas consecutivas
        
        // Estado do mouse
        this.mouseDown = false;
        this.mouseRadius = 100;
    }

    handleInput(type, event) {
        if (!event) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (type === 'down') {
            this.mouseDown = true;
            this.createBubble(x, y);
        } else if (type === 'up') {
            this.mouseDown = false;
        } else if (type === 'move' && this.mouseDown) {
            this.createBubble(x, y);
        }
    }

    createBubble(x, y) {
        if (this.bubbles.length >= this.maxBubbles || this.createCooldown > 0) return;
        
        const currentTime = Date.now();
        
        // Reseta o controle de espaçamento se passou tempo suficiente
        if (currentTime - this.lastCreateTime > this.resetSpacingDelay) {
            this.lastCreateX = null;
            this.lastCreateY = null;
        }
        
        // Verifica a distância da última bolha criada
        if (this.lastCreateX !== null) {
            const dx = x - this.lastCreateX;
            const dy = y - this.lastCreateY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.minDistance) return;
        }

        const size = this.minSize + Math.random() * (this.maxSize - this.minSize);
        const hue = (this.baseHue + Math.random() * this.hueRange) % 360;
        
        this.bubbles.push({
            x: x,
            y: y,
            size: size,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            hue: hue,
            opacity: 0.8,
            age: 0
        });
        
        // Atualiza o controle de criação
        this.createCooldown = this.createInterval;
        this.lastCreateX = x;
        this.lastCreateY = y;
        this.lastCreateTime = currentTime;
    }

    update() {
        // Atualiza o cooldown de criação
        if (this.createCooldown > 0) {
            this.createCooldown--;
        }
        
        // Atualiza o efeito de brilho
        this.glowAmount = Math.sin(Date.now() * this.glowSpeed) * 0.2 + 0.8;
        
        // Atualiza a cor base mais rapidamente
        this.baseHue = (this.baseHue + this.hueSpeed) % 360;

        // Atualiza as bolhas
        for (let i = 0; i < this.bubbles.length; i++) {
            const bubble = this.bubbles[i];
            
            // Física básica
            bubble.vy -= this.gravity;
            bubble.vx *= this.friction;
            bubble.vy *= this.friction;
            
            // Atualiza posição
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;
            
            // Colisão com as bordas
            if (bubble.x < bubble.size) {
                bubble.x = bubble.size;
                bubble.vx *= -this.bounciness;
                bubble.vx += (Math.random() - 0.5) * 0.5;
            }
            if (bubble.x > this.canvas.width - bubble.size) {
                bubble.x = this.canvas.width - bubble.size;
                bubble.vx *= -this.bounciness;
                bubble.vx += (Math.random() - 0.5) * 0.5;
            }
            if (bubble.y < bubble.size) {
                bubble.y = bubble.size;
                bubble.vy *= -this.bounciness;
                bubble.vy += (Math.random() - 0.5) * 0.5;
            }
            if (bubble.y > this.canvas.height - bubble.size) {
                bubble.y = this.canvas.height - bubble.size;
                bubble.vy *= -this.bounciness;
                bubble.vy += (Math.random() - 0.5) * 0.5;
                if (Math.abs(bubble.vy) < 2) {
                    bubble.vy -= 1 + Math.random();
                }
            }
            
            // Interação entre bolhas
            for (let j = i + 1; j < this.bubbles.length; j++) {
                const other = this.bubbles[j];
                const dx = other.x - bubble.x;
                const dy = other.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = (bubble.size + other.size);
                
                if (distance < minDist) {
                    const angle = Math.atan2(dy, dx);
                    const force = (minDist - distance) * 0.08;
                    
                    const repelX = Math.cos(angle) * force;
                    const repelY = Math.sin(angle) * force;
                    
                    bubble.vx -= repelX * this.repulsion;
                    bubble.vy -= repelY * this.repulsion;
                    other.vx += repelX * this.repulsion;
                    other.vy += repelY * this.repulsion;
                    
                    const randomForce = 0.3;
                    bubble.vx += (Math.random() - 0.5) * randomForce;
                    bubble.vy += (Math.random() - 0.5) * randomForce;
                    other.vx += (Math.random() - 0.5) * randomForce;
                    other.vy += (Math.random() - 0.5) * randomForce;
                }
            }
            
            // Envelhecimento
            bubble.age++;
            if (bubble.age > 600) {
                bubble.opacity = Math.max(0, bubble.opacity - 0.01);
            }
        }
        
        // Remove bolhas invisíveis
        this.bubbles = this.bubbles.filter(bubble => bubble.opacity > 0);
    }

    render() {
        // Limpa o canvas com um gradiente escuro
        const gradient = this.context.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenha as bolhas
        this.bubbles.forEach(bubble => {
            // Brilho externo
            const glow = this.context.createRadialGradient(
                bubble.x, bubble.y, 0,
                bubble.x, bubble.y, bubble.size * 1.5
            );
            glow.addColorStop(0, `hsla(${bubble.hue}, 70%, 60%, ${bubble.opacity * 0.3 * this.glowAmount})`);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.context.fillStyle = glow;
            this.context.beginPath();
            this.context.arc(bubble.x, bubble.y, bubble.size * 1.5, 0, Math.PI * 2);
            this.context.fill();
            
            // Bolha principal
            const bubbleGradient = this.context.createRadialGradient(
                bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.1,
                bubble.x, bubble.y, bubble.size
            );
            bubbleGradient.addColorStop(0, `hsla(${bubble.hue}, 70%, 80%, ${bubble.opacity})`);
            bubbleGradient.addColorStop(1, `hsla(${bubble.hue}, 70%, 60%, ${bubble.opacity})`);
            
            this.context.fillStyle = bubbleGradient;
            this.context.beginPath();
            this.context.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.context.fill();
            
            // Reflexo
            this.context.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.3})`;
            this.context.beginPath();
            this.context.arc(
                bubble.x - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                bubble.size * 0.2,
                0, Math.PI * 2
            );
            this.context.fill();
        });

        // Instruções
        this.context.font = 'bold 16px Arial';
        this.context.textAlign = 'center';
        
        // Contorno preto
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        // const message = `Clique e arraste para criar bolhas (${this.maxBubbles - this.bubbles.length} restantes)`;
        const message = `Clique e arraste para criar bolinhas`;
        this.context.strokeText(message, this.canvas.width / 2, 30);
        
        // Texto branco
        this.context.fillStyle = 'white';
        this.context.fillText(message, this.canvas.width / 2, 30);
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('BubbleFloat', BubbleFloat); 