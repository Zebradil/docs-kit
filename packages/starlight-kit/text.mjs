/** Escapes text for HTML strings passed to `set:html` or Starlight's hero slots. */
export const escape = (text) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ponytail: only `inline code` is rendered; switch to a Markdown renderer if bodies need links or emphasis.
/** Escapes text and renders its `inline code` spans. */
export const inline = (text) => escape(text).replace(/`([^`]+)`/g, '<code>$1</code>');
