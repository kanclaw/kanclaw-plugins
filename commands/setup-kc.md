---
name: setup-kc
description: "Set up KanClaw MCP server connection — generates .mcp.json with your API key"
argument-hint: "[api-key or leave blank to be prompted]"
allowed-tools: Read, Write, Edit, Bash(cat *), AskUserQuestion
---

# /kanclaw:setup-kc

Configure the KanClaw MCP server connection for this project.

## Steps

### 1. Check existing config

Read `.mcp.json` in the project root (find it with `git rev-parse --show-toplevel` if needed).

- If it exists **and** already has a `kanclaw` entry → tell the user it's already configured and ask if they want to reconfigure. If no, stop.
- If it exists **without** a `kanclaw` entry → we'll add it (preserving other servers).
- If it doesn't exist → we'll create it.

### 2. Get the API key

If the user passed an API key as an argument, use that. Otherwise, ask directly:

> Paste your KanClaw API key (from **Project Settings → API Keys** at kanclaw.com):

Accept whatever they provide — the key typically starts with `kc_`.

### 3. Write .mcp.json

Build the config object. If `.mcp.json` already exists, parse it and merge — don't overwrite other servers.

Always use the production MCP URL: `https://mcp.kanclaw.com/mcp`

The kanclaw entry format:

```json
{
  "mcpServers": {
    "kanclaw": {
      "type": "http",
      "url": "https://mcp.kanclaw.com/mcp",
      "headers": {
        "Authorization": "Bearer THE_API_KEY"
      }
    }
  }
}
```

Write the file to the project root using the Write tool. Pretty-print with 2-space indentation.

### 4. Confirm

Tell the user:
- `.mcp.json` has been created/updated with the KanClaw MCP server
- `.mcp.json` is gitignored (contains secrets) — never commit it

Then display this restart notice prominently — it MUST stand out from the rest of the output:

---

⚠️ **RESTART REQUIRED**

MCP config is loaded at startup. To connect to the KanClaw board:

1. Type `/exit` to quit Claude Code
2. Relaunch Claude Code in this project directory

After restart, KanClaw tools like `get_board`, `list_tasks`, and `move_task` will be available.

---

## Notes

- Never commit `.mcp.json` — it contains the API key
- If the user provides a key without the `kc_` prefix, use it as-is (it might be a different format)
- Always use `"type": "http"` — not `"streamable-http"`
- The Bearer prefix in the Authorization header is required
