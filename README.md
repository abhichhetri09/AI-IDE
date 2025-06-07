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
- 🔨 Built-in compilation and execution support

### AI Features

- 💬 AI Chat Assistant powered by Ollama
- 🤖 Code generation and completion
- 📚 Code explanation and documentation
- 🔄 Code refactoring suggestions
- 🎯 Context-aware code analysis

### Supported Languages

The IDE includes built-in support for compiling and running:

- Python
- JavaScript/TypeScript
- Java
- C/C++
- Go
- Rust
- PHP
- Ruby
- Shell scripts
- HTML/CSS
- SQL
- YAML/XML
- Markdown

## Running as a Standalone Application

### Using Docker (Recommended)

1. Install Docker and Docker Compose on your system
2. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ai-ide.git
   cd ai-ide
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

The IDE will be available at `http://localhost:3000` with all necessary compilers and tools pre-installed.

### Manual Installation

1. Prerequisites:

   - Node.js 18+
   - Git

2. Clone and install dependencies:

   ```bash
   git clone https://github.com/yourusername/ai-ide.git
   cd ai-ide
   npm install
   ```

3. Install language support:

   ```bash
   # Install Python
   python3 -m pip install --user pylint black

   # Install TypeScript
   npm install -g typescript ts-node

   # Install Java
   # Download and install JDK from https://adoptium.net/

   # Install Go
   # Download and install from https://golang.org/

   # Install Rust
   # Install from https://rustup.rs/

   # Install PHP
   # Download from https://www.php.net/

   # Install Ruby
   # Download from https://www.ruby-lang.org/
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

## Using the Built-in Compiler

1. Open a file in the editor
2. Write your code
3. Use the "Run" menu or press F5 to compile and execute
4. View output in the integrated terminal

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
