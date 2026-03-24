import { BUTTON_COLORS } from '../../utils/constants';

export function createLetterButton(
  letter: string,
  index: number,
  onClick: (letter: string) => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'letter-button bounce-in';
  btn.textContent = letter;
  btn.style.backgroundColor = BUTTON_COLORS[index % BUTTON_COLORS.length];
  btn.style.animationDelay = `${index * 0.1}s`;

  btn.addEventListener('click', () => onClick(letter));
  return btn;
}

export function shakeButton(btn: HTMLButtonElement) {
  btn.classList.remove('shake');
  void btn.offsetWidth;
  btn.classList.add('shake');
}

export function disableButton(btn: HTMLButtonElement) {
  btn.classList.add('disabled');
}
