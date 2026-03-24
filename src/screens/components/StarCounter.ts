export class StarCounter {
  private el: HTMLDivElement;
  private countEl: HTMLSpanElement;
  private starEl: HTMLSpanElement;
  private _count = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'star-counter';

    this.starEl = document.createElement('span');
    this.starEl.className = 'star-icon';
    this.starEl.textContent = '\u2B50';

    this.countEl = document.createElement('span');
    this.countEl.textContent = '0';

    this.el.appendChild(this.starEl);
    this.el.appendChild(this.countEl);
  }

  getElement() {
    return this.el;
  }

  setCount(n: number) {
    this._count = n;
    this.countEl.textContent = String(n);
  }

  increment() {
    this._count += 1;
    this.countEl.textContent = String(this._count);
    this.starEl.classList.remove('pop');
    void this.starEl.offsetWidth; // force reflow
    this.starEl.classList.add('pop');
  }

  show() {
    document.body.appendChild(this.el);
  }

  hide() {
    this.el.remove();
  }
}
