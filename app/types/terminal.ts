export interface Command {
  name: string;
  description: string;
  usage?: string;
  fn: (args: string[]) => void | string | Promise<void | string>;
}

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp?: Date;
}

export interface TerminalProps {
  commands: Command[];
  welcomeMessage?: string[];
  promptPrefix?: string;
  onCommand?: (command: string) => void;
}
