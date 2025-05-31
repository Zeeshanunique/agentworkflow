import { Node, Connection } from "../types";
import { executeAgentTask, AgentType } from "../lib/agents";
// Import removed as it's not currently used in execution logic

// HTTP Request helper function
async function makeHttpRequest(url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: any): Promise<any> {
  try {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    const responseData = await response.json();
    
    return {
      success: true,
      data: responseData,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      status: 0,
    };
  }
}

// Data transformation helper functions
function parseJSON(data: string): any {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error}`);
  }
}

function parseXML(data: string): any {
  // Simple XML to JSON conversion (in a real implementation, you'd use a proper XML parser)
  try {
    // This is a simplified implementation - you'd want to use a proper XML parser like xml2js
    return { xmlData: data };
  } catch (error) {
    throw new Error(`Invalid XML: ${error}`);
  }
}

function parseCSV(data: string): any[] {
  try {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        result.push(obj);
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Invalid CSV: ${error}`);
  }
}

// Date/Time helper functions
function formatDate(date: Date, format: string = 'ISO'): string {
  switch (format) {
    case 'ISO':
      return date.toISOString();
    case 'locale':
      return date.toLocaleString();
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    default:
      return date.toString();
  }
}

// Hash helper functions
async function generateHash(data: string, algorithm: string = 'SHA-256'): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sort nodes in topological order for execution
 */
function topologicalSort(nodes: Node[], connections: Connection[]): Node[] {
  const nodeMap = new Map<string, Node>();
  nodes.forEach((node) => nodeMap.set(node.id, node));

  // Create adjacency list
  const graph: Record<string, string[]> = {};
  nodes.forEach((node) => (graph[node.id] = []));

  // Build dependencies
  connections.forEach((conn) => {
    const fromNodeId = conn.fromNodeId;
    const toNodeId = conn.toNodeId;

    if (graph[toNodeId]) {
      graph[toNodeId].push(fromNodeId);
    }
  });

  // Keeps track of visited nodes
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: Node[] = [];

  function visit(nodeId: string): boolean {
    if (temp.has(nodeId)) {
      // Circular dependency detected
      return false;
    }

    if (visited.has(nodeId)) {
      return true;
    }

    temp.add(nodeId);

    // Visit all dependencies
    for (const dependency of graph[nodeId] || []) {
      if (!visit(dependency)) {
        return false;
      }
    }

    temp.delete(nodeId);
    visited.add(nodeId);

    // Add node to result if it exists
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    return true;
  }

  // Visit all nodes
  for (const node of nodes) {
    if (!visit(node.id)) {
      // If circular dependency is detected, return nodes in original order
      console.error("Circular dependency detected in workflow");
      return nodes;
    }
  }

  // Reverse to get correct execution order
  return result.reverse();
}

/**
 * Execute a specific node based on its type and parameters
 */
