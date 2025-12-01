# 📦 Installation Guide

## Quick Install (Recommended)

```bash
git clone https://github.com/stormdaemon/claude-code-gemini-proxy.git
cd claude-code-gemini-proxy
npm install
npm run build
npm link
```

## Verify Installation

```bash
gemini-proxy --version
# Should output: 1.0.0
```

## First Time Setup

### 1. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID
```

### 2. Authenticate with GCP

**Option A: Application Default Credentials (Easiest)**

```bash
gcloud auth application-default login
```

**Option B: Service Account**

1. Create a service account in [GCP Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Grant it the "Vertex AI User" role
3. Download the JSON key file
4. Save it somewhere safe (e.g., `~/.gcp/service-account.json`)

### 3. Run Setup Wizard

```bash
gemini-proxy setup
```

Follow the prompts:
- Choose model: **Gemini 2.0 Flash** (recommended for speed)
- Auth method: **Application Default Credentials** (if you ran gcloud auth)
- Project ID: Your GCP project ID
- Region: **us-central1** (or closest to you)
- Port: **8080** (default)

The wizard will:
- ✅ Test your authentication
- ✅ Verify Vertex AI access
- ✅ Save your configuration
- ✅ Optionally start the proxy

### 4. Configure Claude Code

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
export ANTHROPIC_BASE_URL=http://localhost:8080
export ANTHROPIC_API_KEY=dummy-key
```

Apply changes:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### 5. Start Using It!

```bash
# Start the proxy (if not already running)
gemini-proxy start

# In another terminal, use Claude Code normally
claude "Write a Python function to reverse a string"
```

## Verify It's Working

### Check Proxy Status

```bash
gemini-proxy status
```

Should show:
- ✅ Model configured
- ✅ Authentication method
- ✅ GCP project and region

### Test Connection

```bash
gemini-proxy test
```

Should output:
- ✅ Authentication OK
- ✅ Project: your-project-id
- ✅ Model: gemini-2.0-flash-exp
- ✅ Region: us-central1

### Test with Claude Code

```bash
claude "Say hello in French"
```

You should see a response from Gemini!

## Troubleshooting

### "Command not found: gemini-proxy"

```bash
# Make sure you ran npm link
cd /path/to/claude-code-gemini-proxy
npm link

# Or use npx
npx gemini-proxy setup
```

### "Authentication failed"

```bash
# Re-authenticate
gcloud auth application-default login

# Or check your service account file exists
ls -la ~/.gcp/service-account.json

# Test auth
gemini-proxy test
```

### "API not enabled"

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=YOUR_PROJECT_ID

# Wait a minute, then test again
gemini-proxy test
```

### "Permission denied"

Your service account needs the "Vertex AI User" role:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### "Port 8080 already in use"

```bash
# Find what's using the port
lsof -i :8080

# Kill it
lsof -ti:8080 | xargs kill -9

# Or reconfigure to use a different port
gemini-proxy reset
gemini-proxy setup  # Choose a different port
```

## Uninstall

```bash
# Stop the proxy if running
pkill -f gemini-proxy

# Unlink from global npm
cd /path/to/claude-code-gemini-proxy
npm unlink

# Remove the repo
cd ..
rm -rf claude-code-gemini-proxy

# Clear config
rm -rf ~/.config/gemini-proxy
```

## Update

```bash
cd /path/to/claude-code-gemini-proxy
git pull origin main
npm install
npm run build
```

## Next Steps

- 📖 Read the [Quick Start Guide](./QUICKSTART.md)
- 📚 Full documentation in [README.md](./README.md)
- 🔧 Configure auto-start (see README for systemd/launchd setup)

---

**Need help?** [Open an issue](https://github.com/stormdaemon/claude-code-gemini-proxy/issues)
