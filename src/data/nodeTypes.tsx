import * as React from "react";
import {
  MessageSquare,
  Mail,
  Globe,
  Webhook,
  Database,
  Send,
  Gauge,
  Brain,
  Bot,
  ChevronRight,
  Filter,
  BarChartBig,
  Users,
  MessageCircle,
  Key,
  Image,
  Share2,
  FileText,
  Calendar,
  Target,
  Megaphone,
  Clock,
  PlayCircle,
  StopCircle,
  GitBranch,
  Repeat,
  Timer,
  Zap,
  Code,
  FileCode,
  Hash,
  Type,
  Calculator,
  Shuffle,
  Split,
  Merge,
  Download,
  Upload,
  Cloud,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Edit,
  Trash2,
  Copy,
  Link,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Save,
  FolderOpen,
  FileType,
  MapPin,
  Phone,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Activity,
  BarChart,
  PieChart,
  LineChart,
  Home,
  Building,
  Users2,
  UserCheck,
  Bell,
  BookOpen,
  Bookmark,
  Tag,
  Star,
  Heart,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Server,
  HardDrive,
  Cpu,
  Memory,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Mic,
  Camera,
  Video,
  Music,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Bluetooth,
  Usb,
  MousePointer,
  Keyboard,
  Printer,
  ScanLine,
  QrCode,
  Barcode,
  Package,
  Truck,
  Plane,
  Car,
  Bike,
  Bus,
} from "lucide-react";
import { NodeType, NodeIconType } from "../types";

// Utility function to render icon based on type
export const renderIcon = (type: NodeIconType): React.ReactNode => {
  switch (type) {
    case "key":
      return <Key size={16} color="white" />;
    case "brain":
      return <Brain size={16} color="white" />;
    case "image":
      return <Image size={16} color="white" />;
    case "share":
      return <Share2 size={16} color="white" />;
    case "file-text":
      return <FileText size={16} color="white" />;
    case "messageSquare":
      return <MessageSquare size={16} color="white" />;
    case "mail":
      return <Mail size={16} color="white" />;
    case "globe":
      return <Globe size={16} color="white" />;
    case "webhook":
      return <Webhook size={16} color="white" />;
    case "database":
      return <Database size={16} color="white" />;
    case "send":
      return <Send size={16} color="white" />;
    case "gauge":
      return <Gauge size={16} color="white" />;
    case "bot":
      return <Bot size={16} color="white" />;
    case "chevronRight":
      return <ChevronRight size={16} color="white" />;
    case "filter":
      return <Filter size={16} color="white" />;
    case "barChart":
      return <BarChartBig size={16} color="white" />;
    case "users":
      return <Users size={16} color="white" />;
    case "messageCircle":
      return <MessageCircle size={16} color="white" />;
    case "calendar":
      return <Calendar size={16} color="white" />;
    case "target":
      return <Target size={16} color="white" />;
    case "megaphone":
      return <Megaphone size={16} color="white" />;
    default:
      return null;
  }
};

