export function createBigButton(
  label: string,
  color: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'big-button';
  btn.textContent = label;
  btn.style.backgroundColor = color;
  btn.addEventListener('click', onClick);
  return btn;
}
