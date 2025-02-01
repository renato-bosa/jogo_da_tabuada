class MemoryGame extends GameBase {
    constructor(containerId) {
        super(containerId);
        
        // Configurações do jogo
        this.gridSize = 4; // 4x4 = 16 cartas
        this.cardSize = 70;
        this.cardSpacing = 10;
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.canFlip = true;

        // Posiciona o grid no centro
        this.gridOffset = {
            x: (this.canvas.width - (this.gridSize * (this.cardSize + this.cardSpacing))) / 2,
            y: (this.canvas.height - (this.gridSize * (this.cardSize + this.cardSpacing))) / 2
        };

        this.initializeCards();
    }

    initializeCards() {
        // Usando letras e números simples
        const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const pairs = [...symbols, ...symbols];
        
        // Embaralha as cartas
        const shuffled = pairs.sort(() => Math.random() - 0.5);

        // Cria o grid de cartas
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const index = row * this.gridSize + col;
                this.cards.push({
                    x: this.gridOffset.x + col * (this.cardSize + this.cardSpacing),
                    y: this.gridOffset.y + row * (this.cardSize + this.cardSpacing),
                    symbol: shuffled[index],
                    isFlipped: false,
                    isMatched: false
                });
            }
        }
    }

    handleInput(type, event) {
        if (type === 'down' && this.canFlip) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Verifica se clicou em alguma carta
            const clickedCard = this.cards.find(card => 
                x >= card.x && x <= card.x + this.cardSize &&
                y >= card.y && y <= card.y + this.cardSize &&
                !card.isFlipped && !card.isMatched
            );

            if (clickedCard && this.selectedCards.length < 2) {
                clickedCard.isFlipped = true;
                this.selectedCards.push(clickedCard);

                if (this.selectedCards.length === 2) {
                    this.moves++;
                    this.canFlip = false;
                    setTimeout(() => this.checkMatch(), 1000);
                }
            }
        }
    }

    checkMatch() {
        const [card1, card2] = this.selectedCards;
        
        if (card1.symbol === card2.symbol) {
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;

            if (this.matchedPairs === 8) {
                setTimeout(() => {
                    alert(`Parabéns! Você completou em ${this.moves} jogadas!`);
                    this.reset();
                }, 500);
            }
        } else {
            card1.isFlipped = false;
            card2.isFlipped = false;
        }

        this.selectedCards = [];
        this.canFlip = true;
    }

    reset() {
        this.cards = [];
        this.selectedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.canFlip = true;
        this.initializeCards();
    }

    render() {
        // Limpa o canvas
        this.context.fillStyle = '#f0f0f0';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenha as cartas
        this.cards.forEach(card => {
            this.context.fillStyle = card.isMatched ? '#90EE90' : '#2196F3';
            this.context.fillRect(card.x, card.y, this.cardSize, this.cardSize);
            
            if (card.isFlipped || card.isMatched) {
                this.context.fillStyle = '#ffffff';
                this.context.font = 'bold 40px Arial';
                this.context.textAlign = 'center';
                this.context.textBaseline = 'middle';
                this.context.fillText(
                    card.symbol,
                    card.x + this.cardSize / 2,
                    card.y + this.cardSize / 2
                );
            }
        });

        // Desenha o contador de jogadas
        this.context.fillStyle = '#000';
        this.context.font = '20px Arial';
        this.context.textAlign = 'left';
        this.context.fillText(`Jogadas: ${this.moves}`, 10, 30);
    }

    update() {
        // Não é necessário atualização contínua neste jogo
    }
}

// Registra o jogo no GameManager
window.gameManager.registerGame('MemoryGame', MemoryGame); 