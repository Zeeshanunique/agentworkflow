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
  Shield,  Server,
  HardDrive,
  Cpu,
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

// Comprehensive n8n-style node library
export const n8nNodeTypes: NodeType[] = [
  // TRIGGERS
  {
    type: "manual_trigger",
    name: "Manual Trigger",
    description: "Manually start the workflow",
    category: "triggers",
    icon: "play",
    colorClass: "bg-green-600",
    inputs: [],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      triggerData: "{}",
    },
  },
  {
    type: "schedule_trigger",
    name: "Schedule",
    description: "Run workflow on a schedule",
    category: "triggers",
    icon: "clock",
    colorClass: "bg-green-600",
    inputs: [],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      interval: "every_hour",
      timezone: "UTC",
      rule: "*/5 * * * *",
    },
  },
  {
    type: "webhook_trigger",
    name: "Webhook Trigger",
    description: "Triggered by incoming webhook",
    category: "triggers",
    icon: "webhook",
    colorClass: "bg-green-600",
    inputs: [],
    outputs: [{ id: "body", name: "Body", type: "object" }, { id: "headers", name: "Headers", type: "object" }],
    defaultParameters: {
      httpMethod: "POST",
      path: "/webhook",
      authentication: "none",
    },
  },
  {
    type: "email_trigger",
    name: "Email Trigger",
    description: "Triggered by incoming emails",
    category: "triggers",
    icon: "mail",
    colorClass: "bg-green-600",
    inputs: [],
    outputs: [{ id: "email", name: "Email", type: "object" }],
    defaultParameters: {
      imapHost: "",
      imapPort: "993",
      checkInterval: "60",
    },
  },
  {
    type: "file_trigger",
    name: "File Trigger",
    description: "Triggered by file changes",
    category: "triggers",
    icon: "folder",
    colorClass: "bg-green-600",
    inputs: [],
    outputs: [{ id: "file", name: "File", type: "object" }],
    defaultParameters: {
      watchPath: "/uploads",
      eventType: "created",
      filePattern: "*",
    },
  },

  // CORE ACTIONS
  {
    type: "http_request",
    name: "HTTP Request",
    description: "Make HTTP requests",
    category: "core",
    icon: "globe",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "url", name: "URL", type: "string" },
      { id: "headers", name: "Headers", type: "object" },
      { id: "body", name: "Body", type: "any" },
    ],
    outputs: [
      { id: "response", name: "Response", type: "object" },
      { id: "headers", name: "Response Headers", type: "object" },
      { id: "statusCode", name: "Status Code", type: "number" },
    ],
    defaultParameters: {
      method: "GET",
      url: "",
      authentication: "none",
      timeout: "30000",
      followRedirects: "true",
    },
  },
  {
    type: "set_node",
    name: "Set",
    description: "Set values or manipulate data",
    category: "core",
    icon: "settings",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operations: "[]",
      mode: "manual",
    },
  },
  {
    type: "if_node",
    name: "IF",
    description: "Conditional logic routing",
    category: "core",
    icon: "git-branch",
    colorClass: "bg-orange-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [
      { id: "true", name: "True", type: "any" },
      { id: "false", name: "False", type: "any" },
    ],
    defaultParameters: {
      conditions: "[]",
      combineOperation: "AND",
    },
  },
  {
    type: "switch_node",
    name: "Switch",
    description: "Route data based on rules",
    category: "core",
    icon: "split",
    colorClass: "bg-orange-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [
      { id: "output0", name: "Output 1", type: "any" },
      { id: "output1", name: "Output 2", type: "any" },
      { id: "output2", name: "Output 3", type: "any" },
      { id: "default", name: "Default", type: "any" },
    ],
    defaultParameters: {
      rules: "[]",
      fallbackOutput: "default",
    },
  },
  {
    type: "merge_node",
    name: "Merge",
    description: "Merge data from multiple inputs",
    category: "core",
    icon: "merge",
    colorClass: "bg-gray-600",
    inputs: [
      { id: "input1", name: "Input 1", type: "any" },
      { id: "input2", name: "Input 2", type: "any" },
    ],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      mode: "append",
      waitIncomingItems: "all",
    },
  },
  {
    type: "code_node",
    name: "Code",
    description: "Execute custom JavaScript code",
    category: "core",
    icon: "code",
    colorClass: "bg-purple-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      jsCode: "// Your JavaScript code here\nreturn items;",
      mode: "runOnceForAllItems",
    },
  },
  {
    type: "function_node",
    name: "Function",
    description: "Process data with custom functions",
    category: "core",
    icon: "calculator",
    colorClass: "bg-purple-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      functionCode: "items.map(item => {\n  // Process item\n  return item;\n})",
    },
  },
  {
    type: "item_lists",
    name: "Item Lists",
    description: "Split/aggregate item lists",
    category: "core",
    icon: "shuffle",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "splitOutItems",
      fieldToSplitOut: "",
    },
  },
  {
    type: "wait_node",
    name: "Wait",
    description: "Pause workflow execution",
    category: "core",
    icon: "timer",
    colorClass: "bg-yellow-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      amount: "5",
      unit: "seconds",
    },
  },
  {
    type: "no_op",
    name: "No Operation",
    description: "Pass through data without changes",
    category: "core",
    icon: "arrow-right",
    colorClass: "bg-gray-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {},
  },

  // DATABASE NODES
  {
    type: "mysql",
    name: "MySQL",
    description: "Work with MySQL databases",
    category: "database",
    icon: "database",
    colorClass: "bg-blue-700",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "array" }],
    defaultParameters: {
      operation: "select",
      query: "SELECT * FROM table_name",
      host: "localhost",
      port: "3306",
      database: "",
      username: "",
      password: "",
    },
  },
  {
    type: "postgresql",
    name: "PostgreSQL",
    description: "Work with PostgreSQL databases",
    category: "database",
    icon: "database",
    colorClass: "bg-blue-800",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "array" }],
    defaultParameters: {
      operation: "select",
      query: "SELECT * FROM table_name",
      host: "localhost",
      port: "5432",
      database: "",
      username: "",
      password: "",
    },
  },
  {
    type: "mongodb",
    name: "MongoDB",
    description: "Work with MongoDB databases",
    category: "database",
    icon: "database",
    colorClass: "bg-green-700",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "array" }],
    defaultParameters: {
      operation: "find",
      collection: "",
      query: "{}",
      connectionString: "",
    },
  },
  {
    type: "redis",
    name: "Redis",
    description: "Work with Redis cache",
    category: "database",
    icon: "server",
    colorClass: "bg-red-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "get",
      key: "",
      host: "localhost",
      port: "6379",
      database: "0",
    },
  },

  // COMMUNICATION NODES
  {
    type: "email",
    name: "Email",
    description: "Send emails",
    category: "communication",
    icon: "mail",
    colorClass: "bg-blue-600",
    inputs: [
      { id: "input", name: "Input", type: "any" },
      { id: "attachments", name: "Attachments", type: "array" },
    ],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      fromEmail: "",
      toEmail: "",
      subject: "",
      text: "",
      html: "",
      smtpHost: "",
      smtpPort: "587",
      secure: "false",
    },
  },
  {
    type: "slack",
    name: "Slack",
    description: "Send messages to Slack",
    category: "communication",
    icon: "messageSquare",
    colorClass: "bg-purple-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      operation: "postMessage",
      channel: "",
      text: "",
      username: "n8n",
      webhook: "",
    },
  },
  {
    type: "discord",
    name: "Discord",
    description: "Send messages to Discord",
    category: "communication",
    icon: "messageCircle",
    colorClass: "bg-indigo-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      webhookUrl: "",
      text: "",
      username: "n8n",
    },
  },
  {
    type: "telegram",
    name: "Telegram Bot",
    description: "Send messages via Telegram",
    category: "communication",
    icon: "send",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      operation: "sendMessage",
      botToken: "",
      chatId: "",
      text: "",
    },
  },
  {
    type: "whatsapp",
    name: "WhatsApp Business",
    description: "Send WhatsApp messages",
    category: "communication",
    icon: "phone",
    colorClass: "bg-green-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      operation: "sendMessage",
      phoneNumber: "",
      message: "",
      accessToken: "",
    },
  },
  {
    type: "sms",
    name: "SMS",
    description: "Send SMS messages",
    category: "communication",
    icon: "smartphone",
    colorClass: "bg-green-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "object" }],
    defaultParameters: {
      provider: "twilio",
      to: "",
      message: "",
      from: "",
      accountSid: "",
      authToken: "",
    },
  },

  // CLOUD SERVICES
  {
    type: "google_drive",
    name: "Google Drive",
    description: "Work with Google Drive files",
    category: "cloud",
    icon: "cloud",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "download",
      fileId: "",
      driveId: "",
    },
  },
  {
    type: "dropbox",
    name: "Dropbox",
    description: "Work with Dropbox files",
    category: "cloud",
    icon: "cloud",
    colorClass: "bg-blue-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "download",
      path: "",
    },
  },
  {
    type: "aws_s3",
    name: "AWS S3",
    description: "Work with Amazon S3 buckets",
    category: "cloud",
    icon: "cloud",
    colorClass: "bg-orange-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "download",
      bucketName: "",
      fileKey: "",
      region: "us-east-1",
      accessKeyId: "",
      secretAccessKey: "",
    },
  },
  {
    type: "google_cloud_storage",
    name: "Google Cloud Storage",
    description: "Work with Google Cloud Storage",
    category: "cloud",
    icon: "cloud",
    colorClass: "bg-blue-400",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "download",
      bucketName: "",
      fileName: "",
      projectId: "",
    },
  },

  // CRM & SALES
  {
    type: "salesforce",
    name: "Salesforce",
    description: "Work with Salesforce CRM",
    category: "crm",
    icon: "users",
    colorClass: "bg-blue-700",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "search",
      objectType: "Lead",
      query: "",
      clientId: "",
      clientSecret: "",
      username: "",
      password: "",
    },
  },
  {
    type: "hubspot",
    name: "HubSpot",
    description: "Work with HubSpot CRM",
    category: "crm",
    icon: "users",
    colorClass: "bg-orange-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "get",
      resource: "contacts",
      apiKey: "",
    },
  },
  {
    type: "pipedrive",
    name: "Pipedrive",
    description: "Work with Pipedrive CRM",
    category: "crm",
    icon: "users",
    colorClass: "bg-green-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "get",
      resource: "deals",
      apiToken: "",
    },
  },
  {
    type: "airtable",
    name: "Airtable",
    description: "Work with Airtable databases",
    category: "crm",
    icon: "database",
    colorClass: "bg-red-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "list",
      baseId: "",
      tableName: "",
      apiKey: "",
    },
  },

  // MARKETING & SOCIAL
  {
    type: "twitter",
    name: "Twitter",
    description: "Work with Twitter API",
    category: "social",
    icon: "share",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "tweet",
      text: "",
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      accessTokenSecret: "",
    },
  },
  {
    type: "facebook",
    name: "Facebook",
    description: "Work with Facebook API",
    category: "social",
    icon: "share",
    colorClass: "bg-blue-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "post",
      message: "",
      pageId: "",
      accessToken: "",
    },
  },
  {
    type: "instagram",
    name: "Instagram",
    description: "Work with Instagram API",
    category: "social",
    icon: "camera",
    colorClass: "bg-purple-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "post",
      imageUrl: "",
      caption: "",
      accessToken: "",
    },
  },
  {
    type: "linkedin",
    name: "LinkedIn",
    description: "Work with LinkedIn API",
    category: "social",
    icon: "users",
    colorClass: "bg-blue-700",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "post",
      text: "",
      accessToken: "",
    },
  },
  {
    type: "mailchimp",
    name: "Mailchimp",
    description: "Work with Mailchimp email marketing",
    category: "marketing",
    icon: "mail",
    colorClass: "bg-yellow-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "addMember",
      listId: "",
      email: "",
      apiKey: "",
    },
  },

  // PRODUCTIVITY
  {
    type: "google_sheets",
    name: "Google Sheets",
    description: "Work with Google Sheets",
    category: "productivity",
    icon: "file-text",
    colorClass: "bg-green-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "read",
      spreadsheetId: "",
      range: "A1:Z1000",
    },
  },
  {
    type: "microsoft_excel",
    name: "Microsoft Excel",
    description: "Work with Excel files",
    category: "productivity",
    icon: "file-text",
    colorClass: "bg-green-700",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "read",
      workbook: "",
      worksheet: "",
    },
  },
  {
    type: "notion",
    name: "Notion",
    description: "Work with Notion pages and databases",
    category: "productivity",
    icon: "book",
    colorClass: "bg-gray-800",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "getPages",
      databaseId: "",
      apiKey: "",
    },
  },
  {
    type: "trello",
    name: "Trello",
    description: "Work with Trello boards",
    category: "productivity",
    icon: "bookmark",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "create",
      resource: "card",
      boardId: "",
      listId: "",
      name: "",
      apiKey: "",
      token: "",
    },
  },
  {
    type: "asana",
    name: "Asana",
    description: "Work with Asana projects",
    category: "productivity",
    icon: "check",
    colorClass: "bg-red-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "create",
      resource: "task",
      projectId: "",
      name: "",
      accessToken: "",
    },
  },

  // E-COMMERCE
  {
    type: "shopify",
    name: "Shopify",
    description: "Work with Shopify stores",
    category: "ecommerce",
    icon: "shopping-cart",
    colorClass: "bg-green-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "getAll",
      resource: "products",
      shopName: "",
      accessToken: "",
    },
  },
  {
    type: "woocommerce",
    name: "WooCommerce",
    description: "Work with WooCommerce stores",
    category: "ecommerce",
    icon: "shopping-cart",
    colorClass: "bg-purple-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "getAll",
      resource: "products",
      url: "",
      consumerKey: "",
      consumerSecret: "",
    },
  },
  {
    type: "stripe",
    name: "Stripe",
    description: "Work with Stripe payments",
    category: "ecommerce",
    icon: "credit-card",
    colorClass: "bg-blue-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "getAll",
      resource: "charges",
      secretKey: "",
    },
  },
  {
    type: "paypal",
    name: "PayPal",
    description: "Work with PayPal payments",
    category: "ecommerce",
    icon: "credit-card",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "getAll",
      resource: "payments",
      clientId: "",
      clientSecret: "",
      environment: "sandbox",
    },
  },

  // AI & ML
  {
    type: "openai",
    name: "OpenAI",
    description: "Work with OpenAI API",
    category: "ai",
    icon: "brain",
    colorClass: "bg-green-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "chat",
      model: "gpt-4",
      prompt: "",
      temperature: "0.7",
      maxTokens: "1000",
      apiKey: "",
    },
  },
  {
    type: "anthropic",
    name: "Anthropic Claude",
    description: "Work with Anthropic Claude API",
    category: "ai",
    icon: "brain",
    colorClass: "bg-orange-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      model: "claude-3-sonnet",
      prompt: "",
      maxTokens: "1000",
      apiKey: "",
    },
  },
  {
    type: "google_palm",
    name: "Google PaLM",
    description: "Work with Google PaLM API",
    category: "ai",
    icon: "brain",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "generateText",
      prompt: "",
      model: "text-bison-001",
      apiKey: "",
    },
  },

  // UTILITIES
  {
    type: "html_extract",
    name: "HTML Extract",
    description: "Extract data from HTML",
    category: "utility",
    icon: "code",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      dataPropertyName: "data",
      extractionValues: "[]",
    },
  },
  {
    type: "xml",
    name: "XML",
    description: "Parse and generate XML",
    category: "utility",
    icon: "file-code",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "parse",
      dataPropertyName: "data",
    },
  },
  {
    type: "json",
    name: "JSON",
    description: "Parse and generate JSON",
    category: "utility",
    icon: "file-code",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "parse",
      dataPropertyName: "data",
    },
  },
  {
    type: "csv",
    name: "CSV",
    description: "Parse and generate CSV files",
    category: "utility",
    icon: "file-text",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "parse",
      delimiter: ",",
      encoding: "utf8",
    },
  },
  {
    type: "crypto",
    name: "Crypto",
    description: "Encrypt and decrypt data",
    category: "utility",
    icon: "lock",
    colorClass: "bg-red-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "encrypt",
      algorithm: "aes256",
      dataPropertyName: "data",
      password: "",
    },
  },
  {
    type: "date_time",
    name: "Date & Time",
    description: "Work with dates and times",
    category: "utility",
    icon: "clock",
    colorClass: "bg-blue-500",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "format",
      value: "",
      format: "YYYY-MM-DD",
      timezone: "UTC",
    },
  },
  {
    type: "regex",
    name: "Regular Expression",
    description: "Extract and replace using regex",
    category: "utility",
    icon: "search",
    colorClass: "bg-purple-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "extractAll",
      regex: "",
      flags: "g",
      dataPropertyName: "data",
    },
  },
  {
    type: "text_manipulation",
    name: "Text Manipulation",
    description: "Transform and manipulate text",
    category: "utility",
    icon: "type",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      operation: "replace",
      searchValue: "",
      replaceValue: "",
      dataPropertyName: "data",
    },
  },
  {
    type: "hash",
    name: "Hash",
    description: "Generate hash values",
    category: "utility",
    icon: "hash",
    colorClass: "bg-gray-600",
    inputs: [{ id: "input", name: "Input", type: "any" }],
    outputs: [{ id: "output", name: "Output", type: "any" }],
    defaultParameters: {
      algorithm: "md5",
      dataPropertyName: "data",
      encoding: "hex",
    },
  },
];

