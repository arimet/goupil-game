import './style.css';
import { SceneManager } from './scene/SceneManager';
import { createBackground } from './scene/Background';
import { LetterMesh } from './scene/LetterMesh';
import { ParticleSystem } from './scene/Particles';
import { Fox } from './mascot/Fox';
import { SRSEngine } from './srs/SRSEngine';
import { ScreenManager } from './screens/ScreenManager';
import { StarCounter } from './screens/components/StarCounter';
import { WelcomeScreen, type GameMode } from './screens/WelcomeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { OralScreen } from './screens/OralScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PuzzleSetupScreen } from './screens/PuzzleSetupScreen';
import { PuzzleGameScreen } from './screens/PuzzleGameScreen';
import { MazeScreen } from './screens/MazeScreen';
import { SimonScreen } from './screens/SimonScreen';
import { CountingSetupScreen } from './screens/CountingSetupScreen';
import { CountingGameScreen } from './screens/CountingGameScreen';
import { MemorySetupScreen } from './screens/MemorySetupScreen';
import { MemoryGameScreen } from './screens/MemoryGameScreen';
import type { LetterCard } from './srs/LetterCard';
import { MAX_CHOICES } from './utils/constants';

// Scene setup
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const sceneManager = new SceneManager(canvas);
const background = createBackground();
sceneManager.addToScene(background);

const letterMesh = new LetterMesh();
sceneManager.addToScene(letterMesh.getGroup());

const particles = new ParticleSystem();
sceneManager.addToScene(particles.getGroup());

// Particle update loop
let lastTime = performance.now();
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  particles.update(dt);
}

// Mascot
const fox = new Fox();

// SRS Engine
const srsEngine = new SRSEngine();

// Star counter
const starCounter = new StarCounter();

// Back button
const backBtn = document.createElement('button');
backBtn.className = 'back-button';
backBtn.textContent = '\u2190 Menu';
backBtn.style.display = 'none';
document.body.appendChild(backBtn);

function showBackButton() { backBtn.style.display = 'block'; }
function hideBackButton() { backBtn.style.display = 'none'; }

function showScene() { canvas.style.display = 'block'; }
function hideScene() { canvas.style.display = 'none'; }

function goToMenu() {
  sessionActive = false;
  letterMesh.clear();
  starCounter.hide();
  hideBackButton();
  showScene();
  screenManager.navigate('welcome');
}

backBtn.addEventListener('click', goToMenu);

// App element
const appEl = document.getElementById('app')!;

// Screen manager
const screenManager = new ScreenManager(appEl);

// Session state (for alphabet modes)
let sessionCards: LetterCard[] = [];
let sessionIndex = 0;
let sessionStars = 0;
let currentMode: GameMode = 'quiz';
let sessionActive = false;

function startSession(mode: GameMode) {
  showBackButton();

  // Canvas-based games hide the 3D scene
  if (['puzzle', 'maze'].includes(mode)) {
    hideScene();
  }

  // Games with their own setup screens
  if (mode === 'puzzle') {
    screenManager.navigate('puzzle-setup');
    return;
  }
  if (mode === 'maze') {
    screenManager.navigate('maze');
    return;
  }
  if (mode === 'simon') {
    screenManager.navigate('simon');
    return;
  }
  if (mode === 'counting') {
    screenManager.navigate('counting-setup');
    return;
  }
  if (mode === 'memory') {
    screenManager.navigate('memory-setup');
    return;
  }

  // Alphabet modes (quiz / oral)
  currentMode = mode;
  sessionCards = srsEngine.getSessionCards();
  sessionIndex = 0;
  sessionStars = 0;

  if (sessionCards.length === 0) {
    srsEngine.reset();
    sessionCards = srsEngine.getSessionCards();
  }

  sessionActive = true;
  starCounter.setCount(0);
  starCounter.show();
  advanceSession();
}

function advanceSession() {
  if (!sessionActive) return;
  if (sessionIndex >= sessionCards.length) {
    srsEngine.completeSession();
    starCounter.hide();
    hideBackButton();
    resultScreen.setStars(sessionStars);
    screenManager.navigate('result');
    return;
  }

  const card = sessionCards[sessionIndex];

  if (currentMode === 'oral') {
    oralScreen.setLetter(card.letter);
    screenManager.navigate('oral');
  } else {
    const distractors = srsEngine.getDistractors(card.letter, MAX_CHOICES - 1);
    quizScreen.setQuestion(card.letter, distractors);
    screenManager.navigate('quiz');
  }
}

function onAnswer(correct: boolean) {
  if (correct) sessionStars++;
  sessionIndex++;
  advanceSession();
}

// --- Screens ---

const welcomeScreen = new WelcomeScreen(appEl, fox, startSession);

const quizScreen = new QuizScreen(
  appEl, fox, letterMesh, particles, starCounter, srsEngine, onAnswer,
);

const oralScreen = new OralScreen(
  appEl, fox, letterMesh, particles, starCounter, srsEngine, onAnswer,
);

const resultScreen = new ResultScreen(appEl, fox, particles,
  () => screenManager.navigate('welcome'),
  () => { starCounter.hide(); screenManager.navigate('welcome'); },
);

const puzzleSetupScreen = new PuzzleSetupScreen(appEl, fox, (image, pieces) => {
  puzzleGameScreen.setup(image, pieces);
  screenManager.navigate('puzzle-game');
}, (engine) => {
  puzzleGameScreen.setupFromSave(engine);
  screenManager.navigate('puzzle-game');
});

const puzzleGameScreen = new PuzzleGameScreen(appEl, fox, () => {
  hideBackButton();
  showScene();
  screenManager.navigate('welcome');
});

const mazeScreen = new MazeScreen(appEl, fox);

const simonScreen = new SimonScreen(appEl, fox);

const countingSetupScreen = new CountingSetupScreen(appEl, fox, (mode, max) => {
  countingGameScreen.setup(mode, max);
  screenManager.navigate('counting-game');
});

const countingGameScreen = new CountingGameScreen(appEl, fox, () => {
  hideBackButton();
  screenManager.navigate('welcome');
});

const memorySetupScreen = new MemorySetupScreen(appEl, fox, (pairs, difficulty) => {
  memoryGameScreen.setup(pairs, difficulty);
  screenManager.navigate('memory-game');
});

const memoryGameScreen = new MemoryGameScreen(appEl, fox, () => {
  hideBackButton();
  screenManager.navigate('welcome');
});

// Register all screens
screenManager.register('welcome', welcomeScreen);
screenManager.register('quiz', quizScreen);
screenManager.register('oral', oralScreen);
screenManager.register('result', resultScreen);
screenManager.register('puzzle-setup', puzzleSetupScreen);
screenManager.register('puzzle-game', puzzleGameScreen);
screenManager.register('maze', mazeScreen);
screenManager.register('simon', simonScreen);
screenManager.register('counting-setup', countingSetupScreen);
screenManager.register('counting-game', countingGameScreen);
screenManager.register('memory-setup', memorySetupScreen);
screenManager.register('memory-game', memoryGameScreen);

// Start
sceneManager.start();
gameLoop();
screenManager.navigate('welcome');
