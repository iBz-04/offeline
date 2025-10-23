# OmniBot Desktop Development Guide

## Prerequisites

- Node.js (same version as the web project)
- npm or pnpm
- A C++ compiler for native dependencies (Visual Studio Build Tools on Windows)

## Setup


1. First, install the desktop dependencies:

```powershell
cd desktop
pnpm install
```

2. Build the TypeScript files:

```powershell
pnpm build
# Or use watch mode during development
pnpm watch
```

## Development Workflow

The desktop client uses the Next.js development server running on port 3001. You need to run both:

1. Start the Next.js development server on port 3001:

```powershell
# From the project root
pnpm dev -- -p 3001
```

2. In another terminal, start the Electron app:

```powershell
cd desktop
pnpm electron:dev
```

The Electron app will load the Next.js app from `http://localhost:3001`.

## Building for Production

We're still implementing the production build workflow. This will be updated soon.

## Adding Native Features

To add native features (file system access, OS integration, etc.):

1. Add a handler in `main/index.ts` using `ipcMain.handle`:

```typescript
ipcMain.handle('feature:name', async (_event, args) => {
  // Implement native functionality
  return result;
});
```

2. Expose it in `preload/index.ts`:

```typescript
contextBridge.exposeInMainWorld('omnibotAPI', {
  // ... existing functions
  newFeature: async (args) => {
    return await ipcRenderer.invoke('feature:name', args);
  },
});
```

3. Use it in your web app by accessing the `window.omnibotAPI` object.

## Troubleshooting

- **WebGPU not working**: Check if the Electron version supports WebGPU or if you need to enable it with command line flags.
- **Module not found errors**: Make sure the TypeScript files are compiled to JavaScript before running Electron.
- **Port conflicts**: Ensure nothing else is using port 3001.