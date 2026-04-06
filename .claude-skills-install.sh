#!/bin/bash
# Install useful Claude skills

echo "Installing Claude skills..."

# Create skills directory if not exists
mkdir -p .claude/skills

# Copy playwright-pro
echo "Installing playwright-pro..."
cp -r /c/Users/zail/claude-skills-repo/engineering-team/playwright-pro .claude/skills/

# Copy code-reviewer
echo "Installing code-reviewer..."
cp -r /c/Users/zail/claude-skills-repo/engineering-team/code-reviewer .claude/skills/

# Copy a11y-audit
echo "Installing a11y-audit..."
cp -r /c/Users/zail/claude-skills-repo/engineering-team/a11y-audit .claude/skills/

# Copy self-improving-agent
echo "Installing self-improving-agent..."
cp -r /c/Users/zail/claude-skills-repo/engineering-team/self-improving-agent .claude/skills/

echo "Done! Skills installed to .claude/skills/"
ls -la .claude/skills/