// Enhanced render icon function with all the new icons
export const renderN8nIcon = (type: NodeIconType): React.ReactNode => {
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
    case "clock":
      return <Clock size={16} color="white" />;
    case "play":
      return <PlayCircle size={16} color="white" />;
    case "stop":
      return <StopCircle size={16} color="white" />;
    case "git-branch":
      return <GitBranch size={16} color="white" />;
    case "repeat":
      return <Repeat size={16} color="white" />;
    case "timer":
      return <Timer size={16} color="white" />;
    case "zap":
      return <Zap size={16} color="white" />;
    case "code":
      return <Code size={16} color="white" />;
    case "file-code":
      return <FileCode size={16} color="white" />;
    case "hash":
      return <Hash size={16} color="white" />;
    case "type":
      return <Type size={16} color="white" />;
    case "calculator":
      return <Calculator size={16} color="white" />;
    case "shuffle":
      return <Shuffle size={16} color="white" />;
    case "split":
      return <Split size={16} color="white" />;
    case "merge":
      return <Merge size={16} color="white" />;
    case "download":
      return <Download size={16} color="white" />;
    case "upload":
      return <Upload size={16} color="white" />;
    case "cloud":
      return <Cloud size={16} color="white" />;
    case "settings":
      return <Settings size={16} color="white" />;
    case "alert":
      return <AlertTriangle size={16} color="white" />;
    case "check":
      return <CheckCircle size={16} color="white" />;
    case "x":
      return <XCircle size={16} color="white" />;
    case "info":
      return <Info size={16} color="white" />;
    case "search":
      return <Search size={16} color="white" />;
    case "edit":
      return <Edit size={16} color="white" />;
    case "trash":
      return <Trash2 size={16} color="white" />;
    case "copy":
      return <Copy size={16} color="white" />;
    case "link":
      return <Link size={16} color="white" />;
    case "refresh":
      return <RefreshCw size={16} color="white" />;
    case "arrow-up":
      return <ArrowUp size={16} color="white" />;
    case "arrow-down":
      return <ArrowDown size={16} color="white" />;
    case "arrow-left":
      return <ArrowLeft size={16} color="white" />;
    case "arrow-right":
      return <ArrowRight size={16} color="white" />;
    case "plus":
      return <Plus size={16} color="white" />;
    case "minus":
      return <Minus size={16} color="white" />;
    case "save":
      return <Save size={16} color="white" />;
    case "folder":
      return <FolderOpen size={16} color="white" />;
    case "file-type":
      return <FileType size={16} color="white" />;
    case "map":
      return <MapPin size={16} color="white" />;
    case "phone":
      return <Phone size={16} color="white" />;
    case "credit-card":
      return <CreditCard size={16} color="white" />;
    case "shopping-cart":
      return <ShoppingCart size={16} color="white" />;
    case "trending-up":
      return <TrendingUp size={16} color="white" />;
    case "activity":
      return <Activity size={16} color="white" />;
    case "bar-chart-2":
      return <BarChart size={16} color="white" />;
    case "pie-chart":
      return <PieChart size={16} color="white" />;
    case "line-chart":
      return <LineChart size={16} color="white" />;
    case "home":
      return <Home size={16} color="white" />;
    case "building":
      return <Building size={16} color="white" />;
    case "users-2":
      return <Users2 size={16} color="white" />;
    case "user-check":
      return <UserCheck size={16} color="white" />;
    case "bell":
      return <Bell size={16} color="white" />;
    case "book":
      return <BookOpen size={16} color="white" />;
    case "bookmark":
      return <Bookmark size={16} color="white" />;
    case "tag":
      return <Tag size={16} color="white" />;
    case "star":
      return <Star size={16} color="white" />;
    case "heart":
      return <Heart size={16} color="white" />;
    case "eye":
      return <Eye size={16} color="white" />;
    case "eye-off":
      return <EyeOff size={16} color="white" />;
    case "lock":
      return <Lock size={16} color="white" />;
    case "unlock":
      return <Unlock size={16} color="white" />;
    case "shield":
      return <Shield size={16} color="white" />;
    case "server":
      return <Server size={16} color="white" />;
    case "hard-drive":
      return <HardDrive size={16} color="white" />;
    case "cpu":
      return <Cpu size={16} color="white" />;    case "memory":
      return <HardDrive size={16} color="white" />;
    case "monitor":
      return <Monitor size={16} color="white" />;
    case "smartphone":
      return <Smartphone size={16} color="white" />;
    case "tablet":
      return <Tablet size={16} color="white" />;
    case "laptop":
      return <Laptop size={16} color="white" />;
    case "headphones":
      return <Headphones size={16} color="white" />;
    case "mic":
      return <Mic size={16} color="white" />;
    case "camera":
      return <Camera size={16} color="white" />;
    case "video":
      return <Video size={16} color="white" />;
    case "music":
      return <Music size={16} color="white" />;
    case "volume":
      return <Volume2 size={16} color="white" />;
    case "volume-x":
      return <VolumeX size={16} color="white" />;
    case "wifi":
      return <Wifi size={16} color="white" />;
    case "wifi-off":
      return <WifiOff size={16} color="white" />;
    case "bluetooth":
      return <Bluetooth size={16} color="white" />;
    case "usb":
      return <Usb size={16} color="white" />;
    case "mouse":
      return <MousePointer size={16} color="white" />;
    case "keyboard":
      return <Keyboard size={16} color="white" />;
    case "printer":
      return <Printer size={16} color="white" />;
    case "scan":
      return <ScanLine size={16} color="white" />;
    case "qr-code":
      return <QrCode size={16} color="white" />;
    case "barcode":
      return <Barcode size={16} color="white" />;
    case "package":
      return <Package size={16} color="white" />;
    case "truck":
      return <Truck size={16} color="white" />;
    case "plane":
      return <Plane size={16} color="white" />;
    case "car":
      return <Car size={16} color="white" />;
    case "bike":
      return <Bike size={16} color="white" />;
    case "bus":
      return <Bus size={16} color="white" />;
    default:
      return null;
  }
};

