# Contributing to Claude Code Gemini Proxy

First off, thanks for taking the time to contribute! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce**
- **Provide specific examples**
- **Describe the behavior you observed**
- **Explain which behavior you expected**
- **Include logs and error messages**

**Template:**

```markdown
**Environment:**
- OS: [e.g., macOS 14.0, Ubuntu 22.04]
- Node.js version: [e.g., 18.19.0]
- Package version: [e.g., 1.0.0]

**To Reproduce:**
1. Run `gemini-proxy setup`
2. Choose...
3. See error

**Expected behavior:**
Should connect successfully

**Actual behavior:**
Error: Authentication failed

**Logs:**
```
[paste logs here]
```
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Use a clear and descriptive title**
- **Provide a detailed description of the enhancement**
- **Explain why this would be useful**
- **List potential implementation ideas**

### Pull Requests

1. **Fork the repo** and create your branch from `main`

```bash
git checkout -b feature/my-new-feature
```

2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

3. **Test your changes**

```bash
npm run build
npm run lint
# Test manually with gemini-proxy
```

4. **Commit with clear messages**

```bash
git commit -m "Add support for new Gemini model"
```

5. **Push and create a PR**

```bash
git push origin feature/my-new-feature
```

## Development Setup

### Prerequisites

- Node.js 18+
- GCP account with Vertex AI enabled
- TypeScript knowledge

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-code-gemini-proxy.git
cd claude-code-gemini-proxy

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link

# Test it
gemini-proxy --version
```

### Project Structure

```
src/
├── types.ts         # TypeScript type definitions
├── config.ts        # Configuration management
├── auth.ts          # GCP authentication
├── gemini-client.ts # Vertex AI client
├── translator.ts    # API format translation
├── server.ts        # Fastify proxy server
├── index.ts         # Main entry point
└── cli.ts           # CLI commands
```

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

### Testing

Currently, testing is manual. We'd love contributions for automated tests!

**Manual Testing Checklist:**

- [ ] `gemini-proxy setup` works
- [ ] Authentication succeeds
- [ ] `gemini-proxy start` runs without errors
- [ ] Proxy translates requests correctly
- [ ] Streaming works
- [ ] Error handling works
- [ ] All CLI commands work

### Adding a New Model

1. Add model to `src/types.ts`:

```typescript
export type GeminiModel = 
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.0-pro-exp'
  | 'gemini-exp-1206'
  | 'your-new-model'; // Add here
```

2. Add model info to `src/config.ts`:

```typescript
export const MODELS: Record<GeminiModel, ModelInfo> = {
  // ... existing models
  'your-new-model': {
    name: 'your-new-model',
    displayName: 'Your New Model',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    description: 'Description of your model'
  }
};
```

3. Add to CLI choices in `src/cli.ts`:

```typescript
choices: [
  // ... existing choices
  {
    name: `${chalk.green('🆕')} Your New Model - Description`,
    value: 'your-new-model'
  }
]
```

4. Test it!

### Adding a New Feature

1. **Discuss first** - Open an issue to discuss large changes
2. **Branch** - Create a feature branch
3. **Implement** - Write clean, documented code
4. **Test** - Verify it works in multiple scenarios
5. **Document** - Update README if needed
6. **PR** - Submit with clear description

## Areas We Need Help

- 🧪 **Automated tests** - Unit and integration tests
- 📝 **Documentation** - Improve guides and examples
- 🐛 **Bug fixes** - Check open issues
- ✨ **New features** - See enhancement issues
- 🌐 **Internationalization** - Translate docs
- 🎨 **UI/UX** - Better CLI experience

## Questions?

- Open an issue with the `question` label
- Join discussions on GitHub

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🙏**
