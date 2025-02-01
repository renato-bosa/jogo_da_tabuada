class StarryNight extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações das estrelas
        this.stars = [];
        this.maxStars = 100;
        this.minSize = 1;
        this.maxSize = 3;
        this.selectedStar = null;
        this.hoveredStar = null;
        this.connections = [];
        this.currentConstellation = [];
        this.maxConstellations = 5;
        this.dissolvingConnections = [];
        
        // Configurações visuais
        this.starRadius = 2;
        this.glowRadius = 20;
        this.magnetRadius = 40;  // Restaura a área de atração original
        
        // Configurações de movimento
        this.rotationSpeed = 0.000025;
        this.spiralForce = 0.05;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.attractionStrength = 0;
        this.minDistance = 50;
        this.randomness = 0.00015;  // Intensidade do movimento aleatório
        this.maxRandomSpeed = 0.2;  // Velocidade máxima do movimento aleatório
        
        // Cor atual da constelação
        this.currentHue = Math.random() * 360;
        
        // Velocidades
        this.starSpeed = 0.2;
        this.glowSpeed = 0.02;
        this.glowAmount = 0;
        
        // Estado do mouse
        this.mouseX = this.centerX;
        this.mouseY = this.centerY;
        
        // Configurações da aurora
        this.auroraPoints = [];
        this.numAuroraWaves = 3;
        this.auroraColors = [
            'rgba(0, 255, 130, 0.15)',  // Verde esmeralda
            'rgba(100, 220, 255, 0.12)', // Azul claro
            'rgba(150, 100, 255, 0.1)',   // Roxo
            'rgba(255, 100, 0, 0.1)'      // Laranja
        ];
        this.initAurora();
        
        // Inicialização
        this.createStars();
    }

    createStars() {
        for (let i = 0; i < this.maxStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.starSpeed,
                vy: (Math.random() - 0.5) * this.starSpeed,
                brightness: 0.3 + Math.random() * 0.7
            });
        }
    }

    handleInput(type, event) {
        if (event) {
            const rect = this.canvas.getBoundingClientRect();
            this.currentMouseX = event.clientX - rect.left;
            this.currentMouseY = event.clientY - rect.top;
            
            if (!this.isDragging) {
                this.hoveredStar = this.findNearestStar(this.currentMouseX, this.currentMouseY, this.magnetRadius);
            }
        }

        if (type === 'down') {
            this.isDragging = true;
            const clickedStar = this.findNearestStar(this.currentMouseX, this.currentMouseY, this.magnetRadius);
            
            if (clickedStar) {
                if (this.currentConstellation.length === 0) {
                    this.selectedStar = clickedStar;
                    this.currentConstellation.push(clickedStar);
                    this.currentHue = (this.currentHue + 137.5) % 360;
                } else if (clickedStar === this.currentConstellation[0] && this.currentConstellation.length > 2) {
                    this.completeConstellation();
                }
            }
        } else if (type === 'up') {
            this.isDragging = false;
            
            if (this.selectedStar && this.hoveredStar && 
                this.hoveredStar !== this.currentConstellation[this.currentConstellation.length - 1]) {
                
                if (!this.currentConstellation.includes(this.hoveredStar)) {
                    this.currentConstellation.push(this.hoveredStar);
                    this.createConnection(
                        this.currentConstellation[this.currentConstellation.length - 2],
                        this.hoveredStar,
                        this.currentHue
                    );

                    // Se acabamos de adicionar o quarto ponto, fecha automaticamente com o primeiro
                    if (this.currentConstellation.length === 4) {
                        this.createConnection(
                            this.hoveredStar,
                            this.currentConstellation[0],
                            this.currentHue
                        );
                        this.completeConstellation();
                    }
                }
            }
        }
    }

    findNearestStar(x, y, maxDist) {
        let nearest = null;
        let minDist = maxDist || Infinity;

        this.stars.forEach(star => {
            const dist = Math.hypot(star.x - x, star.y - y);
            if (dist < minDist) {
                minDist = dist;
                nearest = star;
            }
        });

        return nearest;
    }

    createConnection(star1, star2, hue) {
        this.connections.push({
            star1: star1,
            star2: star2,
            hue: hue,
            opacity: 0.8,
            timestamp: Date.now(),
            duration: 25000,  // 25 segundos
            width: 2,
            blur: 10,
            noise: 2,
            maxWidth: 4,
            maxBlur: 25,
            maxNoise: 7
        });
    }

    completeConstellation() {
        // Fecha o ciclo conectando a última estrela com a primeira
        this.createConnection(
            this.currentConstellation[this.currentConstellation.length - 1],
            this.currentConstellation[0],
            this.currentHue
        );

        // Verifica se precisamos dissolver a constelação mais antiga
        let constellationCount = 0;
        let lastTimestamp = Infinity;
        let firstConstellationStart = -1;
        let firstConstellationEnd = -1;
        
        // Encontra a primeira constelação (mais antiga)
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].timestamp < lastTimestamp) {
                lastTimestamp = this.connections[i].timestamp;
                firstConstellationStart = i;
            }
            
            // Conta quantas constelações completas temos
            if (i > 0 && this.connections[i].timestamp - this.connections[i-1].timestamp > 1000) {
                constellationCount++;
                if (firstConstellationEnd === -1 && firstConstellationStart !== -1) {
                    firstConstellationEnd = i;
                }
            }
        }
        if (firstConstellationEnd === -1) firstConstellationEnd = this.connections.length;
        
        // Se excedemos o limite, move a constelação mais antiga para dissolução
        if (constellationCount >= this.maxConstellations) {
            const oldConnections = this.connections.splice(firstConstellationStart, firstConstellationEnd - firstConstellationStart);
            this.dissolvingConnections.push(...oldConnections);
        }

        // Limpa a constelação atual
        this.currentConstellation = [];
        this.selectedStar = null;
    }

    initAurora() {
        for (let i = 0; i < this.numAuroraWaves; i++) {
            const points = [];
            const numPoints = 5;
            const height = this.canvas.height;
            
            for (let j = 0; j <= numPoints; j++) {
                points.push({
                    x: (this.canvas.width * j) / numPoints,
                    y: height * 0.2 + Math.random() * height * 0.2,
                    baseY: height * 0.2 + Math.random() * height * 0.2,
                    speed: 0.0002 + Math.random() * 0.0003,
                    offset: Math.random() * Math.PI * 2
                });
            }
            
            this.auroraPoints.push(points);
        }
    }

    update() {
        // Atualiza cada estrela
        this.stars.forEach(star => {
            // Movimento aleatório
            star.vx = (star.vx || 0) + (Math.random() - 0.5) * this.randomness;
            star.vy = (star.vy || 0) + (Math.random() - 0.5) * this.randomness;
            
            // Limita a velocidade máxima do movimento aleatório
            star.vx = Math.max(-this.maxRandomSpeed, Math.min(this.maxRandomSpeed, star.vx));
            star.vy = Math.max(-this.maxRandomSpeed, Math.min(this.maxRandomSpeed, star.vy));
            
            // Rotação ao redor do centro
            const dx = star.x - this.centerX;
            const dy = star.y - this.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calcula o novo ângulo
            const angle = Math.atan2(dy, dx) + this.rotationSpeed * distance;
            
            // Combina rotação com movimento aleatório
            const targetX = this.centerX + Math.cos(angle) * distance;
            const targetY = this.centerY + Math.sin(angle) * distance;
            
            star.x += (targetX - star.x) * 0.1 + star.vx;
            star.y += (targetY - star.y) * 0.1 + star.vy;
            
            // Amortece o movimento aleatório
            star.vx *= 0.99;
            star.vy *= 0.99;
            
            // Mantém as estrelas dentro dos limites
            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;
        });

        // Atualiza a opacidade das conexões baseado no tempo de vida
        const currentTime = Date.now();
        for (let i = this.connections.length - 1; i >= 0; i--) {
            const conn = this.connections[i];
            const age = currentTime - conn.timestamp;
            
            if (age >= conn.duration) {
                // Move para as conexões em dissolução quando atinge o tempo máximo
                this.dissolvingConnections.push(...this.connections.splice(i, i + 1));
            } else if (age > conn.duration * 0.5) {
                const progress = (age - conn.duration * 0.5) / (conn.duration * 0.5);
                const remainingTime = conn.duration - age;
                
                conn.opacity = 0.8 * (remainingTime / (conn.duration * 0.5));
                conn.width = Math.min(2 + progress * 3, conn.maxWidth);
                conn.blur = Math.min(10 + progress * 15, conn.maxBlur);
                conn.noise = Math.min(2 + progress * 13, conn.maxNoise);
            }
        }

        // Atualiza as conexões em dissolução
        for (let i = this.dissolvingConnections.length - 1; i >= 0; i--) {
            const conn = this.dissolvingConnections[i];
            conn.opacity -= 0.05;  // Dissolução final mais rápida
            conn.width = Math.min(conn.width + 0.2, conn.maxWidth);
            conn.blur = Math.min(conn.blur + 0.5, conn.maxBlur);
            conn.noise = Math.min(conn.noise + 0.4, conn.maxNoise);
            
            // Remove quando ficar completamente transparente
            if (conn.opacity <= 0) {
                this.dissolvingConnections.splice(i, 1);
            }
        }

        // Efeito de brilho pulsante
        this.glowAmount = Math.sin(Date.now() * this.glowSpeed) * 0.2 + 0.8;

        // Atualiza a aurora
        this.auroraPoints.forEach(points => {
            points.forEach(point => {
                point.y = point.baseY + 
                    Math.sin(currentTime * point.speed + point.offset) * 50;
            });
        });
    }

    render() {
        // Limpa o canvas com fundo escuro
        this.context.fillStyle = '#000408';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Função auxiliar para desenhar uma conexão com ruído
        const drawNoisyConnection = (conn) => {
            this.context.beginPath();
            
            if (conn.noise > 0) {
                // Desenha múltiplos segmentos com pequenos desvios
                const segments = 12;
                let lastX = conn.star1.x;
                let lastY = conn.star1.y;
                
                for (let i = 1; i <= segments; i++) {
                    const t = i / segments;
                    const baseX = conn.star1.x + (conn.star2.x - conn.star1.x) * t;
                    const baseY = conn.star1.y + (conn.star2.y - conn.star1.y) * t;
                    
                    // Adiciona ruído à posição
                    const angle = Math.random() * Math.PI * 2;
                    const noise = Math.random() * conn.noise;
                    const x = baseX + Math.cos(angle) * noise;
                    const y = baseY + Math.sin(angle) * noise;
                    
                    if (i === 1) this.context.moveTo(lastX, lastY);
                    this.context.lineTo(x, y);
                    lastX = x;
                    lastY = y;
                }
                this.context.lineTo(conn.star2.x, conn.star2.y);
            } else {
                // Desenho normal para conexões sem ruído
                this.context.moveTo(conn.star1.x, conn.star1.y);
                this.context.lineTo(conn.star2.x, conn.star2.y);
            }
            
            this.context.strokeStyle = `hsla(${conn.hue}, 80%, 70%, ${conn.opacity})`;
            this.context.lineWidth = conn.width;
            this.context.shadowColor = 'rgba(135, 206, 235, 0.5)';
            this.context.shadowBlur = conn.blur;
            this.context.stroke();
            this.context.shadowBlur = 0;
        };

        // Desenha as conexões
        this.connections.forEach(drawNoisyConnection);

        // Desenha as conexões em dissolução
        this.dissolvingConnections.forEach(drawNoisyConnection);

        // Desenha as estrelas
        this.stars.forEach(star => {
            // Brilho externo
            const gradient = this.context.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, this.glowRadius
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.2 * star.brightness * this.glowAmount})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.context.fillStyle = gradient;
            this.context.beginPath();
            this.context.arc(star.x, star.y, this.glowRadius, 0, Math.PI * 2);
            this.context.fill();

            // Estrela central
            this.context.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            this.context.beginPath();
            this.context.arc(star.x, star.y, this.starRadius, 0, Math.PI * 2);
            this.context.fill();
        });

        // Desenha linha de conexão atual
        if (this.selectedStar && this.currentConstellation.length > 0) {
            const lastStar = this.currentConstellation[this.currentConstellation.length - 1];
            this.context.beginPath();
            this.context.moveTo(lastStar.x, lastStar.y);
            
            const isValidConnection = this.hoveredStar && 
                !this.currentConstellation.includes(this.hoveredStar);
            
            const endX = (isValidConnection && this.hoveredStar) ? this.hoveredStar.x : this.currentMouseX;
            const endY = (isValidConnection && this.hoveredStar) ? this.hoveredStar.y : this.currentMouseY;
            
            this.context.lineTo(endX || lastStar.x, endY || lastStar.y);
            
            this.context.strokeStyle = isValidConnection ? 
                'rgba(135, 206, 235, 0.9)' : 
                'rgba(135, 206, 235, 0.6)';
            this.context.lineWidth = 2;
            this.context.shadowColor = 'rgba(135, 206, 235, 0.5)';
            this.context.shadowBlur = 10;
            this.context.stroke();
            this.context.shadowBlur = 0;
            
            // Destaca a estrela sob o mouse
            if (this.hoveredStar && this.hoveredStar !== this.selectedStar) {
                this.context.beginPath();
                this.context.arc(this.hoveredStar.x, this.hoveredStar.y, 
                               this.starRadius * 2, 0, Math.PI * 2);
                this.context.fillStyle = 'rgba(135, 206, 235, 0.6)';
                this.context.fill();
            }
        }

        // Mensagem suave
        this.context.font = 'bold 16px Arial';
        this.context.textAlign = 'center';
        
        // Contorno preto
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        const message = 'Brinque de conectar as estrelas...';
        this.context.strokeText(message, this.canvas.width / 2, 30);
        
        // Texto branco
        this.context.fillStyle = 'white';
        this.context.fillText(message, this.canvas.width / 2, 30);

        // Desenha a aurora
        this.auroraPoints.forEach((points, index) => {
            this.context.beginPath();
            
            // Começa do canto inferior esquerdo
            this.context.moveTo(0, this.canvas.height);
            
            // Primeira curva para suavizar a transição
            this.context.lineTo(0, points[0].y);
            
            // Desenha curvas suaves entre os pontos
            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                this.context.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            
            // Última curva
            const last = points[points.length - 1];
            this.context.lineTo(this.canvas.width, last.y);
            
            // Fecha o caminho até o fundo
            this.context.lineTo(this.canvas.width, this.canvas.height);
            
            // Cria gradiente
            const gradient = this.context.createLinearGradient(
                0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, this.auroraColors[index]);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.context.fillStyle = gradient;
            this.context.fill();
        });
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('StarryNight', StarryNight); 