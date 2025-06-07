# AI-Integrated IDE

A powerful, modern IDE with integrated AI capabilities, built with Next.js, React, and TypeScript.

## Features

### Core IDE Features

- 🎨 Monaco Editor with syntax highlighting and autocompletion
- 📁 File Explorer with drag-and-drop support
- 🔍 Search functionality with regex support
- 🖥️ Integrated Terminal with full shell support
- 🐛 Advanced Debugger with breakpoint management
- 🔄 Git integration with visual diff viewer
- ✨ Code formatting with Prettier
- 🚨 Linting with ESLint
- 📝 Language Server Protocol support

### AI Features

- 💬 AI Chat Assistant powered by Ollama
- 🤖 Code generation and completion
- 📚 Code explanation and documentation
- 🔄 Code refactoring suggestions
- 🎯 Context-aware code analysis

### Developer Experience

- 🎨 Dark/Light theme support
- ⚡ Fast and responsive UI
- 🔌 Plugin system (coming soon)
- 👥 Multi-user support (coming soon)
- 🌐 Real-time collaboration (coming soon)

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- Ollama (for AI features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-ide.git
cd ai-ide
```

2. Install dependencies:

```bash
npm install
```

3. Set up Ollama:

```bash
# Install Ollama (if not already installed)
curl https://ollama.ai/install.sh | sh

# Pull the CodeLlama model
ollama pull codellama
```

4. Start the development server:

```bash
npm run dev
```

The IDE will be available at `http://localhost:3000`.

## Configuration

### ESLint

The project uses ESLint with TypeScript support. Configuration can be found in `.eslintrc.json`.

### Prettier

Code formatting is handled by Prettier. Configuration can be found in `.prettierrc`.

### Git Hooks

Pre-commit hooks are set up using Husky and lint-staged to ensure code quality:

- Runs ESLint on staged files
- Formats code with Prettier
- Runs TypeScript type checking

## Architecture

### Frontend

- Next.js 14 with App Router
- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- Monaco Editor for code editing
- XTerm.js for terminal emulation

### Backend

- Next.js API routes
- Language Server Protocol integration
- Git integration via simple-git
- Ollama integration for AI features

### AI Integration

- Local model execution via Ollama
- Context-aware code analysis
- Real-time code suggestions
- Natural language code generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [XTerm.js](https://xtermjs.org/)
- [Ollama](https://ollama.ai/)
- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