// Get node type by type
export const getN8nNodeTypeByType = (type: string): NodeType | undefined => {
  return n8nNodeTypes.find((nt) => nt.type === type);
};

// Comprehensive node categories for n8n
export const n8nNodeCategories = [
  {
    id: "triggers",
    name: "🚀 Triggers",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "triggers")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "core",
    name: "⚙️ Core",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "core")
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
    name: "🤖 AI & Machine Learning",
    nodes: n8nNodeTypes
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
    id: "communication",
    name: "💬 Communication",
    nodes: n8nNodeTypes
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
    id: "database",
    name: "🗄️ Databases",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "database")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "cloud",
    name: "☁️ Cloud Services",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "cloud")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "crm",
    name: "👥 CRM & Sales",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "crm")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "social",
    name: "📱 Social Media",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "social")
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
    name: "📢 Marketing",
    nodes: n8nNodeTypes
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
    id: "productivity",
    name: "📊 Productivity",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "productivity")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "ecommerce",
    name: "🛒 E-Commerce",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "ecommerce")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
  {
    id: "utility",
    name: "🔧 Utilities",
    nodes: n8nNodeTypes
      .filter((node) => node.category === "utility")
      .map((node) => ({
        type: node.type,
        name: node.name,
        description: node.description,
        icon: node.icon,
        colorClass: node.colorClass,
      })),
  },
];
