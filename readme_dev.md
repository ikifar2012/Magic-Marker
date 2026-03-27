# Magic Marker — Developer Guide

Magic Marker is built with [Bolt UXP](https://github.com/hyperbrew/bolt-uxp) (React + Vite + TypeScript). This guide covers everything you need to build, develop, and contribute to the plugin.

## Prerequisites

- [Node.js 18+](https://nodejs.org/en/)
- [Bun](https://bun.sh/) (preferred), npm, or pnpm
- [Adobe UXP Developer Tool (UDT)](https://developer.adobe.com/photoshop/uxp/2022/guides/devtool/installation/) — download via the Adobe CC app
- Adobe Premiere Pro (UXP plugin support required)
- Git

## Project Setup

```bash
git clone https://github.com/ikifar2012/Magic-Marker.git
cd Magic-Marker
bun install       # or: npm i / pnpm i
```

## Development Workflow

**Build the plugin** (required before first load, and after config changes):

```bash
bun run build     # or: npm run build / pnpm build
```

**Hot-reload dev mode** (rebuilds on each file save):

```bash
bun run dev       # or: npm run dev / pnpm dev
```

**Package as CCX** for distribution:

```bash
bun run ccx       # or: npm run ccx / pnpm ccx
```

**Bundle CCX + zip assets** to `./zip`:

```bash
bun run zip       # or: npm run zip / pnpm zip
```

## UXP Developer Tool (UDT) Setup

The Adobe UXP Developer Tool is required to sideload the plugin during development.

### Loading the Plugin

1. Open Adobe UXP Developer Tool (2.0 or later).
2. Click **Add Plugin** and select `dist/manifest.json`.
3. Click **Load** to load the plugin into Premiere Pro.
4. Click **Debug** to open the DevTools console.

> **Note:** Do not use "Load and Watch" — Bolt UXP's built-in WebSocket hot-reload is more reliable.

## Project Structure

```
src/
  main.tsx                  # Main UI component (React)
  globals.ts                # UXP / host API imports
  api/
    uxp.ts                  # UXP utilities (openURL, panel, color)
    premierepro.ts          # Premiere Pro API helpers
    utils/
      premierepro-utils.ts  # Marker application logic
      photoshop-utils.ts
  lib/
    mp4parser.ts            # OBS Hybrid MP4 chapter extraction
  types/
    ppro.d.ts               # Premiere Pro type definitions
```

## Key Source Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | Panel UI — probe button, marker list, color picker, apply button |
| `src/lib/mp4parser.ts` | Parses OBS Hybrid MP4 files and extracts chapter markers |
| `src/api/utils/premierepro-utils.ts` | Reads the Source Monitor clip, applies markers via the Premiere Pro API |
| `src/api/uxp.ts` | `openURL()`, color theme polyfills, UDT panel helpers |

## Installing a Built CCX

### A. ZXP / UXP Installer

Download from <https://aescripts.com/learn/zxp-installer/>, then drag and drop the CCX file.

### B. Adobe CC App

Double-click the CCX file and follow the prompts.

### C. UPIA (command line)

**Windows:**
```
cd "C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent"
UnifiedPluginInstallerAgent.exe /install /path/to/magic-marker.ccx
```

**Mac:**
```
cd "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS"
./UnifiedPluginInstallerAgent --install /path/to/magic-marker.ccx
```

## Releases

Releases are automated via GitHub Actions. To publish a new release:

```bash
git tag 1.0.1
git push origin --tags
```

The workflow builds the CCX and attaches it to the GitHub Release automatically.

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes and run `bun run build` to verify.
3. Load the plugin in UDT and test in Premiere Pro.
4. Open a pull request against `main`.

For bugs or feature requests, [open an issue](https://github.com/ikifar2012/Magic-Marker/issues) or email [contact@mathesonsteplock.ca](mailto:contact@mathesonsteplock.ca).

## UXP Resources

- [Premiere Pro UXP Docs](https://developer.adobe.com/premiere-pro/uxp)
- [UXP API Reference](https://developer.adobe.com/photoshop/uxp/2022/uxp-api/)
- [Adobe UXP Developer Forums](https://forums.creativeclouddeveloper.com/)
- [Bolt UXP](https://github.com/hyperbrew/bolt-uxp)

