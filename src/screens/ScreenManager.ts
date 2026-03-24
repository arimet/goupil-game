export interface Screen {
  enter(): void;
  exit(): void;
}

export class ScreenManager {
  private screens = new Map<string, Screen>();
  private current: Screen | null = null;
  private appEl: HTMLElement;

  constructor(appEl: HTMLElement) {
    this.appEl = appEl;
  }

  register(name: string, screen: Screen) {
    this.screens.set(name, screen);
  }

  navigate(name: string) {
    if (this.current) {
      this.current.exit();
    }
    this.appEl.innerHTML = '';
    const screen = this.screens.get(name);
    if (screen) {
      this.current = screen;
      screen.enter();
    }
  }
}
