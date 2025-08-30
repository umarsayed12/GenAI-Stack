import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
} from "reactflow";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowInstance,
  ReactFlowJsonObject,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import {
  UserQueryNode,
  KnowledgeBaseNode,
  LLMNode,
  OutputNode,
} from "@/components/customNodes";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStack } from "@/hooks/useStack";
import { LoaderOne } from "@/components/ui/loader";
import { ChatModal } from "@/components/ChatModal";
import {
  CloudIcon,
  MessageCircle,
  PlayCircleIcon,
  PlayIcon,
} from "lucide-react";
import { toast } from "sonner";
let id = 0;
const getId = () => `dndnode_${id++}`;

const StackEditor = () => {
  const { id: stackId } = useParams();
  const navigate = useNavigate();
  const { stack, isLoading, error, updateStack, fetchStack } = useStack(
    stackId!
  );

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const nodeTypes = useMemo(
    () => ({
      userQuery: UserQueryNode,
      knowledgeBase: KnowledgeBaseNode,
      llm: LLMNode,
      output: OutputNode,
    }),
    []
  );

  useEffect(() => {
    fetchStack();
  }, [fetchStack]);

  useEffect(() => {
    if (stack?.workflow_data) {
      const flow = stack.workflow_data;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    }
  }, [stack]);

  useEffect(() => {
    const llmNodes = nodes.filter((n) => n.type === "llm");

    llmNodes.forEach((llm) => {
      const incomingEdges = edges.filter((e) => e.target === llm.id);

      const fromQuery = incomingEdges.some((e) => {
        const src = nodes.find((n) => n.id === e.source);
        return src?.type === "userQuery";
      });

      const fromKB = incomingEdges.some((e) => {
        const src = nodes.find((n) => n.id === e.source);
        return src?.type === "knowledgeBase";
      });
      const kbNode = nodes.find(
        (n) =>
          n.type === "knowledgeBase" &&
          edges.some((e) => e.source === n.id && e.target === llm.id)
      );

      const kbSuccess = kbNode?.data?.uploadSuccess;
      const basePrompt =
        llm.data.initialPrompt || "You are a helpful assistant.";

      let newPrompt = basePrompt;

      if (fromQuery && fromKB) {
        if (kbSuccess) {
          newPrompt += `\n\nContext: {context}`;
        }
        newPrompt += `\n\nUser Query: {query}`;
      } else if (fromQuery) {
        newPrompt += `\n\nUser Query: {query}`;
      }
      if (llm.data.prompt !== newPrompt) {
        onNodeDataChange(llm.id, { prompt: newPrompt });
      }
    });
  }, [nodes, edges]);

  const onNodeDataChange = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );

    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) =>
        prev ? { ...prev, data: { ...prev.data, ...newData } } : null
      );
    }
  };

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectionChange = changes.find((c) => c.type === "select");
      if (selectionChange && selectionChange.type === "select") {
        const node = nodes.find((n) => n.id === selectionChange.id);
        setSelectedNode(selectionChange.selected ? node || null : null);
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [nodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - 100,
        y: event.clientY - 40,
      });

      let initialData = {};
      const newId = getId();
      switch (type) {
        case "userQuery":
          initialData = { id: newId, query: "Write your query here" };
          break;
        case "knowledgeBase":
          initialData = {
            id: newId,
            file: null,
            embeddingModel: "text-embedding-3-large",
            apiKey: "",
          };
          break;
        case "llm":
          initialData = {
            id: newId,
            model: "gemini-1.5-flash",
            apiKey: "",
            initialPrompt: "You are a helpful assistant.",
            prompt: "You are a helpful assistant.",
            temperature: 0.7,
            webSearch: false,
            serpApi: "",
          };
          break;
        case "output":
          initialData = {
            id: newId,
            outputText: "Output will be generated here.",
          };
          break;
      }

      const newNode: Node = {
        id: newId,
        type,
        position,
        data: initialData,
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const handleSave = () => {
    try {
      if (reactFlowInstance) {
        const workflow_data: ReactFlowJsonObject = reactFlowInstance.toObject();
        updateStack(workflow_data);
        toast.success("Stack saved successfully");
      }
    } catch (error) {
      toast.error("Unable to save toast. Try Again.");
    }
  };

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isLoading)
    return (
      <div className="p-8 h-[90vh] flex justify-center items-center">
        <LoaderOne />
      </div>
    );
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
          >
            Home
          </Button>
          <h1 className="text-lg font-semibold">{stack?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            title="Chat with AI"
            onClick={() => setIsChatModalOpen(true)}
            className="cursor-pointer"
          >
            <MessageCircle />
          </Button>
          <Button
            title="Build Stack"
            onClick={handleSave}
            className="cursor-pointer"
          >
            <PlayIcon />
          </Button>
        </div>
      </header>
      <div className="flex flex-grow">
        <aside className="w-64 border-r bg-gray-50 p-4">
          <h2 className="text-lg font-semibold mb-4">Components</h2>
          <div className="grid gap-3">
            <div
              className="flex h-20 cursor-grab items-center justify-center rounded-lg border-2 border-dashed bg-white text-center"
              onDragStart={(event) => onDragStart(event, "userQuery")}
              draggable
            >
              User Query
            </div>
            <div
              className="flex h-20 cursor-grab items-center justify-center rounded-lg border-2 border-dashed bg-white text-center"
              onDragStart={(event) => onDragStart(event, "knowledgeBase")}
              draggable
            >
              Knowledge Base
            </div>
            <div
              className="flex h-20 cursor-grab items-center justify-center rounded-lg border-2 border-dashed bg-white text-center"
              onDragStart={(event) => onDragStart(event, "llm")}
              draggable
            >
              LLM Engine
            </div>
            <div
              className="flex h-20 cursor-grab items-center justify-center rounded-lg border-2 border-dashed bg-white text-center"
              onDragStart={(event) => onDragStart(event, "output")}
              draggable
            >
              Output
            </div>
          </div>
        </aside>

        <main className="flex-grow" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                onDataChange: (newData: any) => onNodeDataChange(n.id, newData),
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </main>

        {selectedNode && (
          <aside className="w-96 border-l bg-gray-50 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Node Type: {selectedNode.type}</Label>
              </div>
              {Object.entries(selectedNode.data).map(([key, value]) => {
                if (key === "onDataChange" || key === "id") return null;
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </Label>
                    <Textarea
                      id={key}
                      value={String(value)}
                      onChange={(e) =>
                        onNodeDataChange(selectedNode.id, {
                          [key]: e.target.value,
                        })
                      }
                      className="min-h-[60px]"
                    />
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
      {stackId && (
        <ChatModal
          stackId={stackId}
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
        />
      )}
    </div>
  );
};

export default StackEditor;
