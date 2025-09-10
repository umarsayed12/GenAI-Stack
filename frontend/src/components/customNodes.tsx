import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { memo, useState, useRef } from "react";
import { embedding_models, gemini_models } from "@/lib/constants";
const CustomHandle = (props: {
  type: "source" | "target";
  position: Position;
  id: string;
  style?: React.CSSProperties;
}) => (
  <Handle
    {...props}
    className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
  />
);

type NodeData = {
  label: string;
  onDataChange: (data: any) => void;
  [key: string]: any;
};

export const UserQueryNode = memo(({ data }: NodeProps<NodeData>) => {
  const { label = "User Input", userQuery = "", onDataChange } = data;
  return (
    <Card className="w-80 shadow-lg border-gray-300">
      <CardHeader>
        <CardTitle className="text-md font-bold">{label}</CardTitle>
        <CardTitle className="text-sm font-medium bg-accent p-2">
          Enter point for queries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="user-query">User Query</Label>
        <Textarea
          id="user-query"
          placeholder="Write your query here"
          value={userQuery}
          onChange={(e) => onDataChange({ userQuery: e.target.value })}
          className="nodrag"
        />
      </CardContent>
      <CustomHandle type="source" position={Position.Right} id="query" />
    </Card>
  );
});

export const KnowledgeBaseNode = memo(({ data }: NodeProps<NodeData>) => {
  const {
    label = "Knowledge Base",
    apiKey = "",
    embeddingModel = "text-embedding-3-large",
    onDataChange,
  } = data;
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    if (data.apiKey) {
      formData.append("api_key", data.apiKey);
    }
    try {
      const response = await fetch(
        `${backendUrl}/api/v1/knowledge/upload-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("File upload failed");
      }
      const result = await response.json();
      setUploadStatus("Upload successful!");
      onDataChange({
        collectionName: result.collection_name,
        uploadSuccess: true,
      });
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed. Please try again.");
      onDataChange({ uploadSuccess: false });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-80 h-96 space-y-2 shadow-lg border-gray-300">
      <CardHeader>
        <CardTitle className="text-md font-bold">{label}</CardTitle>
        <CardTitle className="text-sm font-medium bg-accent p-2">
          Let LLM search info in your file
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <Label>File for Knowledge Base</Label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf"
          />
          <Button
            onClick={handleUploadClick}
            variant="outline"
            className="w-full mt-1 nodrag"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload File
          </Button>
          {fileName && (
            <p className="text-xs text-gray-500 mt-1">Selected: {fileName}</p>
          )}
          {uploadStatus && (
            <p className="text-xs text-green-600 mt-1">{uploadStatus}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Embedding Model</Label>
          <Select
            value={embeddingModel}
            onValueChange={(value) => onDataChange({ embeddingModel: value })}
          >
            <SelectTrigger className="nodrag w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {embedding_models.map((model) => (
                <SelectItem
                  key={model.model_name}
                  title={model.use_case}
                  value={model.model_name}
                >
                  {model.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => onDataChange({ apiKey: e.target.value })}
            className="nodrag"
          />
        </div>
      </CardContent>
      <CustomHandle type="target" position={Position.Left} id="query" />
      <CustomHandle type="source" position={Position.Right} id="context" />
    </Card>
  );
});

export const LLMNode = memo(({ data }: NodeProps<NodeData>) => {
  const {
    label = "LLM Model",
    model = "gemini-1.5-flash",
    apiKey = "",
    prompt = "You are a helpful PDF assistant. Handle the response with some quote and emoji. \n\n[CONTEXT]: {context}\n\nUser Query: {query}",
    temperature = 0.75,
    useWebSearch = false,
    serfApiKey = "",
    onDataChange,
  } = data;
  return (
    <Card className="w-96 shadow-lg border-gray-300">
      <CardHeader>
        <CardTitle className="text-md font-bold">{label}</CardTitle>
        <CardTitle className="text-sm font-medium bg-accent p-2">
          Run a query with Gemini LLM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={model}
            onValueChange={(value) => onDataChange({ model: value })}
          >
            <SelectTrigger className="nodrag w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {gemini_models.map((model) => (
                <SelectItem
                  key={model.model_name}
                  value={model.model_name}
                  title={model.use_case}
                >
                  {model.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => onDataChange({ apiKey: e.target.value })}
            className="nodrag"
          />
        </div>
        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea
            className="h-32 nodrag"
            value={prompt}
            onChange={(e) =>
              onDataChange({ prompt: e.target.value, isUserEdited: true })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Temperature</Label>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={temperature}
            onChange={(e) =>
              onDataChange({ temperature: parseFloat(e.target.value) })
            }
            className="nodrag"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>WebSearch Tool</Label>
          <Switch
            checked={useWebSearch}
            onCheckedChange={(checked) =>
              onDataChange({ useWebSearch: checked })
            }
            className="nodrag"
          />
        </div>
        {useWebSearch && (
          <div>
            <Label>SERF API</Label>
            <Input
              type="password"
              value={serfApiKey}
              onChange={(e) => onDataChange({ serfApiKey: e.target.value })}
              className="nodrag"
            />
          </div>
        )}
      </CardContent>
      <CustomHandle
        type="target"
        position={Position.Left}
        id="context"
        style={{ top: "30%" }}
      />
      <CustomHandle
        type="target"
        position={Position.Left}
        id="query"
        style={{ top: "70%" }}
      />
      <CustomHandle type="source" position={Position.Right} id="output" />
    </Card>
  );
});

export const OutputNode = memo(({ data }: NodeProps<NodeData>) => {
  const {
    label = "Output",
    outputText = "Output will be generated based on query",
    onDataChange,
  } = data;
  return (
    <Card className="w-80 shadow-lg border-gray-300">
      <CardHeader>
        <CardTitle className="text-lg text-start font-bold">{label}</CardTitle>
        <CardTitle className="text-sm text-start font-medium bg-accent p-2">
          Output of result node as text
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={outputText}
          onChange={(e) => onDataChange({ outputText: e.target.value })}
          placeholder="Output of the result nodes as text"
          className="nodrag bg-gray-100"
        />
      </CardContent>
      <CustomHandle type="target" position={Position.Left} id="input" />
    </Card>
  );
});
