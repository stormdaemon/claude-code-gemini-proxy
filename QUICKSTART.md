# 🚀 Quick Start Guide

Get Gemini running in Claude Code in **under 2 minutes**.

## Prerequisites

- Node.js 18+ installed
- Claude Code installed
- GCP account with Vertex AI enabled
- Authenticated with gcloud: `gcloud auth application-default login`

## Installation

```bash
npm install -g claude-code-gemini-proxy
```

## Setup (30 seconds)

```bash
gemini-proxy setup
```

**Choose:**
1. **Model**: Gemini 2.0 Flash (recommended)
2. **Auth**: Application Default Credentials
3. **Project ID**: Your GCP project
4. **Region**: us-central1
5. **Port**: 8080 (default)

✅ It will test the connection and start the server!

## Configure Claude Code (30 seconds)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
export ANTHROPIC_API_KEY=dummy-key
```

Reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Use It! (Now)

```bash
claude "Write a hello world in Python"
```

🎉 You're now using **Gemini** in Claude Code!

## Verify It's Working

```bash
# Check proxy status
gemini-proxy status

# Test connection
gemini-proxy test

# View logs (in proxy terminal)
# You'll see API calls being proxied
```

## Pro Tips

### Auto-start on boot (Mac)

```bash
# Create launch agent
cat > ~/Library/LaunchAgents/com.gemini-proxy.plist << 'EOF'
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
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.gemini-proxy.plist
```

### Auto-start on boot (Linux)

```bash
# Create systemd service
sudo tee /etc/systemd/system/gemini-proxy.service << EOF
[Unit]
Description=Gemini Proxy Server
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=$(which gemini-proxy) start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable gemini-proxy
sudo systemctl start gemini-proxy
```

### Switch models easily

```bash
gemini-proxy reset
gemini-proxy setup
# Choose a different model
```

## Troubleshooting

### "Authentication failed"

```bash
gcloud auth application-default login
gemini-proxy test
```

### "Port already in use"

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or choose different port
gemini-proxy reset
gemini-proxy setup  # Choose different port
```

### "Command not found: gemini-proxy"

```bash
# Reinstall globally
npm install -g claude-code-gemini-proxy

# Or use npx
npx claude-code-gemini-proxy setup
```

## Next Steps

- 📚 Read full [README.md](./README.md)
- 🐛 [Report issues](https://github.com/stormdaemon/claude-code-gemini-proxy/issues)
- ⭐ Star the repo if it helps!

---

**Questions?** Open an issue on GitHub!
