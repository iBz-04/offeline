# Contributing to Offeline

Thank you for your interest in contributing to Offeline! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear, descriptive title
- Detailed steps to reproduce the issue
- Expected vs actual behavior
- Your environment (OS, browser, backend, etc.)
- Screenshots or logs if applicable

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating an issue.

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain the use case and benefits
- Include mockups or examples if applicable

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md).

### Improving Documentation

Documentation improvements are always appreciated:

- Fix typos or clarify unclear sections
- Add missing documentation
- Improve code examples
- Translate documentation

Use the [Documentation Issue template](.github/ISSUE_TEMPLATE/documentation.md).

### Contributing Code

1. **Find an issue to work on** - Look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue** - Let others know you're working on it
3. **Fork the repository**
4. **Create a branch** - Use a descriptive name (e.g., `fix/chat-history-bug` or `feature/voice-commands`)
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Git

### Web Application Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/offeline.git
cd offeline

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Desktop Application Setup

```bash
# Navigate to desktop folder
cd desktop

# Install dependencies
pnpm install

# Build and run
pnpm build
pnpm start
```

### Running with Different Backends

- **WebGPU**: Works in the browser by default (requires WebGPU-compatible browser)
- **Ollama**: Install [Ollama](https://ollama.ai/) separately, then select in the app
- **llama.cpp**: Bundled with the desktop app

## Pull Request Process

1. **Update your branch** - Ensure your branch is up to date with `main`
2. **Run linter** - `pnpm lint` should pass without errors
3. **Run type check** - `pnpm tsc --noEmit` should pass
4. **Test your changes** - Manually test all affected functionality
5. **Update documentation** - If you changed behavior, update the README or docs
6. **Fill out the PR template** - Provide clear description of changes
7. **Link related issues** - Use "Fixes #123" or "Closes #456" in the PR description
8. **Wait for review** - Maintainers will review and may request changes

### PR Requirements

- ✅ All CI checks must pass
- ✅ Code must follow project style guidelines
- ✅ No merge conflicts
- ✅ Descriptive commit messages
- ✅ Updated documentation if needed

## Coding Standards

### TypeScript/React

- Use TypeScript for type safety
- Use functional components with hooks
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### File Organization

```
src/
├── app/          # Next.js app router pages
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions and helpers
├── providers/    # Context providers
└── types/        # TypeScript type definitions
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use them
- **Line length**: Aim for < 100 characters
- **Naming**:
  - Components: PascalCase (e.g., `ChatBottombar`)
  - Files: kebab-case (e.g., `chat-bottombar.tsx`)
  - Functions: camelCase (e.g., `handleSubmit`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### Linting

Run the linter before committing:

```bash
pnpm lint
```

## Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(chat): add voice input support

fix(backend): resolve ollama connection timeout

docs(readme): update installation instructions

refactor(ui): simplify chat message rendering
```

## Questions?

If you have questions, feel free to:

- Open a [discussion](https://github.com/iBz-04/offeline/discussions)
- Ask in an issue
- Reach out to maintainers

Thank you for contributing to Offeline! 🎉
