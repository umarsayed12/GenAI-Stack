export interface WorkflowNodeData {
  label?: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: any;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface StackPayload {
  name: string;
  description?: string;
  workflow_data: WorkflowData;
}
