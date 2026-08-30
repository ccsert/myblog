'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Command as CommandIcon, Search } from 'lucide-react';
import styles from './TerminalWorkbench.module.css';

export interface PaletteAction {
  command: string;
  label: string;
  description: string;
}

interface CommandPaletteProps {
  actions: PaletteAction[];
  onClose: () => void;
  onRun: (command: string) => void;
}

export default function CommandPalette({ actions, onClose, onRun }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredActions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter(action =>
      `${action.command} ${action.label} ${action.description}`.toLowerCase().includes(needle),
    );
  }, [actions, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runAction = (command: string) => {
    onRun(command);
    onClose();
  };

  return (
    <div className={styles.paletteBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(index => Math.min(index + 1, filteredActions.length - 1));
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(index => Math.max(index - 1, 0));
          }
          if (event.key === 'Enter' && filteredActions[activeIndex]) {
            event.preventDefault();
            runAction(filteredActions[activeIndex].command);
          }
        }}
      >
        <div className={styles.paletteSearch}>
          <Search size={16} color="var(--terminal-accent)" aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.paletteInput}
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search commands and workspace…"
            aria-label="搜索命令"
          />
          <span className={styles.kbd}>Esc</span>
        </div>
        <div className={styles.paletteResults}>
          {filteredActions.length > 0 ? filteredActions.map((action, index) => (
            <button
              key={action.command}
              type="button"
              className={styles.paletteItem}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runAction(action.command)}
            >
              <span>
                <span className={styles.paletteLabel}>{action.label}</span>
                <span className={styles.paletteDescription}>{action.description}</span>
              </span>
              <code>{action.command}</code>
            </button>
          )) : (
            <div className={styles.paletteItem}>
              <span className={styles.paletteDescription}>No matching commands.</span>
              <CommandIcon size={14} aria-hidden="true" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
