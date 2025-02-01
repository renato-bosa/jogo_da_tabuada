class GameManager {
    constructor() {
        this.games = new Map();
    }

    registerGame(name, GameClass) {
        this.games.set(name, GameClass);
    }

    createGame(name, containerId) {
        if (!this.games.has(name)) {
            throw new Error(`Jogo "${name}" não encontrado!`);
        }

        const GameClass = this.games.get(name);
        return new GameClass(containerId);
    }
}

// Cria uma instância global do GameManager
window.gameManager = new GameManager(); 