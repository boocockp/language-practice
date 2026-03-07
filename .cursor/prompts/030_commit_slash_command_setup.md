# Chat transcript: Cursor /commit slash command setup

## 1. How to set and use commands in Cursor

**User:** How do I set and use commands in Cursor?

**Outcome:** Explained:
- Command Palette (Cmd+Shift+P / Ctrl+Shift+P) to run any command
- Keyboard Shortcuts (Cmd+K Cmd+S) to bind keys to commands
- Tasks in `.vscode/tasks.json` for project-specific runnable steps
- Terminal / npm scripts for package.json scripts
- Cursor-specific: slash commands in chat (e.g. `/edit`, `/fix`) and custom rules (AGENTS.md, .cursor/rules) for AI behavior

---

## 2. Set up /commit slash command

**User:** I want to set up a cursor-specific slash command called /commit that will:
- Export a transcript of the current chat to .cursor/prompts, using the next number in sequence for the prefix of the file name
- Stage and commit all current changes, including the plan and prompt files, with a suitable message

**Outcome:** Created `.cursor/commands/commit.md` defining the /commit command. It instructs the AI to:
1. Determine the next NNN from existing `.cursor/prompts/` filenames (e.g. 030)
2. Write `.cursor/prompts/NNN_<slug>.md` in the same format as `029_fast_frontend_tooling_chat_transcript.md` (numbered sections, **User:** / **Outcome:**)
3. Run `git add -A` and `git commit -m "..."` with a concise message that can mention plan/prompt files; no push

User was told to use `/commit` in chat and to grant git_write when prompted.

---

## 3. Save transcript and commit

**User:** /commit

**Outcome:** This transcript was written to `030_commit_slash_command_setup.md`. All changes (including `.cursor/commands/commit.md` and this file) were staged and committed with a single conventional commit message. No push was performed.
