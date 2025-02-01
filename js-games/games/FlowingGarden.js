class FlowingGarden extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações das flores
        this.flowers = [];
        this.maxFlowers = 100;
        this.flowerTypes = [
            { name: 'dandelion', petals: 12, size: 15 },
            { name: 'daisy', petals: 8, size: 20 },
            { name: 'sunflower', petals: 16, size: 25 }
        ];
        
        // Controle de plantio
        this.plantCooldown = 0;
        this.plantInterval = 5; // Frames entre cada flor plantada
        
        // Configurações de movimento
        this.windForce = 0;
        this.windAngle = 0;
        this.windSpeed = 0.02;
        this.swayAmount = 0.3;
        
        // Configurações visuais
        this.groundLevel = this.canvas.height - 50;
        this.grassBlades = this.createGrass();
        this.mountains = this.createMountains();
        this.clouds = this.createClouds();
        
        // Paralaxe
        this.cloudSpeed = 0.1;
        
        // Estado do jogo
        this.selectedFlowerType = 0;
        this.plantingMode = false;
        this.lastPlantX = null;
        this.lastPlantY = null;
    }

    createGrass() {
        const grass = [];
        for (let x = 0; x < this.canvas.width; x += 3) {
            grass.push({
                x: x,
                height: 20 + Math.random() * 15,
                swayOffset: Math.random() * Math.PI * 2,
                color: `hsl(${100 + Math.random() * 40}, 80%, ${30 + Math.random() * 20}%)`
            });
        }
        return grass;
    }

    createMountains() {
        const mountains = [];
        // Três camadas de montanhas com diferentes alturas e cores
        [
            { height: 120, color: '#2B4162', offset: 0 },    // Montanhas distantes (escuras)
            { height: 100, color: '#385780', offset: 50 },   // Montanhas do meio
            { height: 80, color: '#4B6F9E', offset: 100 }    // Montanhas frontais (claras)
        ].forEach(layer => {
            const points = [];
            let x = -50; // Começa fora da tela
            while (x < this.canvas.width + 50) {
                points.push({
                    x: x,
                    y: this.groundLevel - Math.random() * layer.height - layer.offset
                });
                x += 30 + Math.random() * 40;
            }
            mountains.push({ points, color: layer.color });
        });
        return mountains;
    }

    createClouds() {
        const clouds = [];
        for (let i = 0; i < 8; i++) {
            clouds.push({
                x: Math.random() * this.canvas.width,
                y: 30 + Math.random() * (this.groundLevel * 0.4),
                width: 40 + Math.random() * 60,
                height: 20 + Math.random() * 30,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.5 + Math.random() * 0.3
            });
        }
        return clouds;
    }

    handleInput(type, event) {
        if (!event) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (type === 'down') {
            if (this.flowers.length < this.maxFlowers) {
                this.plantingMode = true;
                this.plantFlower(x, y);
                this.lastPlantX = x;
                this.lastPlantY = y;
            }
        } else if (type === 'move' && this.plantingMode) {
            if (this.flowers.length < this.maxFlowers) {
                // Calcula a distância desde a última flor plantada
                const dx = x - this.lastPlantX;
                const dy = y - this.lastPlantY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Só planta se estiver longe o suficiente da última flor
                if (distance > 20 && this.plantCooldown <= 0) {
                    this.plantFlower(x, y);
                    this.lastPlantX = x;
                    this.lastPlantY = y;
                    this.plantCooldown = this.plantInterval;
                }
            }
        } else if (type === 'up') {
            this.plantingMode = false;
            this.lastPlantX = null;
            this.lastPlantY = null;
        }
    }

    handleKeyboard(event) {
        if (event.type === 'keydown') {
            if (event.key >= '1' && event.key <= '3') {
                this.selectedFlowerType = parseInt(event.key) - 1;
            }
        }
    }

    plantFlower(x, y) {
        const type = this.flowerTypes[this.selectedFlowerType];
        const hue = Math.random() * 360;
        
        // Limita a posição Y ao chão
        const plantY = Math.min(y, this.canvas.height - 10);
        
        this.flowers.push({
            x: x,
            y: plantY,
            type: type,
            stemHeight: this.groundLevel - plantY,
            hue: hue,
            swayOffset: Math.random() * Math.PI * 2,
            age: 0,
            scale: plantY > this.groundLevel ? 0.7 : 0,
            sizeMultiplier: plantY > this.groundLevel ? 0.8 : 1
        });
    }

    update() {
        // Atualiza o vento
        this.windAngle += this.windSpeed;
        this.windForce = Math.sin(this.windAngle) * this.swayAmount;

        // Atualiza o cooldown de plantio
        if (this.plantCooldown > 0) {
            this.plantCooldown--;
        }

        // Atualiza as flores
        this.flowers.forEach(flower => {
            flower.age++;
            flower.scale = Math.min(1, flower.age / 30); // Animação de crescimento
        });

        // Remove flores antigas se exceder o limite
        if (this.flowers.length > this.maxFlowers) {
            this.flowers = this.flowers.slice(-this.maxFlowers);
        }

        // Atualiza posição das nuvens
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * this.cloudSpeed;
            if (cloud.x > this.canvas.width + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = 30 + Math.random() * (this.groundLevel * 0.4);
            }
        });
    }

    render() {
        // Desenha o céu com gradiente mais complexo
        const skyGradient = this.context.createLinearGradient(0, 0, 0, this.groundLevel);
        skyGradient.addColorStop(0, '#1B2845');     // Azul escuro no topo
        skyGradient.addColorStop(0.4, '#3A6291');   // Azul médio
        skyGradient.addColorStop(0.8, '#7BA4D9');   // Azul claro
        skyGradient.addColorStop(1, '#B4D7FF');     // Quase branco no horizonte
        this.context.fillStyle = skyGradient;
        this.context.fillRect(0, 0, this.canvas.width, this.groundLevel);

        // Desenha as nuvens
        this.clouds.forEach(cloud => {
            this.context.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            this.context.beginPath();
            this.context.ellipse(
                cloud.x, cloud.y,
                cloud.width, cloud.height,
                0, 0, Math.PI * 2
            );
            this.context.fill();
            // Adiciona detalhes à nuvem
            this.context.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * 0.7})`;
            this.context.beginPath();
            this.context.ellipse(
                cloud.x + cloud.width * 0.2, cloud.y - cloud.height * 0.1,
                cloud.width * 0.6, cloud.height * 0.6,
                0, 0, Math.PI * 2
            );
            this.context.fill();
        });

        // Desenha as montanhas
        this.mountains.forEach(mountain => {
            this.context.fillStyle = mountain.color;
            this.context.beginPath();
            this.context.moveTo(mountain.points[0].x, this.canvas.height);
            mountain.points.forEach((point, index) => {
                if (index === 0) {
                    this.context.moveTo(point.x, point.y);
                } else {
                    const xc = (point.x + mountain.points[index - 1].x) / 2;
                    const yc = (point.y + mountain.points[index - 1].y) / 2;
                    this.context.quadraticCurveTo(
                        mountain.points[index - 1].x, mountain.points[index - 1].y,
                        xc, yc
                    );
                }
            });
            this.context.lineTo(this.canvas.width, this.canvas.height);
            this.context.fill();
        });

        // Desenha o solo com gradiente mais rico
        const groundGradient = this.context.createLinearGradient(0, this.groundLevel, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8FBC8F');    // Verde mais claro no topo
        groundGradient.addColorStop(0.3, '#5F9F5F');  // Verde médio
        groundGradient.addColorStop(1, '#2E4E2E');    // Verde escuro embaixo
        this.context.fillStyle = groundGradient;
        this.context.fillRect(0, this.groundLevel, this.canvas.width, this.canvas.height - this.groundLevel);

        // Desenha a grama
        this.grassBlades.forEach(blade => {
            const sway = Math.sin(this.windAngle + blade.swayOffset) * this.windForce * blade.height;
            
            this.context.beginPath();
            this.context.moveTo(blade.x, this.groundLevel);
            this.context.quadraticCurveTo(
                blade.x + sway / 2, this.groundLevel - blade.height / 2,
                blade.x + sway, this.groundLevel - blade.height
            );
            this.context.strokeStyle = blade.color;
            this.context.lineWidth = 1.5;
            this.context.stroke();
        });

        // Desenha as flores
        this.flowers.forEach(flower => {
            const sway = Math.sin(this.windAngle + flower.swayOffset) * this.windForce * flower.stemHeight;
            
            // Desenha o caule apenas se a flor estiver acima do solo
            if (flower.y <= this.groundLevel) {
                this.context.beginPath();
                this.context.moveTo(flower.x, this.groundLevel);
                this.context.quadraticCurveTo(
                    flower.x + sway / 2, flower.y + flower.stemHeight / 2,
                    flower.x + sway, flower.y
                );
                this.context.strokeStyle = '#50C878';
                this.context.lineWidth = 2;
                this.context.stroke();
            }

            // Desenha a flor
            const flowerX = flower.x + sway;
            const flowerY = flower.y;
            const size = flower.type.size * flower.scale * flower.sizeMultiplier;
            
            for (let i = 0; i < flower.type.petals; i++) {
                const angle = (i / flower.type.petals) * Math.PI * 2;
                const petalX = flowerX + Math.cos(angle) * size;
                const petalY = flowerY + Math.sin(angle) * size;
                
                this.context.beginPath();
                this.context.moveTo(flowerX, flowerY);
                this.context.quadraticCurveTo(
                    flowerX + Math.cos(angle) * size * 0.7,
                    flowerY + Math.sin(angle) * size * 0.7,
                    petalX, petalY
                );
                this.context.strokeStyle = `hsla(${flower.hue}, 80%, 70%, 0.8)`;
                this.context.lineWidth = 3;
                this.context.stroke();
            }

            // Centro da flor
            this.context.beginPath();
            this.context.arc(flowerX, flowerY, size * 0.2, 0, Math.PI * 2);
            this.context.fillStyle = `hsla(${(flower.hue + 30) % 360}, 80%, 40%, 0.8)`;
            this.context.fill();
        });

        // Instruções
        this.context.font = 'bold 16px Arial';
        this.context.textAlign = 'center';
        
        // Adiciona contorno preto
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;
        const message = `Voc\u00EA tem ${this.maxFlowers - this.flowers.length} flores para plantar, divirta-se!`;
        this.context.strokeText(message, this.canvas.width / 2, 30);
        
        // Texto em branco por cima
        this.context.fillStyle = 'white';
        this.context.fillText(message, this.canvas.width / 2, 30);
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('FlowingGarden', FlowingGarden); 