export class SimonEngine {
  sequence: number[] = [];
  playerIndex = 0;
  isPlayerTurn = false;
  isGameOver = false;
  score = 0;
  bestScore: number;

  constructor() {
    this.bestScore = parseInt(localStorage.getItem('goupil-simon-best') ?? '0');
  }

  reset() {
    this.sequence = [];
    this.playerIndex = 0;
    this.isPlayerTurn = false;
    this.isGameOver = false;
    this.score = 0;
  }

  addToSequence(): number {
    const next = Math.floor(Math.random() * 4);
    this.sequence.push(next);
    this.playerIndex = 0;
    this.isPlayerTurn = false;
    return next;
  }

  startPlayerTurn() {
    this.playerIndex = 0;
    this.isPlayerTurn = true;
  }

  checkInput(buttonIndex: number): 'correct' | 'wrong' | 'complete' {
    if (buttonIndex !== this.sequence[this.playerIndex]) {
      this.isGameOver = true;
      this.isPlayerTurn = false;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('goupil-simon-best', String(this.bestScore));
      }
      return 'wrong';
    }

    this.playerIndex++;
    if (this.playerIndex >= this.sequence.length) {
      this.score = this.sequence.length;
      this.isPlayerTurn = false;
      return 'complete';
    }
    return 'correct';
  }
}
