import {
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $applyNodeReplacement // Import needed utility
} from 'lexical';
import React from 'react';

// --- React Component for Rendering ---
// Use React.FC for typing functional components with props
interface VariableComponentProps {
  nodeKey: NodeKey;
  varName: string;
}
const VariableComponent: React.FC<VariableComponentProps> = ({ nodeKey, varName }) => {
  return (
    <span data-lexical-variable="true" data-lexical-node-key={nodeKey} className="bg-blue-100 text-blue-800 p-1 rounded font-mono text-sm mx-1 cursor-default">
      {`{{${varName}}}`}
    </span>
  );
};
// --- End Component ---

export type SerializedVariableNode = Spread<
  {
    variableName: string;
  },
  SerializedLexicalNode
>;

export class VariableNode extends DecoratorNode<React.ReactNode> {
  __variableName: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableName, node.__key);
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const node = $createVariableNode(serializedNode.variableName);
    return node;
  }

  constructor(variableName: string, key?: NodeKey) {
    super(key);
    this.__variableName = variableName;
  }

  exportJSON(): SerializedVariableNode {
    return {
      variableName: this.__variableName,
      type: VariableNode.getType(),
      version: 1,
    };
  }

  // Basic DOM creation (fallback)
  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  // No complex DOM updates needed as React handles it
  updateDOM(): boolean {
    return false;
  }

  // Render the React component
  decorate(): React.ReactNode {
    return (
      <VariableComponent nodeKey={this.__key} varName={this.__variableName} />
    );
  }

  // Mark as inline, token (single unit), segmented
  isInline(): boolean {
    return true;
  }
  isToken(): boolean {
    return true;
  }
  isSegmented(): boolean {
    return true;
  }
}

export function $createVariableNode(variableName: string): VariableNode {
  // Use $applyNodeReplacement if node already exists (e.g., during import)
  // Otherwise, create a new node
  // For simplicity here, we just create a new one. Robust import/creation might need more logic.
  const variableNode = new VariableNode(variableName);
  return $applyNodeReplacement(variableNode);
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}
