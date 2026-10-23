'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Circle, FileText, Folder, FolderOpen, Home } from 'lucide-react';
import { getWorkspaceTree, HOME_DIRECTORY, WorkspaceNode } from '@/app/lib/terminal/shell';
import styles from './TerminalWorkbench.module.css';

interface WorkspaceTreeProps {
  selectedPath: string;
  onSelect: (path: string) => void;
}

interface TreeNodeProps extends WorkspaceTreeProps {
  node: WorkspaceNode;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}

function TreeNode({ node, selectedPath, expanded, onSelect, onToggle }: TreeNodeProps) {
  const isDirectory = node.type === 'directory';
  const isExpanded = isDirectory && expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <li>
      <button
        type="button"
        className={styles.treeButton}
        data-selected={isSelected}
        aria-expanded={isDirectory ? isExpanded : undefined}
        onClick={() => isDirectory ? onToggle(node.path) : onSelect(node.path)}
      >
        {isDirectory ? (
          isExpanded ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />
        ) : (
          <span aria-hidden="true" className={styles.treeIconSpacer} />
        )}
        {isDirectory ? (
          isExpanded
            ? <FolderOpen size={14} className={styles.treeIcon} aria-hidden="true" />
            : <Folder size={14} className={styles.treeIcon} aria-hidden="true" />
        ) : (
          <FileText size={14} className={styles.treeIcon} aria-hidden="true" />
        )}
        <span>{node.name}</span>
        {isSelected ? <Circle size={6} fill="currentColor" className={styles.treeSelection} aria-hidden="true" /> : null}
      </button>
      {isExpanded && node.children?.length ? (
        <ul className={`${styles.treeList} ${styles.treeChildren}`}>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function WorkspaceTree({ selectedPath, onSelect }: WorkspaceTreeProps) {
  const workspaceTree = getWorkspaceTree();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([
      `${HOME_DIRECTORY}/projects`,
      `${HOME_DIRECTORY}/knowledge`,
      `${HOME_DIRECTORY}/docs`,
    ]),
  );

  const toggleFolder = (path: string) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div>
      <div className={styles.treeRoot}>
        <Home size={13} aria-hidden="true" />
        <span>workspace</span>
      </div>
      <ul className={styles.treeList}>
        {workspaceTree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            expanded={expanded}
            onSelect={onSelect}
            onToggle={toggleFolder}
          />
        ))}
      </ul>
    </div>
  );
}
