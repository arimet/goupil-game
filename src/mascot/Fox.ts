type FoxState = 'idle' | 'happy' | 'encourage' | 'wave';

const FOX_SVG = `
<svg viewBox="0 0 150 180" xmlns="http://www.w3.org/2000/svg">
  <!-- Left ear -->
  <polygon class="fox-ear" points="35,60 50,15 65,60" fill="#E8742A"/>
  <polygon points="42,55 50,28 58,55" fill="#FFB8A0"/>
  <!-- Right ear -->
  <polygon class="fox-ear-r" points="85,60 100,15 115,60" fill="#E8742A"/>
  <polygon points="92,55 100,28 108,55" fill="#FFB8A0"/>
  <!-- Head -->
  <ellipse cx="75" cy="75" rx="42" ry="35" fill="#E8742A"/>
  <!-- White face -->
  <ellipse cx="75" cy="82" rx="28" ry="22" fill="#FFFFFF"/>
  <!-- Left eye -->
  <g class="fox-eye-l">
    <ellipse cx="60" cy="68" rx="5" ry="6" fill="#2D3436"/>
    <ellipse cx="58" cy="66" rx="2" ry="2" fill="#FFFFFF"/>
  </g>
  <!-- Right eye -->
  <g class="fox-eye-r">
    <ellipse cx="90" cy="68" rx="5" ry="6" fill="#2D3436"/>
    <ellipse cx="88" cy="66" rx="2" ry="2" fill="#FFFFFF"/>
  </g>
  <!-- Nose -->
  <ellipse cx="75" cy="80" rx="4" ry="3" fill="#2D3436"/>
  <!-- Mouth -->
  <path class="fox-mouth" d="M 68 85 Q 75 90 82 85" stroke="#2D3436" stroke-width="1.5" fill="none"/>
  <!-- Body -->
  <ellipse cx="75" cy="130" rx="35" ry="35" fill="#E8742A"/>
  <!-- White belly -->
  <ellipse cx="75" cy="135" rx="22" ry="25" fill="#FFFFFF"/>
  <!-- Left paw -->
  <ellipse class="fox-paw-l" cx="50" cy="155" rx="10" ry="7" fill="#E8742A"/>
  <!-- Right paw -->
  <ellipse class="fox-paw-r" cx="100" cy="155" rx="10" ry="7" fill="#E8742A"/>
  <!-- Tail -->
  <g class="fox-tail" transform-origin="40 150">
    <path d="M 30 140 Q 5 120 10 100 Q 15 85 25 95 Q 35 110 35 140" fill="#E8742A"/>
    <path d="M 15 100 Q 18 90 24 96 Q 30 108 28 120" fill="#FFFFFF"/>
  </g>
</svg>`;

export class Fox {
  private container: HTMLDivElement;
  private bubble: HTMLDivElement;
  private svgEl: SVGElement | null = null;
  private _state: FoxState = 'idle';
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  private tailAnimation: Animation | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'fox-container';

    this.bubble = document.createElement('div');
    this.bubble.className = 'speech-bubble';
    this.container.appendChild(this.bubble);

    this.container.innerHTML += FOX_SVG;
    this.svgEl = this.container.querySelector('svg');

    document.body.appendChild(this.container);
    this.startIdleAnimations();
  }

  private startIdleAnimations() {
    // Tail wag
    const tail = this.container.querySelector('.fox-tail');
    if (tail) {
      this.tailAnimation = tail.animate(
        [
          { transform: 'rotate(-10deg)' },
          { transform: 'rotate(15deg)' },
          { transform: 'rotate(-10deg)' },
        ],
        { duration: 1200, iterations: Infinity, easing: 'ease-in-out' },
      );
    }

    // Eye blink
    const eyeL = this.container.querySelector('.fox-eye-l');
    const eyeR = this.container.querySelector('.fox-eye-r');
    if (eyeL && eyeR) {
      const blink = () => {
        const anim = [
          { transform: 'scaleY(1)' },
          { transform: 'scaleY(0.1)' },
          { transform: 'scaleY(1)' },
        ];
        const opts: KeyframeAnimationOptions = { duration: 200 };
        eyeL.animate(anim, opts);
        eyeR.animate(anim, opts);
        setTimeout(blink, 2000 + Math.random() * 3000);
      };
      setTimeout(blink, 2000);
    }
  }

  setState(state: FoxState) {
    this._state = state;
    const mouth = this.container.querySelector('.fox-mouth') as SVGPathElement | null;
    const body = this.svgEl;

    if (!body) return;

    // Reset
    body.style.transform = '';

    switch (state) {
      case 'happy':
        if (mouth) mouth.setAttribute('d', 'M 65 83 Q 75 95 85 83');
        body.animate(
          [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-12px)' },
            { transform: 'translateY(0)' },
          ],
          { duration: 400, easing: 'ease-out' },
        );
        if (this.tailAnimation) this.tailAnimation.playbackRate = 3;
        break;
      case 'encourage':
        body.style.transform = 'rotate(-5deg)';
        if (mouth) mouth.setAttribute('d', 'M 68 85 Q 75 88 82 85');
        if (this.tailAnimation) this.tailAnimation.playbackRate = 0.5;
        break;
      case 'wave': {
        const pawR = this.container.querySelector('.fox-paw-r');
        if (pawR) {
          pawR.animate(
            [
              { transform: 'translate(0, 0) rotate(0deg)' },
              { transform: 'translate(5px, -15px) rotate(-20deg)' },
              { transform: 'translate(0, 0) rotate(0deg)' },
              { transform: 'translate(5px, -15px) rotate(-20deg)' },
              { transform: 'translate(0, 0) rotate(0deg)' },
            ],
            { duration: 1000, easing: 'ease-in-out' },
          );
        }
        if (mouth) mouth.setAttribute('d', 'M 65 83 Q 75 95 85 83');
        if (this.tailAnimation) this.tailAnimation.playbackRate = 2;
        break;
      }
      default: // idle
        if (mouth) mouth.setAttribute('d', 'M 68 85 Q 75 90 82 85');
        if (this.tailAnimation) this.tailAnimation.playbackRate = 1;
        break;
    }
  }

  speak(text: string, duration = 2500) {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.bubble.textContent = text;
    this.bubble.classList.add('visible');
    this.bubbleTimer = setTimeout(() => {
      this.bubble.classList.remove('visible');
    }, duration);
  }

  get state() {
    return this._state;
  }
}
