# Offeline — Desktop Client (Electron) Plan

This document describes the plan to build an Electron-based desktop client for Offeline. It intentionally focuses on architecture, integration with the existing Next.js/React codebase, development workflow, performance/security notes, and an initial step-by-step plan. We will not start coding until you confirm the approach.


## High-level goals
- Reuse as much of the existing UI and logic (React components, hooks, providers) as possible.
- Keep the UI identical or very close to the web version (Tailwind + shadcn components) while prioritizing desktop performance.
- Use Electron to provide native filesystem access, native dialogs, and an isolated main/preload bridge for OS features.
- Ensure WebGPU / WebLLM features work in the Electron renderer (investigate/enable required Chromium flags or Electron versions).

## Why Electron (short)
- Familiar and widely used for web → desktop apps.
- Mature ecosystem (packagers, builders, native modules, debugging tools).
- Good fit because Offeline's UI is already React/Next — easiest dev DX for reuse.
## Constraints discovered in the codebase
- The project is a Next 14 app (server + client components). The UI, providers and hooks are React-based and live in `src/`.
- Important pieces to reuse: `src/components/*`, `src/components/chat/*`, `src/hooks/*`, `src/lib/*`, and providers in `src/providers` (notably `web-llm-provider`).
- The app uses browser-only APIs (WebGPU / WebLLM). These must be functional in the Electron renderer. That requires verifying Electron's Chromium build supports WebGPU (or that enabling flags is acceptable).

## Integration approach (recommended)
1. Development
   - Keep the existing Next.js app for fast iteration.
   - Run the Next dev server (`npm run dev`) and point Electron at `http://localhost:3000` during development. This allows zero or minimal changes to the UI code.
   - Use a small Electron wrapper in `desktop/main` that spawns the dev server or expects it to be running.

2. Production / Packaging
   - Two options:
     - Bundle Next as a local server: run `next build` and `next start` inside the packaged app (Electron spawns an internal server and loads `http://127.0.0.1:PORT`). This preserves Next features.
     - Or (more work) extract the renderer into a static SPA using a bundler (Vite) and render static assets in Electron. This is lighter but may require refactoring server-side features.
   - For the first desktop release, prefer the local-server approach (less refactor, faster delivery).

3. Security and process model
   - Use the recommended Electron security defaults:
     - disable `nodeIntegration` in renderer.
     - enable `contextIsolation: true`.
     - expose only the required, minimal APIs via a `preload` script using `contextBridge`.
   - Use `ipcMain.handle`/`ipcRenderer.invoke` for async requests from renderer (file dialogs, reading/writing files, export chat, load files for embeddings).

## WebGPU / WebLLM notes
- The project uses `@mlc-ai/web-llm` / `@xenova/transformers` etc. These rely on GPU features in the browser.
- Electron's Chromium build may require explicit flags to enable WebGPU or experimental Dawn backend. Action items:
  - Test WebGPU in the Electron renderer early.
  - If needed, add `app.commandLine.appendSwitch('--enable-unsafe-webgpu')` or other flags in the main process (documented in Electron docs). Also verify the Electron version supports the Chromium features the code expects.
  - If WebGPU is unavailable, the fallback is CPU-based transforms or informing the user that GPU features are unavailable.


# checklist
- [ ] **Web search:** The ability to use internet websearch (if user wants)
- [ ] **fix empty page after chat deletion:** The ability to use internet websearch (if user wants)
- [ ] **Document upload isnt working:** The ability to use internet websearch (if user wants)
- [ ] **add rag, and @calling a donwloaded model:** The ability to use internet websearch (if user wants)


## Files & components mapping (high level)
- Reuse without changes where possible:
  - `src/components/*` (UI primitives, dialogs, buttons, avatar, etc.)
  - `src/components/chat/*` (chat UI, bottombar, topbar, chat list)
  - `src/components/ui/*` (shadcn/ui components, toast, tooltip)
  - `src/hooks/*` (zustand stores, speech recognition hooks)
  - `src/lib/*` (utils, embed, web-llm-helper)
  - `src/providers/*` (ThemeProvider can be reused; `WebLLMProvider` must be tested in Electron renderer)

- Likely changes required:
  - Any code relying on Next-specific server components or server-side APIs will need adaptation.
  - File-loading UI can remain, but the file read must use the Electron file dialog + preload bridge to deliver content instead of browser file input (or we can keep both).
  - Routing: In development we'll use Next routing. If later we switch to a static renderer, routing will be handled by client-side routing.

## Developer workflow (suggested)
1. From project root (powershell):

```powershell
# start Next dev server (from repo root)
pnpm dev

# start Next dev server on port 3001 for Electron (from repo root)
pnpm dev -- -p 3001

# in a second terminal, run electron (we'll create a desktop package with a dev script)
cd desktop
pnpm electron:dev
```

2. `desktop/package.json` (planned scripts — not created yet):

```json
{
  "scripts": {
    "electron:dev": "cross-env NODE_ENV=development electron .",
    "electron:build": "electron-builder"
  }
}
```

Note: We'll wire these scripts properly when we create the `desktop` package.json.

## IPC surface (initial sketch)
- `dialog:openFile` -> Opens native file dialog, returns file metadata and content.
- `dialog:saveFile` -> Save exported chat (md/json) to disk.
- `app:clearCache` -> Allow renderer to request cache clearing via the main process.
- `app:openDevTools` (dev-only)

## Security checklist (for implementation)
- Node integration disabled in renderer.
- Context isolation enabled.
- Sanitize/validate all messages through `ipc` handlers.
- Avoid loading remote content in production. If you must, validate and sandbox.

## Performance considerations
- Avoid enabling heavyweight Node modules in the renderer.
- Keep large model download/storage in the renderer (browser) storage if the WebLLM provider expects web storage APIs. If you need to store models on disk, use the main process functions to store and read local files and adapt the provider.
- Prefer lazy-loading of heavy components (model UI, embeddings UI) and show a progress UI.

## Initial milestone plan (what I'll do next once you confirm)
1. Create `desktop` skeleton (folder + `package.json`, `tsconfig.json`).
2. Add a minimal Electron `main` process and `preload` with secure IPC stubs.
3. Add a small renderer wrapper that in dev points to `http://localhost:3000` and in prod loads a built Next static server URL.
4. Wire up 1 or 2 IPC calls (open file, save export) and test the file-load path using an existing file-loader component.
5. Verify WebGPU works in Electron; document any flags or required Electron versions.

## Helpful links and references
- Electron docs and tutorials: https://www.electronjs.org/docs/latest
- Electron security checklist: https://www.electronjs.org/docs/latest/tutorial/security
- Electron performance tips: https://www.electronjs.org/docs/latest/tutorial/performance
