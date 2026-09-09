export interface CompletionOption {
  id: string;
  value: string;
  label: string;
  detail: string;
  kind: 'command' | 'file' | 'folder' | 'value';
}

// Suggestions never replace typed text; acceptance only appends the remainder.
export function getAutosuggestion(input: string, history: string[], options: CompletionOption[]): string {
  if (!input.trim()) return '';
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].startsWith(input) && history[index].length > input.length) return history[index];
  }
  return options.find(option => option.value.startsWith(input) && option.value.length > input.length)?.value ?? '';
}

export function getCommonPrefix(options: CompletionOption[]): string {
  let prefix = options[0]?.value ?? '';
  for (const option of options.slice(1)) {
    while (!option.value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function completeToken(option: CompletionOption): string {
  return option.kind === 'folder' ? option.value : `${option.value} `;
}