async function executeNode(
  node: Node,
  inputData: Record<string, any>,
): Promise<Record<string, any>> {
  console.log(`Executing node: ${node.data?.name || node.id} (${node.data?.nodeType?.type || node.type})`, {
    inputs: inputData,
    parameters: node.parameters,
  });

  // Check if node has necessary configuration
  if (!node.parameters || Object.keys(node.parameters).length === 0) {
    throw new Error(
      `Node ${node.data?.name || node.id} is not configured properly. Please add required parameters.`,
    );
  }

  // Output data object
  const outputData: Record<string, any> = {};

  try {
    // Execute based on node type
    const nodeType = node.data?.nodeType?.type || node.type;
    
    switch (nodeType) {
      // === TRIGGER NODES ===
      case "manual_trigger":
        outputData.triggered = true;
        outputData.timestamp = new Date().toISOString();
        outputData.data = inputData;
        break;

      case "schedule_trigger":
        const schedule = node.parameters.schedule || "0 9 * * 1-5"; // Default: weekdays at 9 AM
        outputData.triggered = true;
        outputData.schedule = schedule;
        outputData.timestamp = new Date().toISOString();
        outputData.nextRun = "Next scheduled run would be calculated here";
        break;

      case "webhook_trigger":
        const webhookPath = node.parameters.path || "/webhook";
        outputData.webhookUrl = `${window.location.origin}/webhook${webhookPath}`;
        outputData.method = node.parameters.method || "POST";
        outputData.payload = inputData.payload || { 
          message: "Webhook triggered",
          timestamp: new Date().toISOString()
        };
        break;

      case "email_trigger":
        outputData.emailReceived = true;
        outputData.from = inputData.from || "sender@example.com";
        outputData.subject = inputData.subject || "New Email";
        outputData.body = inputData.body || "Email content";
        outputData.timestamp = new Date().toISOString();
        break;

      case "file_trigger":
        outputData.fileDetected = true;
        outputData.fileName = inputData.fileName || "document.pdf";
        outputData.filePath = inputData.filePath || "/uploads/document.pdf";
        outputData.fileSize = inputData.fileSize || 1024;
        outputData.timestamp = new Date().toISOString();
        break;

      // === CORE NODES ===
      case "http_request":
        if (!node.parameters.url) {
          throw new Error("HTTP Request URL is required");
        }
        
        const httpResult = await makeHttpRequest(
          node.parameters.url,
          node.parameters.method || 'GET',
          node.parameters.headers || {},
          node.parameters.body
        );
        
        if (httpResult.success) {
          outputData.response = httpResult.data;
          outputData.status = httpResult.status;
          outputData.headers = httpResult.headers;
        } else {
          outputData.error = httpResult.error;
          outputData.status = httpResult.status;
        }
        break;

      case "set":
        const values = node.parameters.values || {};
        outputData.data = { ...inputData, ...values };
        break;

      case "if_node":
        const conditionResult = Boolean(inputData[node.parameters.field] === node.parameters.value);
        
        if (conditionResult) {
          outputData.true = inputData;
        } else {
          outputData.false = inputData;
        }
        break;

      case "switch":
        const switchField = node.parameters.field || "type";
        const switchValue = inputData[switchField];
        const rules = node.parameters.rules || [];
        
        let matched = false;
        for (const rule of rules) {
          if (rule.value === switchValue) {
            outputData[rule.output || "default"] = inputData;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          outputData.default = inputData;
        }
        break;

      case "merge":
        const mergeMode = node.parameters.mode || "combine";
        const data1 = inputData.input1 || [];
        const data2 = inputData.input2 || [];
        
        switch (mergeMode) {
          case "combine":
            outputData.merged = [...data1, ...data2];
            break;
          case "choose_branch":
            outputData.merged = data1.length > 0 ? data1 : data2;
            break;
          default:
            outputData.merged = [...data1, ...data2];
        }
        break;

      case "code":
        const jsCode = node.parameters.jsCode || "return items;";
        try {
          // In a real implementation, you'd use a sandboxed environment
          const func = new Function('items', 'inputData', jsCode);
          outputData.result = func([inputData], inputData);
        } catch (error: any) {
          outputData.error = `Code execution error: ${error.message}`;
        }
        break;

      case "function":
        try {
          // Mock function execution - would execute node.parameters.functionCode in real implementation
          outputData.result = inputData;
          outputData.processed = true;
        } catch (error: any) {
          outputData.error = `Function execution error: ${error.message}`;
        }
        break;

      case "item_lists":
        const operation = node.parameters.operation || "limit";
        const limit = parseInt(node.parameters.limit || "1", 10);
        const inputArray = Array.isArray(inputData.items) ? inputData.items : [inputData];
        
        switch (operation) {
          case "limit":
            outputData.items = inputArray.slice(0, limit);
            break;
          case "skip":
            outputData.items = inputArray.slice(limit);
            break;
          case "sort":
            const sortField = node.parameters.sortField || "name";
            outputData.items = [...inputArray].sort((a, b) => 
              a[sortField] > b[sortField] ? 1 : -1
            );
            break;
          default:
            outputData.items = inputArray;
        }
        break;

      case "wait":
        const waitTime = parseInt(node.parameters.time || "1", 10);
        const unit = node.parameters.unit || "seconds";
        
        // Simulate wait (in real implementation, this would be handled by the workflow engine)
        outputData.waited = true;
        outputData.duration = `${waitTime} ${unit}`;
        outputData.resumedAt = new Date().toISOString();
        outputData.data = inputData;
        break;

      case "no_op":
        // No operation - just pass data through
        outputData.data = inputData;
        outputData.processed = true;
        break;

      // === DATABASE NODES ===
      case "mysql":
        const mysqlQuery = node.parameters.query || "SELECT 1";
        outputData.query = mysqlQuery;
        outputData.result = [{ id: 1, name: "Mock Result", created_at: new Date().toISOString() }];
        outputData.rowCount = 1;
        break;

      case "postgresql":
        const pgQuery = node.parameters.query || "SELECT 1";
        outputData.query = pgQuery;
        outputData.result = [{ id: 1, name: "Mock Result", created_at: new Date().toISOString() }];
        outputData.rowCount = 1;
        break;

      case "mongodb":
        const collection = node.parameters.collection || "users";
        const mongoQuery = node.parameters.query || "{}";
        outputData.collection = collection;
        outputData.query = mongoQuery;
        outputData.result = [{ _id: "507f1f77bcf86cd799439011", name: "Mock User" }];
        break;

      case "redis":
        const redisOperation = node.parameters.operation || "get";
        const key = node.parameters.key || "cache_key";
        
        switch (redisOperation) {
          case "get":
            outputData.value = `cached_value_for_${key}`;
            break;
          case "set":
            outputData.set = true;
            outputData.key = key;
            outputData.value = node.parameters.value;
            break;
          default:
            outputData.operation = redisOperation;
        }
        break;

      // === COMMUNICATION NODES ===
      case "email":
        if (!node.parameters.to) {
          throw new Error("Email recipient is required");
        }
        
        outputData.sent = true;
        outputData.to = node.parameters.to;
        outputData.subject = node.parameters.subject || "No Subject";
        outputData.body = node.parameters.body || "";
        outputData.messageId = `email_${Date.now()}`;
        break;

      case "slack":
        if (!node.parameters.channel) {
          throw new Error("Slack channel is required");
        }
        
        outputData.sent = true;
        outputData.channel = node.parameters.channel;
        outputData.message = node.parameters.message || "Hello from n8n workflow!";
        outputData.timestamp = new Date().toISOString();
        break;

      case "discord":
        if (!node.parameters.webhookUrl) {
          throw new Error("Discord webhook URL is required");
        }
        
        outputData.sent = true;
        outputData.message = node.parameters.message || "Hello from Discord!";
        outputData.messageId = `discord_${Date.now()}`;
        break;

      case "telegram":
        if (!node.parameters.chatId) {
          throw new Error("Telegram chat ID is required");
        }
        
        outputData.sent = true;
        outputData.chatId = node.parameters.chatId;
        outputData.message = node.parameters.message || "Hello from Telegram!";
        outputData.messageId = `telegram_${Date.now()}`;
        break;

      case "whatsapp":
        if (!node.parameters.phoneNumber) {
          throw new Error("WhatsApp phone number is required");
        }
        
        outputData.sent = true;
        outputData.phoneNumber = node.parameters.phoneNumber;
        outputData.message = node.parameters.message || "Hello from WhatsApp!";
        outputData.messageId = `whatsapp_${Date.now()}`;
        break;

      case "sms":
        if (!node.parameters.phoneNumber) {
          throw new Error("SMS phone number is required");
        }
        
        outputData.sent = true;
        outputData.phoneNumber = node.parameters.phoneNumber;
        outputData.message = node.parameters.message || "Hello from SMS!";
        outputData.messageId = `sms_${Date.now()}`;
        break;

      // === CLOUD SERVICES ===
      case "google_drive":
        const driveOperation = node.parameters.operation || "upload";
        
        switch (driveOperation) {
          case "upload":
            outputData.fileId = `gdrive_${Date.now()}`;
            outputData.fileName = node.parameters.fileName || "document.pdf";
            outputData.uploaded = true;
            break;
          case "download":
            outputData.fileContent = "Base64 encoded file content would be here";
            outputData.fileName = node.parameters.fileName || "document.pdf";
            break;
          case "list":
            outputData.files = [
              { id: "1", name: "Document 1.pdf", size: 1024 },
              { id: "2", name: "Image.jpg", size: 2048 },
            ];
            break;
        }
        break;

      case "dropbox":
        const dropboxOperation = node.parameters.operation || "upload";
        
        switch (dropboxOperation) {
          case "upload":
            outputData.uploaded = true;
            outputData.path = node.parameters.path || "/document.pdf";
            break;
          case "download":
            outputData.fileContent = "File content would be here";
            outputData.path = node.parameters.path || "/document.pdf";
            break;
        }
        break;

      case "aws_s3":
        const s3Operation = node.parameters.operation || "upload";
        const bucket = node.parameters.bucket || "my-bucket";
        
        switch (s3Operation) {
          case "upload":
            outputData.uploaded = true;
            outputData.bucket = bucket;
            outputData.key = node.parameters.key || "document.pdf";
            outputData.etag = `"${Date.now()}"`;
            break;
          case "download":
            outputData.content = "File content would be here";
            outputData.bucket = bucket;
            outputData.key = node.parameters.key || "document.pdf";
            break;
        }
        break;

      case "google_cloud_storage":
        const gcsOperation = node.parameters.operation || "upload";
        const gcsBucket = node.parameters.bucket || "my-gcs-bucket";
        
        switch (gcsOperation) {
          case "upload":
            outputData.uploaded = true;
            outputData.bucket = gcsBucket;
            outputData.fileName = node.parameters.fileName || "document.pdf";
            break;
          case "download":
            outputData.content = "File content would be here";
            outputData.bucket = gcsBucket;
            outputData.fileName = node.parameters.fileName || "document.pdf";
            break;
        }
        break;

      // === CRM & SALES ===
      case "salesforce":
        const sfOperation = node.parameters.operation || "create";
        const sfObject = node.parameters.object || "Contact";
        
        switch (sfOperation) {
          case "create":
            outputData.id = `sf_${Date.now()}`;
            outputData.object = sfObject;
            outputData.created = true;
            break;
          case "update":
            outputData.id = node.parameters.id;
            outputData.object = sfObject;
            outputData.updated = true;
            break;
          case "get":
            outputData.id = node.parameters.id;
            outputData.object = sfObject;
            outputData.data = { name: "Mock Contact", email: "contact@example.com" };
            break;
        }
        break;

      case "hubspot":
        const hsOperation = node.parameters.operation || "create";
        const hsObject = node.parameters.object || "contact";
        
        switch (hsOperation) {
          case "create":
            outputData.id = `hs_${Date.now()}`;
            outputData.object = hsObject;
            outputData.created = true;
            break;
          case "update":
            outputData.id = node.parameters.id;
            outputData.updated = true;
            break;
        }
        break;

      case "pipedrive":
        const pdOperation = node.parameters.operation || "create";
        const pdResource = node.parameters.resource || "deal";
        
        outputData.operation = pdOperation;
        outputData.resource = pdResource;
        outputData.id = `pd_${Date.now()}`;
        outputData.success = true;
        break;

      case "airtable":
        const atOperation = node.parameters.operation || "create";
        const atTable = node.parameters.table || "Table1";
        
        outputData.operation = atOperation;
        outputData.table = atTable;
        outputData.recordId = `rec${Date.now()}`;
        outputData.success = true;
        break;

      // === SOCIAL MEDIA ===
      case "twitter":
        const twitterOperation = node.parameters.operation || "tweet";
        
        switch (twitterOperation) {
          case "tweet":
            outputData.tweetId = `tweet_${Date.now()}`;
            outputData.text = node.parameters.text || "Hello from n8n!";
            outputData.posted = true;
            break;
          case "search":
            outputData.tweets = [
              { id: "1", text: "Mock tweet 1", user: "user1" },
              { id: "2", text: "Mock tweet 2", user: "user2" },
            ];
            break;
        }
        break;

      case "facebook":
        const fbOperation = node.parameters.operation || "post";
        
        outputData.operation = fbOperation;
        outputData.postId = `fb_${Date.now()}`;
        outputData.success = true;
        break;

      case "instagram":
        const igOperation = node.parameters.operation || "post";
        
        outputData.operation = igOperation;
        outputData.mediaId = `ig_${Date.now()}`;
        outputData.success = true;
        break;

      case "linkedin":
        const liOperation = node.parameters.operation || "post";
        
        outputData.operation = liOperation;
        outputData.postId = `li_${Date.now()}`;
        outputData.success = true;
        break;

      case "mailchimp":
        const mcOperation = node.parameters.operation || "add_subscriber";
        const listId = node.parameters.listId || "default_list";
        
        switch (mcOperation) {
          case "add_subscriber":
            outputData.subscriberId = `mc_${Date.now()}`;
            outputData.listId = listId;
            outputData.email = node.parameters.email;
            outputData.subscribed = true;
            break;
          case "send_campaign":
            outputData.campaignId = `camp_${Date.now()}`;
            outputData.sent = true;
            break;
        }
        break;

      // === PRODUCTIVITY ===
      case "google_sheets":
        const gsOperation = node.parameters.operation || "append";
        const sheetId = node.parameters.sheetId || "default_sheet";
        
        switch (gsOperation) {
          case "append":
            outputData.rowsAdded = 1;
            outputData.sheetId = sheetId;
            outputData.success = true;
            break;
          case "read":
            outputData.data = [
              ["Name", "Email", "Phone"],
              ["John Doe", "john@example.com", "123-456-7890"],
            ];
            outputData.sheetId = sheetId;
            break;
        }
        break;

      case "excel":
        const excelOperation = node.parameters.operation || "read";
        
        switch (excelOperation) {
          case "read":
            outputData.data = [
              { Name: "John Doe", Email: "john@example.com" },
              { Name: "Jane Smith", Email: "jane@example.com" },
            ];
            break;
          case "write":
            outputData.written = true;
            outputData.rows = 1;
            break;
        }
        break;

      case "notion":
        const notionOperation = node.parameters.operation || "create_page";
        
        switch (notionOperation) {
          case "create_page":
            outputData.pageId = `notion_${Date.now()}`;
            outputData.title = node.parameters.title || "New Page";
            outputData.created = true;
            break;
          case "update_page":
            outputData.pageId = node.parameters.pageId;
            outputData.updated = true;
            break;
        }
        break;

      case "trello":
        const trelloOperation = node.parameters.operation || "create_card";
        
        switch (trelloOperation) {
          case "create_card":
            outputData.cardId = `trello_${Date.now()}`;
            outputData.name = node.parameters.name || "New Card";
            outputData.created = true;
            break;
          case "update_card":
            outputData.cardId = node.parameters.cardId;
            outputData.updated = true;
            break;
        }
        break;

      case "asana":
        const asanaOperation = node.parameters.operation || "create_task";
        
        switch (asanaOperation) {
          case "create_task":
            outputData.taskId = `asana_${Date.now()}`;
            outputData.name = node.parameters.name || "New Task";
            outputData.created = true;
            break;
          case "update_task":
            outputData.taskId = node.parameters.taskId;
            outputData.updated = true;
            break;
        }
        break;

      // === E-COMMERCE ===
      case "shopify":
        const shopifyOperation = node.parameters.operation || "get_products";
        
        switch (shopifyOperation) {
          case "get_products":
            outputData.products = [
              { id: 1, title: "Product 1", price: "29.99" },
              { id: 2, title: "Product 2", price: "39.99" },
            ];
            break;
          case "create_order":
            outputData.orderId = `shopify_${Date.now()}`;
            outputData.created = true;
            break;
        }
        break;

      case "woocommerce":
        const wcOperation = node.parameters.operation || "get_products";
        
        switch (wcOperation) {
          case "get_products":
            outputData.products = [
              { id: 1, name: "WooCommerce Product 1", price: "19.99" },
              { id: 2, name: "WooCommerce Product 2", price: "29.99" },
            ];
            break;
          case "create_order":
            outputData.orderId = `wc_${Date.now()}`;
            outputData.created = true;
            break;
        }
        break;

      case "stripe":
        const stripeOperation = node.parameters.operation || "create_payment_intent";
        
        switch (stripeOperation) {
          case "create_payment_intent":
            outputData.paymentIntentId = `pi_${Date.now()}`;
            outputData.amount = node.parameters.amount || 1000;
            outputData.currency = node.parameters.currency || "usd";
            outputData.status = "requires_payment_method";
            break;
          case "retrieve_payment":
            outputData.paymentId = node.parameters.paymentId;
            outputData.status = "succeeded";
            outputData.amount = 1000;
            break;
        }
        break;

      case "paypal":
        const paypalOperation = node.parameters.operation || "create_payment";
        
        switch (paypalOperation) {
          case "create_payment":
            outputData.paymentId = `paypal_${Date.now()}`;
            outputData.amount = node.parameters.amount || "10.00";
            outputData.currency = node.parameters.currency || "USD";
            outputData.status = "created";
            break;
          case "execute_payment":
            outputData.paymentId = node.parameters.paymentId;
            outputData.status = "approved";
            break;
        }
        break;

      // === AI & MACHINE LEARNING ===
      case "openai":
        if (!node.parameters.apiKey) {
          throw new Error("OpenAI API key is required");
        }
        
        const prompt = node.parameters.prompt || inputData.prompt || "Hello, how are you?";
        const model = node.parameters.model || "gpt-3.5-turbo";
        
        // Mock OpenAI response
        outputData.response = `AI Response to: "${prompt}" using model ${model}`;
        outputData.model = model;
        outputData.usage = {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        };
        break;

      case "anthropic_claude":
        if (!node.parameters.apiKey) {
          throw new Error("Anthropic API key is required");
        }
        
        const claudePrompt = node.parameters.prompt || inputData.prompt || "Hello Claude!";
        const claudeModel = node.parameters.model || "claude-3-sonnet";
        
        outputData.response = `Claude Response to: "${claudePrompt}" using model ${claudeModel}`;
        outputData.model = claudeModel;
        outputData.usage = {
          input_tokens: 10,
          output_tokens: 20,
        };
        break;

      case "google_palm":
        if (!node.parameters.apiKey) {
          throw new Error("Google PaLM API key is required");
        }
        
        const palmPrompt = node.parameters.prompt || inputData.prompt || "Hello PaLM!";
        
        outputData.response = `PaLM Response to: "${palmPrompt}"`;
        outputData.model = "text-bison";
        break;

      // === UTILITIES ===
      case "html_extract":
        const selector = node.parameters.selector || "p";
        
        // Mock HTML extraction - would parse node.parameters.html or inputData.html in real implementation
        outputData.extracted = "Hello World";
        outputData.selector = selector;
        outputData.found = true;
        break;

      case "xml":
        const xmlOperation = node.parameters.operation || "parse";
        
        switch (xmlOperation) {
          case "parse":
            const xmlData = node.parameters.xml || inputData.xml || "<root><item>value</item></root>";
            outputData.parsed = parseXML(xmlData);
            break;
          case "generate":
            outputData.xml = "<root><generated>true</generated></root>";
            break;
        }
        break;

      case "json":
        const jsonOperation = node.parameters.operation || "parse";
        
        switch (jsonOperation) {
          case "parse":
            const jsonString = node.parameters.json || inputData.json || '{"hello": "world"}';
            outputData.parsed = parseJSON(jsonString);
            break;
          case "stringify":
            outputData.json = JSON.stringify(inputData);
            break;
        }
        break;

      case "csv":
        const csvOperation = node.parameters.operation || "parse";
        
        switch (csvOperation) {
          case "parse":
            const csvData = node.parameters.csv || inputData.csv || "name,email\nJohn,john@example.com";
            outputData.parsed = parseCSV(csvData);
            break;
          case "generate":
            const data = Array.isArray(inputData.data) ? inputData.data : [inputData];
            const headers = Object.keys(data[0] || {});
            let csv = headers.join(',') + '\n';
            data.forEach(row => {
              csv += headers.map(header => row[header] || '').join(',') + '\n';
            });
            outputData.csv = csv;
            break;
        }
        break;

      case "crypto":
        const cryptoOperation = node.parameters.operation || "encrypt";
        const cryptoData = node.parameters.data || inputData.data || "Hello World";
        
        switch (cryptoOperation) {
          case "encrypt":
            // Mock encryption
            outputData.encrypted = btoa(cryptoData);
            outputData.algorithm = "base64";
            break;
          case "decrypt":
            // Mock decryption
            try {
              outputData.decrypted = atob(cryptoData);
            } catch {
              outputData.decrypted = cryptoData;
            }
            break;
          case "hash":
            outputData.hash = await generateHash(cryptoData, node.parameters.algorithm || "SHA-256");
            break;
        }
        break;

      case "date_time":
        const dateOperation = node.parameters.operation || "format";
        const date = new Date(node.parameters.date || inputData.date || Date.now());
        
        switch (dateOperation) {
          case "format":
            outputData.formatted = formatDate(date, node.parameters.format);
            break;
          case "add":
            const addValue = parseInt(node.parameters.value || "1", 10);
            const addUnit = node.parameters.unit || "days";
            const newDate = new Date(date);
            
            switch (addUnit) {
              case "minutes":
                newDate.setMinutes(newDate.getMinutes() + addValue);
                break;
              case "hours":
                newDate.setHours(newDate.getHours() + addValue);
                break;
              case "days":
                newDate.setDate(newDate.getDate() + addValue);
                break;
              case "months":
                newDate.setMonth(newDate.getMonth() + addValue);
                break;
              case "years":
                newDate.setFullYear(newDate.getFullYear() + addValue);
                break;
            }
            
            outputData.result = newDate.toISOString();
            break;
          case "difference":
            const date2 = new Date(node.parameters.date2 || Date.now());
            const diffMs = Math.abs(date.getTime() - date2.getTime());
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            outputData.difference = diffDays;
            outputData.unit = "days";
            break;
        }
        break;

      case "regex":
        const regexOperation = node.parameters.operation || "test";
        const pattern = node.parameters.pattern || "\\d+";
        const text = node.parameters.text || inputData.text || "Hello 123 World";
        
        try {
          const regex = new RegExp(pattern, node.parameters.flags || "g");
          
          switch (regexOperation) {
            case "test":
              outputData.matches = regex.test(text);
              break;
            case "match":
              outputData.matches = text.match(regex) || [];
              break;
            case "replace":
              outputData.result = text.replace(regex, node.parameters.replacement || "");
              break;
          }
        } catch (error: any) {
          outputData.error = `Regex error: ${error.message}`;
        }
        break;

      case "text_manipulation":
        const textOperation = node.parameters.operation || "uppercase";
        const textInput = node.parameters.text || inputData.text || "Hello World";
        
        switch (textOperation) {
          case "uppercase":
            outputData.result = textInput.toUpperCase();
            break;
          case "lowercase":
            outputData.result = textInput.toLowerCase();
            break;
          case "trim":
            outputData.result = textInput.trim();
            break;
          case "split":
            const delimiter = node.parameters.delimiter || " ";
            outputData.result = textInput.split(delimiter);
            break;
          case "length":
            outputData.result = textInput.length;
            break;
          case "substring":
            const start = parseInt(node.parameters.start || "0", 10);
            const end = parseInt(node.parameters.end || textInput.length.toString(), 10);
            outputData.result = textInput.substring(start, end);
            break;
        }
        break;

      case "hash":
        const hashData = node.parameters.data || inputData.data || "Hello World";
        const hashAlgorithm = node.parameters.algorithm || "SHA-256";
        
        outputData.hash = await generateHash(hashData, hashAlgorithm);
        outputData.algorithm = hashAlgorithm;
        outputData.input = hashData;
        break;

      // === EXISTING LEGACY NODES ===
      case "openai_assistant":
        if (!node.parameters.apiKey) {
          throw new Error("OpenAI API key is required");
        }

        outputData.response = `Generated content for: ${inputData.prompt || "No prompt provided"}`;
        outputData.success = true;
        break;

      case "email_sender":
        if (!node.parameters.apiKey) {
          throw new Error("Email service API key is required");
        }

        outputData.sent = true;
        outputData.messageId = `email_${Date.now()}`;
        break;

      case "campaign_scheduler":
        outputData.scheduled = true;
        outputData.campaignId = `campaign_${Date.now()}`;
        break;

      case "ad_generator":
        outputData.adContent = `Generated ad for: ${inputData.product || "Unknown product"}`;
        outputData.adId = `ad_${Date.now()}`;
        break;

      case "marketing_analytics":
        outputData.metrics = {
          impressions: Math.floor(Math.random() * 10000),
          clicks: Math.floor(Math.random() * 1000),
          conversions: Math.floor(Math.random() * 100),
          roi: (Math.random() * 5 + 1).toFixed(2),
        };
        break;

      case "sms_sender":
        if (!node.parameters.apiKey) {
          throw new Error("SMS service API key is required");
        }

        outputData.sent = true;
        outputData.messageId = `sms_${Date.now()}`;
        break;

      case "api_request":
        if (!node.parameters.url) {
          throw new Error("API URL is required");
        }

        outputData.response = {
          status: "success",
          data: { result: "API response data" },
        };
        break;

      case "webhook":
        outputData.payload = inputData.payload || {
          event: "webhook_triggered",
          timestamp: Date.now(),
        };
        break;

      case "conditional":
        const legacyCondition = Boolean(inputData.condition);
        if (legacyCondition) {
          outputData.true = inputData;
        } else {
          outputData.false = inputData;
        }
        break;

      case "filter":
        const property = node.parameters.property || "";
        const operator = node.parameters.operator || "equals";
        const value = node.parameters.value || "";

        if (Array.isArray(inputData.data)) {
          outputData.filtered = inputData.data.filter((item: any) => {
            if (!property || !item) return true;

            const itemValue = item[property];

            switch (operator) {
              case "equals":
                return itemValue === value;
              case "not_equals":
                return itemValue !== value;
              case "contains":
                return String(itemValue).includes(value);
              case "greater_than":
                return Number(itemValue) > Number(value);
              case "less_than":
                return Number(itemValue) < Number(value);
              default:
                return true;
            }
          });
        } else {
          outputData.filtered = [];
        }
        break;

      case "marketing_agent":
        if (!node.parameters.agentType) {
          throw new Error("Agent type is required");
        }
        
        let apiKey = "";
        if (inputData.apiKey) {
          apiKey = inputData.apiKey;
        } else if (node.parameters.apiKey) {
          apiKey = node.parameters.apiKey;
        } else {
          throw new Error("API key is required for agent nodes");
        }
        
        const marketingTask = inputData.task || node.parameters.taskDescription || "Generate marketing content";
        
        const marketingResult = await executeAgentTask(
          AgentType.MARKETING, 
          apiKey, 
          marketingTask
        );
        
        if (marketingResult.success) {
          outputData.output = marketingResult.output;
        } else {
          outputData.error = marketingResult.error;
        }
        break;
        
      case "sales_agent":
        if (!node.parameters.agentType) {
          throw new Error("Agent type is required");
        }
        
        let salesApiKey = "";
        if (inputData.apiKey) {
          salesApiKey = inputData.apiKey;
        } else if (node.parameters.apiKey) {
          salesApiKey = node.parameters.apiKey;
        } else {
          throw new Error("API key is required for agent nodes");
        }
        
        const salesTask = inputData.task || node.parameters.taskDescription || "Generate sales content";
        
        const salesResult = await executeAgentTask(
          AgentType.SALES, 
          salesApiKey, 
          salesTask
        );
        
        if (salesResult.success) {
          outputData.output = salesResult.output;
        } else {
          outputData.error = salesResult.error;
        }
        break;
        
      case "agent_chain":
        let chainApiKey = "";
        if (inputData.apiKey) {
          chainApiKey = inputData.apiKey;
        } else if (node.parameters.apiKey) {
          chainApiKey = node.parameters.apiKey;
        } else {
          throw new Error("API key is required for agent chains");
        }
        
        let agentChainConfig = [];
        try {
          agentChainConfig = JSON.parse(node.parameters.agents || "[]");
        } catch (e) {
          throw new Error("Invalid agent chain configuration");
        }
        
        if (!agentChainConfig.length) {
          throw new Error("Agent chain must contain at least one agent");
        }
        
        let chainInput = inputData.input || "";
        let chainOutput = "";
        
        const maxSteps = parseInt(node.parameters.maxSteps || "5", 10);
        
        for (let i = 0; i < Math.min(agentChainConfig.length, maxSteps); i++) {
          const agentConfig = agentChainConfig[i];
          
          if (!agentConfig.type) {
            throw new Error(`Agent at position ${i} has no type`);
          }
          
          const agentType = agentConfig.type === "marketing" 
            ? AgentType.MARKETING 
            : AgentType.SALES;
          
          const agentTask = `${chainInput}${agentConfig.instructions ? "\n\nInstructions: " + agentConfig.instructions : ""}`;
          
          const agentResult = await executeAgentTask(
            agentType,
            chainApiKey,
            agentTask
          );
          
          if (!agentResult.success) {
            outputData.error = `Error in agent chain at step ${i+1}: ${agentResult.error}`;
            break;
          }
          
          chainInput = agentResult.output;
          chainOutput = agentResult.output;
        }
        
        outputData.output = chainOutput;
        break;

      default:
        // For other node types
        outputData.processed = true;
        outputData.data = inputData;
        outputData.nodeType = nodeType;
    }

    return outputData;
  } catch (error) {
    console.error(`Error executing node ${node.data?.name || node.id}:`, error);
    throw error;
  }
}

/**
 * Get input data for a node based on its connections
 */
function getNodeInputData(
  node: Node,
  connections: Connection[],
  nodeResults: Map<string, Record<string, any>>,
): Record<string, any> {
  const inputData: Record<string, any> = {};

  // Find all connections where this node is the target
  const incomingConnections = connections.filter(
    (conn) => conn.toNodeId === node.id,
  );

  // For each incoming connection, get the output from the source node
  incomingConnections.forEach((conn) => {
    const sourceNodeId = conn.fromNodeId;
    const sourcePortId = conn.fromPortId;
    const targetPortId = conn.toPortId;

    // Get the output data from the source node
    const sourceNodeOutput = nodeResults.get(sourceNodeId) || {};

    // Map to the appropriate input
    if (sourceNodeOutput[sourcePortId] !== undefined) {
      inputData[targetPortId] = sourceNodeOutput[sourcePortId];
    } else if (Object.keys(sourceNodeOutput).length > 0) {
      // If specific port not found but node has output, use the entire output
      inputData[targetPortId] = sourceNodeOutput;
    }
  });

  return inputData;
}

/**
 * Execute the entire workflow
 */
export async function executeWorkflow(
  nodes: Node[],
  connections: Connection[],
): Promise<{ success: boolean; results: Record<string, any>; error?: string }> {
  try {
    // Sort nodes for execution
    const sortedNodes = topologicalSort(nodes, connections);

    // Results for each node
    const nodeResults = new Map<string, Record<string, any>>();

    // Execute nodes in order
    for (const node of sortedNodes) {
      try {
        // Get input data for this node
        const inputData = getNodeInputData(node, connections, nodeResults);

        // Execute the node
        const outputData = await executeNode(node, inputData);

        // Store the result
        nodeResults.set(node.id, outputData);
      } catch (error: any) {
        console.error(`Error in node ${node.data?.name || node.id}:`, error);
        return {
          success: false,
          results: Object.fromEntries(nodeResults.entries()),
          error: `Error in node "${node.data?.name || node.id}": ${error.message}`,
        };
      }
    }

    return {
      success: true,
      results: Object.fromEntries(nodeResults.entries()),
    };
  } catch (error: any) {
    console.error("Error executing workflow:", error);
    return {
      success: false,
      results: {},
      error: `Error executing workflow: ${error.message}`,
    };
  }
}
