class RainbowRipples extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações das ondas
        this.ripples = [];
        this.maxRipples = 8;
        
        // Configurações visuais
        this.baseHue = Math.random() * 360;
        this.hueSpeed = 0.5;
        this.hueRange = 60;
        
        // Configurações de física
        this.expansionSpeed = 1;
        this.maxRadius = 200;
        this.waveThickness = 4;
        this.fadeSpeed = 0.008;
        this.glowIntensity = 15;
        this.innerGlowSize = 0.3;  // Tamanho do brilho interno como fração do raio
        
        // Configurações de textura
        this.noiseScale = 30;    // Escala do ruído
        this.noiseAmount = 0.15; // Intensidade do ruído
        this.noiseData = this.generateNoise(256); // Textura de ruído pré-computada
        
        // Controle de criação
        this.createCooldown = 0;
        this.createInterval = 12;  // Frames entre cada onda (assumindo 60fps, isso dá ~200ms)
        this.lastCreateTime = 0;
        this.resetSpacingDelay = 250;
        this.minDistance = 80;     // Aumentei um pouco a distância mínima também
        this.lastCreateX = null;
        this.lastCreateY = null;
        
        // Estado do mouse
        this.mouseDown = false;
        
        // Efeito de água
        this.waterLevel = this.canvas.height * 0.98;
        this.waterColor = '#1a3c6e';
        this.reflectionOpacity = 0.3;
    }

    generateNoise(size) {
        const noise = new Array(size * size);
        for (let i = 0; i < noise.length; i++) {
            noise[i] = Math.random();
        }
        return noise;
    }
    
    getNoise(x, y) {
        x = Math.floor(Math.abs(x * this.noiseScale)) % 256;
        y = Math.floor(Math.abs(y * this.noiseScale)) % 256;
        return this.noiseData[(y * 256 + x) % this.noiseData.length];
    }

    handleInput(type, event) {
        if (!event) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (type === 'down') {
            this.mouseDown = true;
            this.createRipple(x, y);
        } else if (type === 'up') {
            this.mouseDown = false;
        } else if (type === 'move' && this.mouseDown) {
            this.createRipple(x, y);
        }
    }

    createRipple(x, y) {
        const currentTime = Date.now();
        if (this.ripples.length >= this.maxRipples || 
            this.createCooldown > 0 || 
            currentTime - this.lastCreateTime < 200) return;
        
        if (currentTime - this.lastCreateTime > this.resetSpacingDelay) {
            this.lastCreateX = null;
            this.lastCreateY = null;
        }
        
        if (this.lastCreateX !== null) {
            const dx = x - this.lastCreateX;
            const dy = y - this.lastCreateY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.minDistance) return;
        }

        const hue = (this.baseHue + Math.random() * this.hueRange) % 360;
        
        this.ripples.push({
            x: x,
            y: y,
            radius: 5,
            hue: hue,
            opacity: 1,
            phase: 0,
            amplitude: 8 + Math.random() * 4,
            noiseOffset: Math.random() * 1000 // Offset único para cada onda
        });
        
        this.createCooldown = this.createInterval;
        this.lastCreateX = x;
        this.lastCreateY = y;
        this.lastCreateTime = currentTime;
    }

    update() {
        if (this.createCooldown > 0) {
            this.createCooldown--;
        }
        
        this.baseHue = (this.baseHue + this.hueSpeed) % 360;
        
        // Atualiza as ondas
        this.ripples.forEach(ripple => {
            ripple.radius += this.expansionSpeed;
            ripple.phase += 0.1;
            ripple.opacity = Math.max(0, 1 - Math.pow(ripple.radius / this.maxRadius, 2));
        });
        
        // Remove ondas invisíveis
        this.ripples = this.ripples.filter(ripple => ripple.opacity > 0);
    }

    render() {
        // Fundo gradiente
        const skyGradient = this.context.createLinearGradient(0, 0, 0, this.waterLevel);
        skyGradient.addColorStop(0, '#001b3a');
        skyGradient.addColorStop(1, '#0a4fa8');
        this.context.fillStyle = skyGradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Água
        const waterGradient = this.context.createLinearGradient(0, this.waterLevel, 0, this.canvas.height);
        waterGradient.addColorStop(0, this.waterColor);
        waterGradient.addColorStop(1, '#102844');
        this.context.fillStyle = waterGradient;
        this.context.fillRect(0, this.waterLevel, this.canvas.width, this.canvas.height - this.waterLevel);

        // Desenha as ondas
        this.ripples.forEach(ripple => {
            // Camada de brilho externo
            this.context.beginPath();
            const glowGradient = this.context.createRadialGradient(
                ripple.x, ripple.y, ripple.radius * 0.8,
                ripple.x, ripple.y, ripple.radius + this.glowIntensity
            );
            glowGradient.addColorStop(0, `hsla(${ripple.hue}, 70%, 60%, 0)`);
            glowGradient.addColorStop(0.5, `hsla(${ripple.hue}, 70%, 60%, ${ripple.opacity * 0.2})`);
            glowGradient.addColorStop(1, `hsla(${ripple.hue}, 70%, 60%, 0)`);
            
            this.context.fillStyle = glowGradient;
            this.context.arc(ripple.x, ripple.y, ripple.radius + this.glowIntensity, 0, Math.PI * 2);
            this.context.fill();

            // Onda principal
            this.context.beginPath();
            
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const waveOffset = Math.sin(angle * 6 + ripple.phase) * ripple.amplitude;
                const r = ripple.radius + waveOffset;
                const x = ripple.x + Math.cos(angle) * r;
                const y = ripple.y + Math.sin(angle) * r;
                
                // Adiciona ruído à forma
                const noise = this.getNoise(x + ripple.noiseOffset, y + ripple.noiseOffset);
                const noiseOffset = (noise - 0.5) * this.noiseAmount * ripple.radius;
                const finalX = x + Math.cos(angle) * noiseOffset;
                const finalY = y + Math.sin(angle) * noiseOffset;
                
                if (angle === 0) {
                    this.context.moveTo(finalX, finalY);
                } else {
                    this.context.lineTo(finalX, finalY);
                }
            }
            
            this.context.closePath();
            
            // Gradiente com textura
            const waveGradient = this.context.createRadialGradient(
                ripple.x, ripple.y, ripple.radius * (1 - this.innerGlowSize),
                ripple.x, ripple.y, ripple.radius + ripple.amplitude
            );
            waveGradient.addColorStop(0, `hsla(${ripple.hue}, 85%, 75%, ${ripple.opacity * 0.7})`);
            waveGradient.addColorStop(0.5, `hsla(${ripple.hue}, 80%, 65%, ${ripple.opacity * 0.5})`);
            waveGradient.addColorStop(0.8, `hsla(${ripple.hue}, 75%, 55%, ${ripple.opacity * 0.3})`);
            waveGradient.addColorStop(1, `hsla(${ripple.hue}, 70%, 45%, ${ripple.opacity * 0.1})`);
            
            this.context.fillStyle = waveGradient;
            this.context.shadowColor = `hsla(${ripple.hue}, 70%, 50%, ${ripple.opacity})`;
            this.context.shadowBlur = 10;
            this.context.fill();
            
            // Adiciona um contorno suave
            this.context.strokeStyle = `hsla(${ripple.hue}, 70%, 70%, ${ripple.opacity * 0.5})`;
            this.context.lineWidth = 2;
            this.context.stroke();
            this.context.shadowBlur = 0;

            // Reflexo na água
            if (ripple.y < this.waterLevel) {
                const reflectionY = this.waterLevel + (this.waterLevel - ripple.y);
                this.context.beginPath();
                
                for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                    const waveOffset = Math.sin(angle * 6 + ripple.phase) * ripple.amplitude;
                    const r = ripple.radius + waveOffset;
                    const x = ripple.x + Math.cos(angle) * r;
                    const y = reflectionY + Math.sin(angle) * r;
                    
                    if (angle === 0) {
                        this.context.moveTo(x, y);
                    } else {
                        this.context.lineTo(x, y);
                    }
                }
                
                this.context.closePath();
                
                // Gradiente para o reflexo
                const reflectionGradient = this.context.createRadialGradient(
                    ripple.x, reflectionY, ripple.radius * (1 - this.innerGlowSize),
                    ripple.x, reflectionY, ripple.radius + ripple.amplitude
                );
                reflectionGradient.addColorStop(0, `hsla(${ripple.hue}, 70%, 80%, ${ripple.opacity * this.reflectionOpacity * 0.4})`);
                reflectionGradient.addColorStop(0.7, `hsla(${ripple.hue}, 70%, 60%, ${ripple.opacity * this.reflectionOpacity * 0.2})`);
                reflectionGradient.addColorStop(1, `hsla(${ripple.hue}, 70%, 40%, ${ripple.opacity * this.reflectionOpacity * 0.05})`);
                
                this.context.fillStyle = reflectionGradient;
                this.context.fill();
                
                // Contorno suave para o reflexo
                this.context.strokeStyle = `hsla(${ripple.hue}, 70%, 70%, ${ripple.opacity * this.reflectionOpacity * 0.3})`;
                this.context.lineWidth = 1;
                this.context.stroke();
            }
        });

        // Instruções
        this.context.font = 'bold 16px Arial';
        this.context.textAlign = 'center';
        
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        const message = `Clique para criar formas (${this.maxRipples - this.ripples.length} restantes)`;
        this.context.strokeText(message, this.canvas.width / 2, 30);
        
        this.context.fillStyle = 'white';
        this.context.fillText(message, this.canvas.width / 2, 30);
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('RainbowRipples', RainbowRipples); 