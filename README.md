# NoteFixr

A note-taking app with AI built in.

NoteFixr keeps everything in one place and lets AI do the heavy lifting when you need to clean up, summarize, or expand your notes.

I noticed my notes in Notepad are becoming messy and I need to make it organized. And sometimes you just want it to be clean but keep it as accessible as Notepad. That's why I built NoteFixr.

It has the same familiar feel as Notepad but with AI built in. You can clean up messy notes, summarize long ones, extract tasks, or even elaborate on a topic with web search all in one click. Drafts are also saved automatically for saved notes, so you never lose anything even if you close the tab mid-session.

If you want to take your notes outside the app, there's an export button that lets you download as .txt or .md. The structure and formatting carry over, so you're not stuck inside NoteFixr to use what you wrote.

## What it does

- **Organize notes** — familiar Notepad-style editor with rich text formatting, headings, lists, code blocks, and more
- **AI Toolbar** — one click to clean up grammar, summarize, extract tasks, or elaborate with web search
- **Smart Save** — saves your note after running it through AI cleanup automatically
- **AI Chat** — floating chat you can ask anything, or use it to edit your current note
- **Sidebar Search** — search across all your notes by title or content
- **Pin notes** — keep important ones at the top
- **Export** — download as Markdown or plain text
- **Themes** — light, dark, or system preference

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tiptap** for the rich text editor
- **Groq API** for AI (fast inference)
- **PostgreSQL** + Prisma (hosted on Neon)
- **NextAuth** for auth (Google OAuth + email/password)
- **SCSS** for styling

## AI Features

| Action        | What it does                                                   |
| ------------- | -------------------------------------------------------------- |
| Clean         | Fixes grammar, restructures content, formats headings properly |
| Summarize     | Gives you a 2-3 sentence overview + key bullet points          |
| Extract Tasks | Pulls out action items into a checklist                        |
| Elaborate     | Searches the web and adds verified context to your note        |
| Chat          | Ask anything or ask it to edit your note directly              |
