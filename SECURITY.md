# Security Policy & API Key Management

## 🚨 Security Incident - April 1, 2026

**Issue**: OpenRouter API key was accidentally hardcoded in initial commit (d8d8a36)

**Status**: ✅ RESOLVED
- API key has been automatically disabled by OpenRouter
- Exposed key removed from git history via `git filter-branch`
- Repository force-pushed with clean history
- All future keys managed via environment variables

**What We Did**:
1. ✅ Identified the hardcoded key in `src/App.tsx`
2. ✅ Used `git filter-branch` to remove from all historical commits
3. ✅ Force-pushed cleaned history to GitHub
4. ✅ Updated code to use environment variables only
5. ✅ Enhanced `.env.example` with security guidance

---

## 🔐 API Key Security Best Practices

### ❌ NEVER DO THIS:
```typescript
// BAD - Never hardcode keys!
const API_KEY = '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';

// BAD - Still hardcoded!
const HARDCODED_API_KEY = 'process.env.OPENROUTER_API_KEY';
```

### ✅ ALWAYS DO THIS:
```typescript
// GOOD - Use environment variables
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
// or (server-side)
const apiKey = process.env.OPENROUTER_API_KEY;

// Validate it exists
if (!apiKey) {
  throw new Error('API key not configured in environment variables');
}
```

---

## 🔧 For Local Development

**Setup:**
1. Create `.env.local` at project root:
   ```bash
   cp .env.example .env.local
   ```

2. Add your actual API keys (`.env.local` is in `.gitignore`)
   ```
   GEMINI_API_KEY=your_actual_key_here
   OPENROUTER_API_KEY=your_actual_key_here
   MINIMAX_API_KEY=your_actual_key_here
   ```

3. Start development:
   ```bash
   npm run dev
   ```

**WARNING**: `.env.local` is ignored by git - NEVER manually add it to version control

---

## 🚀 For Production Deployment

### Vercel:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each secret variable
3. Values are encrypted and not exposed in logs

### Docker/Cloud Run:
1. Use service account secrets management
2. Mount secrets as environment variables
3. Never build secrets into Docker images

### Example Vercel Setup:
```bash
# Never do this!
git push  # (with .env file committed)

# Always do this!
# 1. Set vars in Vercel UI
# 2. Deploy code only (no .env file)
git push origin main
```

---

## 🔄 If You Accidentally Expose a Key

**Immediate Steps:**
1. **Rotate the key** - Generate a new one from the provider
2. **Disable the old key** - Revoke it immediately
3. **Remove from git history**:
   ```bash
   # Remove from all commits (ADVANCED - use with caution)
   git filter-branch --force --tree-filter \
     'grep -r "old_key" . && sed -i "" "s/old_key/NEW_ENV_REFERENCE/g" **/*.ts*' \
     -- --all
   
   # Force push to update remote
   git push -f origin main
   ```
4. **Notify stakeholders** - Alert your team/users if needed
5. **Audit logs** - Check if the key was used maliciously

---

## 🛡️ Prevention Measures

### Pre-commit Hooks
Setup git hooks to prevent accidental commits (add to `.git/hooks/pre-commit`):
```bash
#!/bin/bash
# Prevent committing .env files or exposed keys
if git diff --cached | grep -E "OPENROUTER_API_KEY|GEMINI_API_KEY|MINIMAX_API_KEY" | grep -v .env.example; then
  echo "❌ ERROR: API key found in staged changes!"
  echo "Use .env.local for local secrets (not tracked by git)"
  exit 1
fi
```

### GitHub Secret Scanning
- Enable "Push protection" in GitHub repo settings
- Automatically blocks commits with exposed secrets
- Set custom patterns for your organization

### CI/CD Scanning
Use tools like:
- `truffleHog` - Scans for secrets in git history
- `git-secrets` - Prevents secrets from being committed
- `detect-secrets` - Python tool for secret detection

---

## 📋 Security Checklist

- [ ] No hardcoded API keys in source code
- [ ] All sensitive data in `.env` files (not committed)
- [ ] `.env*` patterns in `.gitignore`
- [ ] `*.key`, `*.pem`, `*.crt` in `.gitignore`
- [ ] Production uses secure secrets manager
- [ ] Pre-commit hooks enabled (prevent accidental commits)
- [ ] GitHub push protection enabled
- [ ] Regular secret rotation schedule
- [ ] Team trained on security best practices
- [ ] Incident response plan documented

---

## 🚨 Reporting Security Issues

**DO NOT** report security vulnerabilities publicly on GitHub issues.

Instead, use GitHub's **Security Advisory** feature:
1. Go to repo → Security → Advisories
2. Click "Report a vulnerability"
3. Document the issue privately
4. Maintainers will respond with remediation steps

---

## 📚 Security Resources

- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [12 Factor App - Config](https://12factor.net/config)
- [NPM Security Audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

---

**Last Updated**: April 1, 2026  
**Policy Version**: 1.0  
**Next Review**: Quarterly
