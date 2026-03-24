import './style.css';
import { SceneManager } from './scene/SceneManager';
import { createBackground } from './scene/Background';
import { LetterMesh } from './scene/LetterMesh';
import { ParticleSystem } from './scene/Particles';
import { Fox } from './mascot/Fox';
import { SRSEngine } from './srs/SRSEngine';
import { ScreenManager } from './screens/ScreenManager';
import { StarCounter } from './screens/components/StarCounter';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PresentScreen } from './screens/PresentScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
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

// Particle update loop (separate from Three.js render loop)
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
starCounter.setCount(srsEngine.totalStars);

// App element
const appEl = document.getElementById('app')!;

// Screen manager
const screenManager = new ScreenManager(appEl);

// Session state
let sessionCards: LetterCard[] = [];
let sessionIndex = 0;
let sessionStars = 0;

function startSession() {
  sessionCards = srsEngine.getSessionCards();
  sessionIndex = 0;
  sessionStars = 0;

  if (sessionCards.length === 0) {
    // No cards due, reset and try again
    srsEngine.reset();
    sessionCards = srsEngine.getSessionCards();
  }

  starCounter.show();
  advanceSession();
}

function advanceSession() {
  if (sessionIndex >= sessionCards.length) {
    // Session complete
    srsEngine.completeSession();
    starCounter.hide();
    resultScreen.setStars(sessionStars);
    screenManager.navigate('result');
    return;
  }

  const card = sessionCards[sessionIndex];
  const isNew = srsEngine.isNewLetter(card.letter);

  if (isNew) {
    presentScreen.setLetter(card.letter);
    screenManager.navigate('present');
  } else {
    showQuiz(card.letter);
  }
}

function showQuiz(letter: string) {
  const distractors = srsEngine.getDistractors(letter, MAX_CHOICES - 1);
  quizScreen.setQuestion(letter, distractors);
  screenManager.navigate('quiz');
}

// Screens
const welcomeScreen = new WelcomeScreen(appEl, fox, startSession);

const presentScreen = new PresentScreen(appEl, fox, letterMesh, () => {
  // After presenting, go to quiz for same letter
  const card = sessionCards[sessionIndex];
  showQuiz(card.letter);
});

const quizScreen = new QuizScreen(
  appEl,
  fox,
  letterMesh,
  particles,
  starCounter,
  srsEngine,
  (correct: boolean) => {
    if (correct) sessionStars++;
    sessionIndex++;
    advanceSession();
  },
);

const resultScreen = new ResultScreen(appEl, fox, particles, startSession, () => {
  starCounter.hide();
  screenManager.navigate('welcome');
});

// Register screens
screenManager.register('welcome', welcomeScreen);
screenManager.register('present', presentScreen);
screenManager.register('quiz', quizScreen);
screenManager.register('result', resultScreen);

// Start
sceneManager.start();
gameLoop();
screenManager.navigate('welcome');
