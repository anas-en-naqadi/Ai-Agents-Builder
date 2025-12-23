# 🚀 GitHub Repository Setup Guide

This document provides all the information needed to set up this repository on GitHub.

## 📦 Repository Information

### Repository Name
```
Ai-Agents-Builder
```

**Repository URL:** https://github.com/anas-en-naqadi/Ai-Agents-Builder.git

### Repository Description

**Short (160 characters max):**
```
Modern full-stack platform for creating, testing, and deploying AI agents with CrewAI. Next.js + FastAPI + secure API deployment.
```

**Full Description:**
```
Agent Builder is a comprehensive platform that enables developers to create, test, and deploy AI agents with ease. Built with Next.js and FastAPI, it provides a modern web interface for managing agents powered by CrewAI and Groq LLM. Features include interactive chat testing, resource management (tools, links, documents), secure API deployment with Bearer token authentication, and auto-generated Postman collections. Perfect for developers looking to build and deploy AI agents quickly.
```

## 🏷️ GitHub Topics/Tags

Add these topics to your repository for better discoverability:

```
ai
artificial-intelligence
crewai
nextjs
fastapi
typescript
python
llm
groq
agent-framework
ai-agents
chatbot
api-deployment
rest-api
full-stack
react
tailwindcss
shadcn-ui
machine-learning
nlp
```

## 📋 Pre-Push Checklist

Before pushing to GitHub, ensure:

- [x] ✅ `.gitignore` is properly configured
- [x] ✅ No sensitive data (API keys, tokens) in code
- [x] ✅ No `.env` files committed
- [x] ✅ Storage data excluded (only `.gitkeep` files)
- [x] ✅ `LICENSE` file present
- [x] ✅ `README.md` is comprehensive
- [x] ✅ Documentation is complete

## 🔐 Environment Variables Setup

### Backend Environment Variables

Copy the example file and configure:

```bash
cd backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

See `backend/.env.example` for all available configuration options.

### Frontend Environment Variables

Copy the example file and configure:

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port
```

See `frontend/.env.example` for configuration options.

**⚠️ Important:** Never commit `.env` or `.env.local` files to the repository! The `.env.example` files are tracked and serve as templates.

## 📤 Initial Git Setup

If this is a new repository:

```bash
# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Agent Builder platform"

# Add remote (replace with your GitHub username)
git remote add origin https://github.com/anas-en-naqadi/Ai-Agents-Builder.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🎨 Repository Settings Recommendations

### General Settings
- **Description**: Use the short description above
- **Website**: (Optional) Add if you have a live demo
- **Topics**: Add all topics listed above

### Features
- ✅ **Issues**: Enable
- ✅ **Projects**: Enable (optional)
- ✅ **Wiki**: Disable (unless needed)
- ✅ **Discussions**: Enable (optional)
- ✅ **Sponsorships**: Enable (optional)

### Pull Requests
- ✅ **Allow merge commits**
- ✅ **Allow squash merging**
- ✅ **Allow rebase merging**

### Pages
- If deploying frontend to GitHub Pages, configure here

## 📝 Social Preview

**Title:** Agent Builder - AI Agent Creation Platform

**Description:** Create, test, and deploy AI agents with CrewAI. Modern Next.js + FastAPI stack with secure API deployment.

**Image:** Add a screenshot or logo (1200x630px recommended)

## 🔗 Badges for README

The README.md already includes badges. Make sure to update the repository URL in the clone command:

```markdown
git clone https://github.com/anas-en-naqadi/Ai-Agents-Builder.git
```

## 📄 Files Included

- ✅ `LICENSE` - MIT License
- ✅ `README.md` - Comprehensive documentation
- ✅ `.gitignore` - Properly configured
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `docs/` - Additional documentation
- ✅ `.gitkeep` files in storage directories

## 🚨 Security Notes

1. **Never commit:**
   - `.env` files
   - API keys or tokens
   - Personal data
   - Storage data files (only `.gitkeep` should be committed)

2. **If you accidentally committed sensitive data:**
   ```bash
   # Remove from git history (use with caution)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```

## ✅ Final Verification

Before making the repository public:

1. Review all files in the repository
2. Check that no sensitive data is present
3. Verify `.gitignore` is working correctly
4. Test cloning the repository in a fresh directory
5. Ensure all documentation is accurate

---

**Ready to push!** 🎉