export const nodeTypes: NodeType[] = [
  {
    type: "openai_key",
    name: "OpenAI API Key",
    description: "Configure your OpenAI API key",
    category: "configuration",
    icon: "key",
    colorClass: "bg-gray-600",
    inputs: [],
    outputs: [{ id: "key", name: "API Key", type: "string" }],
    defaultParameters: {
      apiKey: "",
    },
  },
  {
    type: "ai_message",
    name: "AI Message",
    description: "Generate AI responses based on prompts",
    category: "ai",
    icon: "brain",
    colorClass: "bg-purple-600",
    inputs: [
      { id: "prompt", name: "Prompt", type: "string" },
      { id: "context", name: "Context", type: "string" },
    ],
    outputs: [{ id: "response", name: "Response", type: "string" }],
    defaultParameters: {
      model: "gpt-4",
      temperature: "0.7",
      maxTokens: "1000",
    },
  },
  {
    type: "image_generator",
    name: "Image Generator",
    description: "Generate images using DALL-E",
    category: "ai",
    icon: "image",
    colorClass: "bg-purple-600",
    inputs: [{ id: "prompt", name: "Prompt", type: "string" }],
    outputs: [{ id: "image", name: "Image URL", type: "string" }],
    defaultParameters: {
      model: "dall-e-3",
      size: "1024x1024",
      quality: "standard",
    },
  },
  {
    type: "social_post",
    name: "Social Media Post",
    description: "Create and schedule social media posts",
    category: "marketing",
    icon: "share",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "content", name: "Content", type: "string" },
      { id: "image", name: "Image", type: "string" },
    ],
    outputs: [{ id: "post", name: "Post", type: "object" }],
    defaultParameters: {
      platform: "twitter",
      schedule: "now",
    },
  },
  {
    type: "content_generator",
    name: "Content Generator",
    description: "Generate marketing content",
    category: "marketing",
    icon: "file-text",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "topic", name: "Topic", type: "string" },
      { id: "type", name: "Content Type", type: "string" },
    ],
    outputs: [{ id: "content", name: "Content", type: "string" }],
    defaultParameters: {
      tone: "professional",
      length: "medium",
    },
  },
  {
    type: "campaign_scheduler",
    name: "Campaign Scheduler",
    description: "Schedule marketing campaigns",
    category: "marketing",
    icon: "calendar",
    colorClass: "bg-blue-600",
    inputs: [{ id: "campaign", name: "Campaign", type: "object" }],
    outputs: [{ id: "schedule", name: "Schedule", type: "object" }],
    defaultParameters: {
      frequency: "daily",
      timezone: "UTC",
    },
  },
  {
    type: "ad_generator",
    name: "Ad Generator",
    description: "Generate ad copy and creatives",
    category: "marketing",
    icon: "target",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "product", name: "Product", type: "string" },
      { id: "audience", name: "Audience", type: "string" },
    ],
    outputs: [{ id: "ad", name: "Ad Content", type: "object" }],
    defaultParameters: {
      platform: "facebook",
      format: "image",
    },
  },
  {
    type: "marketing_analytics",
    name: "Marketing Analytics",
    description: "Track campaign performance",
    category: "marketing",
    icon: "megaphone",
    colorClass: "bg-blue-600",
    inputs: [{ id: "campaign_id", name: "Campaign ID", type: "string" }],
    outputs: [{ id: "metrics", name: "Metrics", type: "object" }],
    defaultParameters: {
      metrics: "engagement,reach,conversions",
      period: "30d",
    },
  },
  {
    type: "email_sender",
    name: "Email Sender",
    description: "Send personalized emails to prospects",
    category: "communication",
    icon: "mail",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "recipient", name: "Recipient", type: "string" },
      { id: "subject", name: "Subject", type: "string" },
      { id: "body", name: "Body", type: "string" },
    ],
    outputs: [
      { id: "sent", name: "Sent", type: "boolean" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      fromName: "Sales Team",
      fromEmail: "sales@company.com",
      trackOpens: "true",
    },
  },
  {
    type: "data_source",
    name: "Data Source",
    description: "Fetch data from external sources",
    category: "data",
    icon: "database",
    colorClass: "bg-emerald-600",
    inputs: [],
    outputs: [{ id: "data", name: "Data", type: "array" }],
    defaultParameters: {
      source: "CRM",
      filter: "",
      limit: "100",
    },
  },
  {
    type: "conditional",
    name: "Conditional",
    description: "Branching logic based on conditions",
    category: "logic",
    icon: "chevronRight",
    colorClass: "bg-orange-600",
    inputs: [{ id: "condition", name: "Condition", type: "boolean" }],
    outputs: [
      { id: "true", name: "True", type: "any" },
      { id: "false", name: "False", type: "any" },
    ],
  },
  {
    type: "filter",
    name: "Filter",
    description: "Filter data based on criteria",
    category: "data",
    icon: "filter",
    colorClass: "bg-emerald-600",
    inputs: [{ id: "data", name: "Data", type: "array" }],
    outputs: [{ id: "filtered", name: "Filtered", type: "array" }],
    defaultParameters: {
      property: "",
      operator: "equals",
      value: "",
    },
  },
  {
    type: "webhook",
    name: "Webhook",
    description: "Receive data from external services",
    category: "integrations",
    icon: "webhook",
    colorClass: "bg-indigo-600",
    inputs: [],
    outputs: [{ id: "payload", name: "Payload", type: "object" }],
    defaultParameters: {
      path: "/webhook",
      method: "POST",
    },
  },
  {
    type: "analytics",
    name: "Analytics",
    description: "Track and analyze metrics",
    category: "data",
    icon: "gauge",
    colorClass: "bg-emerald-600",
    inputs: [
      { id: "event", name: "Event", type: "string" },
      { id: "properties", name: "Properties", type: "object" },
    ],
    outputs: [],
    defaultParameters: {
      eventCategory: "sales",
      trackId: "",
    },
  },
  {
    type: "chat_bot",
    name: "Chat Bot",
    description: "Interactive chat interface for websites",
    category: "ai",
    icon: "bot",
    colorClass: "bg-purple-600",
    inputs: [{ id: "message", name: "Message", type: "string" }],
    outputs: [
      { id: "response", name: "Response", type: "string" },
      { id: "action", name: "Action", type: "string" },
    ],
    defaultParameters: {
      personality: "helpful",
      knowledgeBase: "default",
    },
  },
  {
    type: "lead_scoring",
    name: "Lead Scoring",
    description: "Score leads based on criteria",
    category: "sales",
    icon: "barChart",
    colorClass: "bg-amber-600",
    inputs: [{ id: "lead", name: "Lead", type: "object" }],
    outputs: [
      { id: "score", name: "Score", type: "number" },
      { id: "category", name: "Category", type: "string" },
    ],
    defaultParameters: {
      model: "default",
      threshold: "50",
    },
  },
  {
    type: "crm_integration",
    name: "CRM Integration",
    description: "Sync data with your CRM",
    category: "integrations",
    icon: "users",
    colorClass: "bg-indigo-600",
    inputs: [{ id: "data", name: "Data", type: "object" }],
    outputs: [{ id: "result", name: "Result", type: "object" }],
    defaultParameters: {
      crmProvider: "salesforce",
      action: "create",
      objectType: "Lead",
    },
  },
  {
    type: "sms_sender",
    name: "SMS Sender",
    description: "Send SMS messages to customers",
    category: "communication",
    icon: "messageCircle",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "recipient", name: "Recipient", type: "string" },
      { id: "message", name: "Message", type: "string" },
    ],
    outputs: [
      { id: "sent", name: "Sent", type: "boolean" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      from: "",
      trackLinks: "true",
    },
  },
  {
    type: "api_request",
    name: "API Request",
    description: "Make HTTP requests to external APIs",
    category: "integrations",
    icon: "globe",
    colorClass: "bg-indigo-600",
    inputs: [
      { id: "url", name: "URL", type: "string" },
      { id: "body", name: "Body", type: "object" },
    ],
    outputs: [
      { id: "response", name: "Response", type: "object" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      method: "GET",
      headers: "{}",
    },
  },
  {
    type: "marketing_agent",
    name: "Marketing Agent",
    description: "AI agent specialized in marketing tasks (content, ads, emails)",
    category: "ai",
    icon: "brain",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "task", name: "Task", type: "string" },
      { id: "apiKey", name: "API Key", type: "string" },
    ],
    outputs: [
      { id: "output", name: "Output", type: "string" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      agentType: "marketing",
      taskDescription: "Generate a social media post about our new product",
    },
  },
  {
    type: "sales_agent",
    name: "Sales Agent",
    description: "AI agent specialized in sales tasks (lead qualification, objection handling, follow-ups)",
    category: "ai",
    icon: "brain",
    colorClass: "bg-amber-600",
    inputs: [
      { id: "task", name: "Task", type: "string" },
      { id: "apiKey", name: "API Key", type: "string" },
    ],
    outputs: [
      { id: "output", name: "Output", type: "string" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      agentType: "sales",
      taskDescription: "Generate a follow-up email for a prospect who showed interest but hasn't responded in a week",
    },
  },
  {
    type: "agent_chain",
    name: "Agent Chain",
    description: "Connect multiple agents together in a workflow chain",
    category: "ai",
    icon: "chevronRight",
    colorClass: "bg-purple-600",
    inputs: [
      { id: "input", name: "Input", type: "string" },
      { id: "apiKey", name: "API Key", type: "string" },
    ],
    outputs: [
      { id: "output", name: "Output", type: "string" },
      { id: "error", name: "Error", type: "string" },
    ],
    defaultParameters: {
      agents: "[]", // JSON string representing agent chain configuration
      maxSteps: "5",
    },
  },
];

export const getNodeTypeByType = (type: string): NodeType | undefined => {
  return nodeTypes.find((nt) => nt.type === type);
};

export const nodeCategories = [
  {
    id: "configuration",
    name: "Configuration",
    nodes: nodeTypes
      .filter((node) => node.category === "configuration")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "ai",
    name: "AI & ML",
    nodes: nodeTypes
      .filter((node) => node.category === "ai")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "marketing",
    name: "Marketing",
    nodes: nodeTypes
      .filter((node) => node.category === "marketing")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "communication",
    name: "Communication",
    nodes: nodeTypes
      .filter((node) => node.category === "communication")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "data",
    name: "Data",
    nodes: nodeTypes
      .filter((node) => node.category === "data")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "integrations",
    name: "Integrations",
    nodes: nodeTypes
      .filter((node) => node.category === "integrations")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "logic",
    name: "Logic & Flow",
    nodes: nodeTypes
      .filter((node) => node.category === "logic")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "sales",
    name: "Sales",
    nodes: nodeTypes
      .filter((node) => node.category === "sales")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
];
