// Lets plain links navigate without a reload, while keeping new-tab / copy-link behaviour.
export function go(e, navigate, id) {
  if (!navigate || e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(id);
}
