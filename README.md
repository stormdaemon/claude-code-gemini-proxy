# 🚀 Claude Code Gemini Proxy

**Use Google Gemini models in Claude Code via Vertex AI**

This proxy server transparently translates Anthropic API calls to Google Vertex AI, allowing you to use powerful Gemini models (Flash, Pro, and Experimental) directly in Claude Code.

## ✨ Features

- 🔄 **Transparent API Translation** - Claude Code thinks it's talking to Claude, but it's actually using Gemini
- ⚡ **Multiple Models** - Choose between Gemini 2.0 Flash, Pro, or Experimental
- 🌊 **Streaming Support** - Real-time streaming responses just like Claude
- 🔐 **Flexible Auth** - Supports Service Account, gcloud CLI, or Application Default Credentials
- 🎨 **Interactive Setup** - Simple CLI wizard to configure everything
- 🌍 **Multi-Region** - Deploy in any GCP region

## 📦 Installation

```bash
npm install -g claude-code-gemini-proxy
```

Or install locally:

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-gemini-proxy.git
cd claude-code-gemini-proxy
npm install
npm run build
npm link
```

## 🚀 Quick Start

### 1. Setup (One-time)

Run the interactive setup wizard:

```bash
gemini-proxy setup
```

You'll be prompted to:
- ✅ Choose a Gemini model (Flash / Pro / Experimental)
- ✅ Select authentication method
- ✅ Enter your GCP Project ID
- ✅ Choose a region
- ✅ Test the connection

### 2. Start the Proxy

```bash
gemini-proxy start
```

The proxy will start on `http://localhost:8080` (or your configured port).

### 3. Configure Claude Code

In your terminal, set these environment variables:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
export ANTHROPIC_API_KEY=dummy-key
```

Add them to your `~/.bashrc` or `~/.zshrc` to make them permanent:

```bash
echo 'export ANTHROPIC_BASE_URL=http://localhost:8080' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY=dummy-key' >> ~/.zshrc
source ~/.zshrc
```

### 4. Use Claude Code!

Now just use Claude Code normally - it will use Gemini instead:

```bash
claude "Explain this function"
```

## 🎮 CLI Commands

| Command | Description |
|---------|-------------|
| `gemini-proxy setup` | Interactive setup wizard |
| `gemini-proxy start` | Start the proxy server |
| `gemini-proxy status` | Show current configuration |
| `gemini-proxy test` | Test connection to Vertex AI |
| `gemini-proxy reset` | Clear all configuration |

## 🔐 Authentication

### Option 1: Application Default Credentials (Easiest)

```bash
gcloud auth application-default login
```

Then choose "Application Default Credentials" in the setup.

### Option 2: Service Account

1. Create a service account in GCP Console
2. Download the JSON key file
3. Choose "Service Account JSON file" in the setup
4. Provide the path to your key file

### Option 3: gcloud CLI

If you're already authenticated with gcloud, just choose "gcloud" in the setup.

## 🤖 Available Models

| Model | Description | Context Window | Best For |
|-------|-------------|----------------|----------|
| **gemini-2.0-flash-exp** | Fast & efficient | 1M tokens | Quick responses, code completion |
| **gemini-2.0-pro-exp** | Balanced performance | 2M tokens | General purpose, complex tasks |
| **gemini-exp-1206** | Experimental & powerful | 2M tokens | Cutting-edge capabilities |

## 🛠️ Configuration

Configuration is stored in `~/.config/gemini-proxy/config.json`

Example configuration:

```json
{
  "projectId": "my-gcp-project",
  "location": "us-central1",
  "model": "gemini-2.0-flash-exp",
  "authMethod": "adc",
  "port": 8080
}
```

## 🌍 Supported Regions

- `us-central1` (Iowa)
- `us-east4` (Virginia)
- `europe-west1` (Belgium)
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)

## 🔧 Advanced Usage

### Running as a Background Service

#### Linux/Mac (systemd)

Create `/etc/systemd/system/gemini-proxy.service`:

```ini
[Unit]
Description=Gemini Proxy Server
After=network.target

[Service]
Type=simple
User=yourusername
ExecStart=/usr/local/bin/gemini-proxy start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable gemini-proxy
sudo systemctl start gemini-proxy
```

#### Mac (launchd)

Create `~/Library/LaunchAgents/com.gemini-proxy.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.gemini-proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/gemini-proxy</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load:

```bash
launchctl load ~/Library/LaunchAgents/com.gemini-proxy.plist
```

### Custom Port

```bash
# During setup, choose a different port
# Or edit ~/.config/gemini-proxy/config.json directly
```

### Change Model

```bash
gemini-proxy reset
gemini-proxy setup
# Choose a different model
```

## 🐛 Troubleshooting

### Authentication Errors

```bash
# Test your auth
gemini-proxy test

# Re-authenticate with gcloud
gcloud auth application-default login

# Verify your service account has permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8080

# Or change the port during setup
gemini-proxy reset
gemini-proxy setup
```

### Claude Code Not Using Proxy

Make sure environment variables are set:

```bash
echo $ANTHROPIC_BASE_URL  # Should be http://localhost:8080
echo $ANTHROPIC_API_KEY   # Should be dummy-key or anything

# Re-export them
export ANTHROPIC_BASE_URL=http://localhost:8080
export ANTHROPIC_API_KEY=dummy-key
```

### Vertex AI API Not Enabled

```bash
# Enable the Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

## 📚 How It Works

```
┌─────────────────┐
│   Claude Code   │  Thinks it's calling Anthropic API
└────────┬────────┘
         │ POST /v1/messages
         ↓
┌─────────────────────┐
│  Gemini Proxy       │  Translates request format
│  (localhost:8080)   │  Routes to Vertex AI
└────────┬────────────┘
         │ POST /v1/projects/.../models/gemini-...:generateContent
         ↓
┌─────────────────────┐
│  Vertex AI Gemini   │  Processes with Gemini
│  (GCP)              │  Returns response
└─────────────────────┘
```

The proxy:
1. Accepts Anthropic API format requests
2. Translates them to Gemini API format
3. Calls Vertex AI
4. Translates responses back to Anthropic format
5. Returns to Claude Code

## 🔒 Security

- Service account keys are stored locally only
- No data is logged or transmitted except to Vertex AI
- All authentication uses official Google libraries
- HTTPS is used for all Vertex AI communication

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [Fastify](https://www.fastify.io/) - Web server
- [Google Cloud AI Platform](https://cloud.google.com/vertex-ai) - Gemini API
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI
- [Chalk](https://github.com/chalk/chalk) - Terminal styling

## 🆘 Support

- 🐛 [Report a bug](https://github.com/YOUR_USERNAME/claude-code-gemini-proxy/issues)
- 💡 [Request a feature](https://github.com/YOUR_USERNAME/claude-code-gemini-proxy/issues)
- 💬 [Ask a question](https://github.com/YOUR_USERNAME/claude-code-gemini-proxy/discussions)

## ⭐ Star History

If this project helps you, consider giving it a star! ⭐

---

**Made with ❤️ by Droid AI**
