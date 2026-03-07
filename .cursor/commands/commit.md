# /commit — Export transcript and commit

Carry out these steps in order. Do not skip any step.

## 1. Next transcript number

List the files in `.cursor/prompts/` and find the highest numeric prefix (e.g. `029` in `029_fast_frontend_tooling_chat_transcript.md`). The next file must use the next number, zero-padded to 3 digits (e.g. `030`).

## 2. Write the transcript file

Create a new file in `.cursor/prompts/` named `NNN_<slug>.md` where:
- `NNN` is the number from step 1.
- `<slug>` is a short lowercase slug describing this chat (e.g. `commit_slash_command_setup`), using underscores.

Format the transcript like the existing `.cursor/prompts/029_fast_frontend_tooling_chat_transcript.md`:
- Start with a level-1 heading: `# Chat transcript: <Topic in title case>`
- For each substantive exchange, add a numbered section: `## N. <Short title>`
- Under each section include **User:** (the user’s message or request) and **Outcome:** (what was done or decided). Add **Cause:** only when explaining an error or fix.
- Use `---` between sections.
- End with a final section for this /commit step, e.g. "Save transcript and commit" with **Outcome:** noting the new transcript filename and that changes were committed.

Write the file from the actual conversation in this chat; summarize outcomes clearly and concisely.

## 3. Stage and commit

Run in the project root:

1. `git add -A`
2. `git commit -m "<message>"`

Use a single commit message that:
- Summarizes the main code and config changes (e.g. conventional: `feat:`, `fix:`, `chore:`).
- Mentions that plan and prompt files are included when relevant (e.g. "Include .cursor plan and transcript." or "chore: ... + export chat transcript and commit.").

Do not run `git push`. After the commit, confirm the new transcript path and the commit hash or summary.
