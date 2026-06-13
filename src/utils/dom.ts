// Tiny DOM helpers so the UI layer stays terse and readable.

type ElProps = {
  class?: string;
  id?: string;
  text?: string;
  html?: string;
  attrs?: Record<string, string>;
  style?: Partial<CSSStyleDeclaration>;
  onClick?: (e: Event) => void;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  children: (HTMLElement | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.id) node.id = props.id;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.html !== undefined) node.innerHTML = props.html;
  if (props.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) node.setAttribute(k, v);
  }
  if (props.style) Object.assign(node.style, props.style);
  if (props.onClick) {
    // Use pointerup for snappy response on touch + mouse alike.
    node.addEventListener('click', props.onClick);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}
