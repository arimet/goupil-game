import type { Screen } from './ScreenManager';
import type { Fox } from '../mascot/Fox';
import { createBigButton } from './components/BigButton';
import { COLORS } from '../utils/constants';
import { PuzzleEngine } from '../puzzle/PuzzleEngine';

export class PuzzleSetupScreen implements Screen {
  private appEl: HTMLElement;
  private fox: Fox;
  private onStart: (image: HTMLCanvasElement, pieces: number) => void;
  private onResume: (engine: PuzzleEngine) => void;
  private container: HTMLDivElement | null = null;
  private loadedImage: HTMLCanvasElement | null = null;
  private previewEl: HTMLImageElement | null = null;
  private pieceCount = 12;
  private playBtn: HTMLButtonElement | null = null;
  private pasteHandler: ((e: ClipboardEvent) => void) | null = null;

  constructor(
    appEl: HTMLElement,
    fox: Fox,
    onStart: (image: HTMLCanvasElement, pieces: number) => void,
    onResume: (engine: PuzzleEngine) => void,
  ) {
    this.appEl = appEl;
    this.fox = fox;
    this.onStart = onStart;
    this.onResume = onResume;
  }

  enter() {
    this.container = document.createElement('div');
    this.container.className = 'screen puzzle-setup';

    // Resume button if save exists
    if (PuzzleEngine.hasSave()) {
      const resumeBtn = createBigButton('\u25B6 Continuer', '#FB923C', async () => {
        const engine = await PuzzleEngine.loadSave();
        if (engine) {
          this.onResume(engine);
        }
      });
      resumeBtn.style.marginBottom = '16px';
      this.container.appendChild(resumeBtn);
    }

    const title = document.createElement('div');
    title.className = 'game-subtitle';
    title.textContent = 'Ou cr\u00e9e un nouveau puzzle !';
    this.container.appendChild(title);

    // Image preview
    this.previewEl = document.createElement('img');
    this.previewEl.className = 'puzzle-preview';
    this.previewEl.style.display = 'none';
    this.container.appendChild(this.previewEl);

    // Placeholder text
    const placeholder = document.createElement('div');
    placeholder.className = 'puzzle-placeholder';
    placeholder.textContent = 'Colle une image (Ctrl+V) ou choisis une option';
    this.container.appendChild(placeholder);

    // Buttons row
    const btnRow = document.createElement('div');
    btnRow.className = 'choices-row';
    btnRow.style.marginTop = '16px';

    const randomBtn = createBigButton('\uD83C\uDFB2 Al\u00e9atoire', COLORS.secondary, () => {
      this.loadRandomImage(placeholder);
    });
    randomBtn.style.fontSize = '18px';
    randomBtn.style.minHeight = '50px';
    randomBtn.style.padding = '10px 20px';
    btnRow.appendChild(randomBtn);

    // URL input
    const urlBtn = createBigButton('\uD83D\uDD17 URL', '#A78BFA', () => {
      const url = prompt('URL de l\'image :');
      if (url) this.loadImageFromURL(url, placeholder);
    });
    urlBtn.style.fontSize = '18px';
    urlBtn.style.minHeight = '50px';
    urlBtn.style.padding = '10px 20px';
    btnRow.appendChild(urlBtn);

    this.container.appendChild(btnRow);

    // Piece count slider
    const sliderRow = document.createElement('div');
    sliderRow.className = 'puzzle-slider-row';

    const sliderLabel = document.createElement('div');
    sliderLabel.className = 'game-subtitle';
    sliderLabel.style.fontSize = '20px';
    sliderLabel.textContent = `Pi\u00e8ces : ${this.pieceCount}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '4';
    slider.max = '50';
    slider.value = String(this.pieceCount);
    slider.className = 'puzzle-slider';
    slider.addEventListener('input', () => {
      this.pieceCount = parseInt(slider.value);
      sliderLabel.textContent = `Pi\u00e8ces : ${this.pieceCount}`;
    });

    sliderRow.appendChild(sliderLabel);
    sliderRow.appendChild(slider);
    this.container.appendChild(sliderRow);

    // Play button
    this.playBtn = createBigButton('Jouer !', COLORS.correct, () => {
      if (this.loadedImage) {
        this.onStart(this.loadedImage, this.pieceCount);
      }
    });
    this.playBtn.style.marginTop = '16px';
    this.playBtn.style.opacity = '0.4';
    this.playBtn.style.pointerEvents = 'none';
    this.container.appendChild(this.playBtn);

    this.appEl.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('active'));

    // Paste handler
    this.pasteHandler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) this.loadImageFromBlob(blob, placeholder);
          return;
        }
      }
    };
    document.addEventListener('paste', this.pasteHandler);

    this.fox.setState('idle');
    this.fox.speak('Choisis une image !', 3000);
  }

  private loadRandomImage(placeholder: HTMLElement) {
    placeholder.textContent = 'Chargement...';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.setImage(img, placeholder);
    };
    img.onerror = () => {
      placeholder.textContent = 'Erreur de chargement. R\u00e9essaie !';
    };
    // Add timestamp to avoid cache
    img.src = `https://picsum.photos/800/600?t=${Date.now()}`;
  }

  private loadImageFromURL(url: string, placeholder: HTMLElement) {
    placeholder.textContent = 'Chargement...';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => this.setImage(img, placeholder);
    img.onerror = () => {
      placeholder.textContent = 'Impossible de charger cette image.';
    };
    img.src = url;
  }

  private loadImageFromBlob(blob: File, placeholder: HTMLElement) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      this.setImage(img, placeholder);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  private setImage(img: HTMLImageElement, placeholder: HTMLElement) {
    // Resize to max 800x800
    const maxDim = 800;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = (h / w) * maxDim;
        w = maxDim;
      } else {
        w = (w / h) * maxDim;
        h = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    this.loadedImage = canvas;

    // Show preview
    if (this.previewEl) {
      this.previewEl.src = canvas.toDataURL();
      this.previewEl.style.display = 'block';
    }
    placeholder.style.display = 'none';

    // Enable play button
    if (this.playBtn) {
      this.playBtn.style.opacity = '1';
      this.playBtn.style.pointerEvents = 'auto';
    }

    this.fox.setState('happy');
    this.fox.speak('Super image !', 2000);
  }

  exit() {
    if (this.pasteHandler) {
      document.removeEventListener('paste', this.pasteHandler);
      this.pasteHandler = null;
    }
    this.container?.remove();
    this.container = null;
  }
}
