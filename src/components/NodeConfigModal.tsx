import { useState, useEffect, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Node } from "../types";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { renderIcon } from "../data/nodeTypes";
import { agentApi } from "../lib/api";

interface NodeConfigModalProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (parameters: Record<string, string>) => void;
}

const NodeConfigModal: React.FC<NodeConfigModalProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
}) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const [config, setConfig] = useState<Record<string, any>>({});

  // Reset configuration when node changes
  useEffect(() => {
    if (node) {
      setConfig(node.parameters || {});
    } else {
      setConfig({});
    }
  }, [node]);

  if (!node) return null;

  // Safely access node properties
  const nodeType = node.nodeType || node.data?.nodeType;

  const handleSave = () => {
    if (node) {
      // Handle config as Record<string, string>
      const stringConfig: Record<string, string> = {};

      // Convert all values to strings (to match expected type)
      Object.entries(config).forEach(([key, value]) => {
        stringConfig[key] = String(value);
      });

      // Update node in store
      updateNode(node.id, { parameters: stringConfig });

      // Call external onSave if provided
      if (onSave) {
        onSave(stringConfig);
      }

      onClose();
    }
  };

  const renderConfigFields = () => {
    // Use the safely accessed nodeType 
    if (!nodeType) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Unable to determine node type.</p>
          <p className="text-xs mt-2">
            This node may be corrupted or missing configuration.
          </p>
        </div>
      );
    }

    // Determine which fields to show based on node type
    switch (nodeType.type) {
      case "openai_key":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
                placeholder="sk-..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your API key is stored securely and used only for your workflow
                executions.
              </p>
            </div>
          </div>
        );

      case "ai_message":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={config.model || "gpt-4"}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, model: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || "0.7"}
                onChange={(e) =>
                  setConfig({ ...config, temperature: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="4000"
                value={config.maxTokens || "1000"}
                onChange={(e) =>
                  setConfig({ ...config, maxTokens: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="defaultPrompt">Default Prompt Template</Label>
              <Textarea
                id="defaultPrompt"
                value={config.defaultPrompt || ""}
                onChange={(e) =>
                  setConfig({ ...config, defaultPrompt: e.target.value })
                }
                placeholder="Enter a default prompt template. Use {{input}} to reference inputs."
                rows={4}
              />
            </div>
          </div>
        );

      case "image_generator":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={config.model || "dall-e-3"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, model: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="dall-e-3">DALL-E 3</option>
                <option value="dall-e-2">DALL-E 2</option>
              </select>
            </div>

            <div>
              <Label htmlFor="size">Image Size</Label>
              <select
                id="size"
                value={config.size || "1024x1024"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, size: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="256x256">256x256</option>
                <option value="512x512">512x512</option>
                <option value="1024x1024">1024x1024</option>
                <option value="1792x1024">1792x1024 (DALL-E 3 only)</option>
                <option value="1024x1792">1024x1792 (DALL-E 3 only)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="quality">Quality</Label>
              <select
                id="quality"
                value={config.quality || "standard"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, quality: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD (DALL-E 3 only)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="defaultPrompt">Default Prompt Template</Label>
              <Textarea
                id="defaultPrompt"
                value={config.defaultPrompt || ""}
                onChange={(e) =>
                  setConfig({ ...config, defaultPrompt: e.target.value })
                }
                placeholder="Enter a default image prompt template. Use {{input}} to reference inputs."
                rows={4}
              />
            </div>
          </div>
        );

      case "social_post":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                value={config.platform || "twitter"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, platform: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key/Token</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey || ""}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
                placeholder="Enter your API key or access token"
              />
            </div>

            <div>
              <Label htmlFor="apiSecret">API Secret (if required)</Label>
              <Input
                id="apiSecret"
                type="password"
                value={config.apiSecret || ""}
                onChange={(e) =>
                  setConfig({ ...config, apiSecret: e.target.value })
                }
                placeholder="Enter your API secret"
              />
            </div>

            <div>
              <Label htmlFor="schedule">Default Schedule</Label>
              <select
                id="schedule"
                value={config.schedule || "now"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, schedule: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="now">Post Immediately</option>
                <option value="hour">In 1 Hour</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="custom">Custom DateTime</option>
              </select>
            </div>

            {config.schedule === "custom" && (
              <div>
                <Label htmlFor="customSchedule">Custom Schedule</Label>
                <Input
                  id="customSchedule"
                  type="datetime-local"
                  value={config.customSchedule || ""}
                  onChange={(e) =>
                    setConfig({ ...config, customSchedule: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        );

      case "content_generator":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tone">Default Tone</Label>
              <select
                id="tone"
                value={config.tone || "professional"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, tone: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="humorous">Humorous</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>

            <div>
              <Label htmlFor="length">Default Length</Label>
              <select
                id="length"
                value={config.length || "medium"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setConfig({ ...config, length: e.target.value })
                }
                className="w-full mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="short">Short (100-200 words)</option>
                <option value="medium">Medium (300-500 words)</option>
                <option value="long">Long (600-1000 words)</option>
                <option value="xl">Extra Long (1000+ words)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="contentTemplate">Content Template</Label>
              <Textarea
                id="contentTemplate"
                value={config.contentTemplate || ""}
                onChange={(e) =>
                  setConfig({ ...config, contentTemplate: e.target.value })
                }
                placeholder="Enter a default content template. Use {{topic}} and {{type}} to reference inputs."
                rows={4}
              />
            </div>
          </div>
        );

      case "marketing_agent":
        return (
          <>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Agent Type</span>
                </label>
                <input
                  type="text"
                  value={node.parameters?.agentType || "marketing"}
                  disabled
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Task Description</span>
                </label>
                <textarea
                  value={node.parameters?.taskDescription || ""}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      taskDescription: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder="Describe the marketing task to perform"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Key</span>
                </label>
                <input
                  type="password"
                  value={node.parameters?.apiKey || ""}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      apiKey: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="OpenAI API Key"
                />
                <label className="label">
                  <span className="label-text-alt">
                    You can provide the API key here or connect from another node
                  </span>
                </label>
              </div>
            </div>
          </>
        );

      case "sales_agent":
        return (
          <>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Agent Type</span>
                </label>
                <input
                  type="text"
                  value={node.parameters?.agentType || "sales"}
                  disabled
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Task Description</span>
                </label>
                <textarea
                  value={node.parameters?.taskDescription || ""}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      taskDescription: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered h-24"
                  placeholder="Describe the sales task to perform"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Key</span>
                </label>
                <input
                  type="password"
                  value={node.parameters?.apiKey || ""}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      apiKey: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="OpenAI API Key"
                />
                <label className="label">
                  <span className="label-text-alt">
                    You can provide the API key here or connect from another node
                  </span>
                </label>
              </div>
            </div>
          </>
        );

      case "agent_chain":
        return (
          <>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Agent Chain Configuration</span>
                </label>
                <textarea
                  value={node.parameters?.agents || "[]"}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      agents: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered h-40 font-mono text-xs"
                  placeholder={`[
  {
    "type": "marketing",
    "instructions": "Generate content ideas"
  },
  {
    "type": "sales",
    "instructions": "Create email based on content"
  }
]`}
                />
                <label className="label">
                  <span className="label-text-alt">
                    JSON array of agents to execute in sequence
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Steps</span>
                </label>
                <input
                  type="number"
                  value={node.parameters?.maxSteps || "5"}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      maxSteps: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="5"
                  min="1"
                  max="10"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Maximum number of agents to execute in the chain
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Key</span>
                </label>
                <input
                  type="password"
                  value={node.parameters?.apiKey || ""}
                  onChange={(e) =>
                    onParametersChange({
                      ...node.parameters,
                      apiKey: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="OpenAI API Key"
                />
                <label className="label">
                  <span className="label-text-alt">
                    You can provide the API key here or connect from another node
                  </span>
                </label>
              </div>
            </div>
          </>
        );

      // Add more node types here following the pattern above

      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            <p>Configure settings for {nodeType.name}.</p>
            <p className="text-xs mt-2">
              This node doesn't have specific configuration options.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`p-1 rounded ${nodeType?.colorClass || 'bg-gray-600'}`}>
              {nodeType?.icon ? renderIcon(nodeType.icon) : null}
            </span>
            <span>Configure {node.name || node.data?.name || 'Node'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">{renderConfigFields()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeConfigModal;
