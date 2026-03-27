# Magic Marker

**Version 1.0.0** · Adobe Premiere Pro UXP Plugin

![Magic Marker](https://tools.mstep.link/images/magic-marker/hero.png)

Magic Marker is an Adobe Premiere Pro UXP plugin that automatically extracts chapter markers from OBS Hybrid MP4 files and applies them to your clips. Perfect for streamers and video editors who want to organize their footage with minimal effort.

**Free and Open Source** · [Product Page](https://tools.mstep.link/products/magic-marker) · [GitHub](https://github.com/ikifar2012/Magic-Marker) · [Support](https://ko-fi.com/mathesonsteplock)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/ikifar2012/Magic-Marker/blob/main/LICENSE)

## Features

- Automatically extract chapter markers from OBS Hybrid MP4s
- One-click marker application to clips
- Choose marker color before applying
- View all detected markers before applying
- Removes old markers to avoid duplicates
- Free and Open Source

## How to Use

1. Open Adobe Premiere Pro and navigate to **Window > UXP Plugins > Magic Marker** to open the panel.

   ![Step 1: Open the panel](https://tools.mstep.link/images/magic-marker/step-1.png)

2. Select your MP4 clip in the **Source Monitor**.

3. Click the **Probe Clip** button to extract chapter markers from the file.

   ![Step 3: Probe the clip](https://tools.mstep.link/images/magic-marker/step-3.png)

4. Once probing is complete, you'll see a list of all detected markers with their timecodes.

   ![Step 4: Detected markers list](https://tools.mstep.link/images/magic-marker/step-4.png)

5. Choose your desired marker color from the dropdown menu.

   ![Step 5: Choose marker color](https://tools.mstep.link/images/magic-marker/step-5.png)

6. Click **Apply Markers** to add all markers to your clip.

   ![Step 6: Apply markers](https://tools.mstep.link/images/magic-marker/step-6.png)

7. Close the panel and add your clip to the sequence — your markers are now ready for editing.

   ![Step 7: Markers ready in sequence](https://tools.mstep.link/images/magic-marker/step-7.png)

## Installation

Download the latest `.ccx` from the [Releases](https://github.com/ikifar2012/Magic-Marker/releases) page, then install it using one of the methods below.

### A. ZXP / UXP Installer (aescripts + aeplugins)

Download from <https://aescripts.com/learn/zxp-installer/>. Drag and drop the CCX file onto the installer and follow the prompts.

### B. Adobe CC App

Double-click the CCX file and follow the prompts in the Adobe CC app.

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

## Support & Donate

Having issues or need assistance? You can:

- [Open an Issue](https://github.com/ikifar2012/Magic-Marker/issues) on GitHub
- [Email Support](mailto:contact@mathesonsteplock.ca)

Magic Marker is free and open source. If it saves you time, consider supporting its development:

- [Donate on Ko-fi](https://ko-fi.com/mathesonsteplock)

## Links

- [Product Page](https://tools.mstep.link/products/magic-marker)
- [GitHub Repository](https://github.com/ikifar2012/Magic-Marker)
- [Matheson's Tools](https://tools.mstep.link/)
- [Twitter / X](https://twitter.com/mathesonstep)

---

For developer setup and contribution instructions, see [readme_dev.md](readme_dev.md).


