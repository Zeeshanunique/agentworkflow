# Agent Workflow

A modern web application for building, automating, and optimizing AI agent workflows with an intuitive drag-and-drop interface.

## Features

- **Drag-and-Drop Editor**: Create complex workflows without coding
- **AI Integration**: Connect to your favorite AI models and tools
- **Analytics Dashboard**: Monitor performance and optimize workflows
- **User Authentication**: Secure login and registration system
- **Modern UI**: Beautiful and responsive design with dark mode support
- **Neo4j Graph Database**: Store and query workflow data with powerful graph capabilities
- **LangGraph Integration**: Create and execute intelligent agent workflows
- **LangSmith Tracing**: Track and analyze agent interactions and performance

## Tech Stack

- **React**: Frontend library
- **TypeScript**: Type-safe JavaScript
- **Wouter**: Lightweight routing
- **Zustand**: State management
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library based on Radix UI
- **React Hook Form**: Form validation with Zod
- **Neo4j**: Graph database for workflow storage
- **LangChain**: Framework for building LLM applications
- **LangGraph**: Framework for building agentic workflows
- **LangSmith**: Observability platform for LLM apps

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── auth/            # Authentication components
│   ├── common/          # Common UI components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── ui/              # UI components (buttons, inputs, etc.)
│   └── workflow/        # Workflow-specific components
├── data/                # Static data and constants
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and API clients
│   ├── langchain/       # LangChain and LangGraph integration
│   ├── models/          # Data models including Neo4j models
│   └── neo4j.ts         # Neo4j database configuration
├── pages/               # Page components
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard pages
│   ├── home/            # Home/landing pages
│   └── workflow/        # Workflow editor pages
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Neo4j Database (a free Aura instance works great)
- LangSmith account (for observability)
- OpenAI API key (for LLM capabilities)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/agent-workflow.git
   cd agent-workflow
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your:
   - Neo4j connection details (URI, username, password)
   - LangSmith API key and project name
   - OpenAI API key

4. Start the development server
   ```bash
   # Regular development
   npm run dev:all
   
   # Development with Neo4j and LangSmith enabled
   npm run neo4j:dev:all
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Neo4j Integration

This project uses Neo4j to store workflow data as a graph, which provides several advantages:

- **Natural representation**: Workflows are inherently graph structures
- **Efficient queries**: Finding paths and relationships between nodes
- **Flexibility**: Easy to model complex workflow structures

### Setting up Neo4j

1. Create a free [Neo4j Aura](https://neo4j.com/cloud/platform/aura-graph-database/) account
2. Create a new database instance
3. Add the connection details to your `.env` file:
   ```
   NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-password
   ```

## LangGraph & LangSmith

LangGraph enables the creation of stateful, agentic workflows using LLMs. LangSmith provides observability and debugging for these workflows.

### Setting up LangSmith

1. Create a [LangSmith](https://smith.langchain.com/) account
2. Create a new project called "agentworkflow"
3. Get your API key and add it to your `.env` file:
   ```
   LANGCHAIN_API_KEY=your-api-key
   LANGCHAIN_PROJECT=agentworkflow
   ```

## Agent Workflow System

AgentWorkflow now includes powerful LLM-powered agents for marketing and sales automation. The agent system allows you to:

- Create automated marketing and sales workflows using specialized AI agents
- Chain multiple agents together for complex tasks
- Integrate with your existing marketing and sales tools

### Marketing Agent

The marketing agent specializes in generating marketing content, including:

- Blog posts and articles
- Social media content
- Ad copy for various platforms
- Email marketing templates

### Sales Agent

The sales agent focuses on sales communication and lead management:

- Lead qualification and scoring
- Sales email generation
- Objection handling
- Follow-up message creation

### Agent Chaining

You can chain multiple agents together to create complex workflows:

1. A marketing agent generates content ideas
2. Another marketing agent expands those ideas into full content
3. A sales agent creates personalized outreach using that content

## Getting Started with Agents

To use the agent system in your workflows:

1. Add a Marketing Agent or Sales Agent node to your workflow
2. Configure the agent with your OpenAI API key and task description
3. Connect inputs and outputs to other nodes in your workflow

For more complex workflows, use the Agent Chain node to create sequences of agents.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
