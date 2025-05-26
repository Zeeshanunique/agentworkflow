# Agent Workflow

A modern web application for building, automating, and optimizing AI agent workflows with an intuitive drag-and-drop interface.

## Features

- **Drag-and-Drop Editor**: Create complex workflows without coding
- **AI Integration**: Connect to your favorite AI models and tools
- **Analytics Dashboard**: Monitor performance and optimize workflows
- **User Authentication**: Secure login and registration system
- **Modern UI**: Beautiful and responsive design with dark mode support

## Tech Stack

- **React**: Frontend library
- **TypeScript**: Type-safe JavaScript
- **Wouter**: Lightweight routing
- **Zustand**: State management
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library based on Radix UI
- **React Hook Form**: Form validation with Zod

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

- Node.js (v14 or later)
- npm or yarn

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

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
