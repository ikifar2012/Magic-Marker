Magic Marker
Version: 1.0.0

Overview
Magic Marker is a free and open-source Adobe Premiere Pro plugin.
It reads chapter markers from OBS Hybrid MP4 files and applies them as clip markers.

Main Features
- Automatically extracts chapter markers from OBS Hybrid MP4 files
- One-click marker application to clips
- Marker color selection before applying
- Marker list preview before applying
- Removes old markers to avoid duplicates

Requirements
- Windows
- Adobe Premiere Pro with UXP plugin support

How to Open the Plugin
1. Open Adobe Premiere Pro.
2. Go to: Window > UXP Plugins > Magic Marker

How to Use
1. Open your MP4 in the Source Monitor.
2. In Magic Marker, click "Probe Clip".
3. Review detected chapter markers and timecodes.
4. Choose marker color.
5. Click "Apply Markers".
6. Add clip to your sequence and edit as normal.

Install (CCX)
Option A: Double-click the .ccx file and follow Adobe Creative Cloud prompts.
Option B: Use UPIA from command line.

UPIA path on Windows:
C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent

Example command:
UnifiedPluginInstallerAgent.exe /install C:\path\to\magic-marker.ccx

Troubleshooting
- If "Probe Clip" finds no chapters, verify the file is an OBS Hybrid MP4 with chapter metadata.
- If markers do not appear, reprobe the clip and apply again.
- If needed, close/reopen Premiere Pro and reload the plugin.

Support
- GitHub Issues: https://github.com/ikifar2012/Magic-Marker/issues
- Email: contact@mathesonsteplock.ca

Donate
- Ko-fi: https://ko-fi.com/mathesonsteplock

Project Links
- Product page: https://tools.mstep.link/products/magic-marker
- GitHub repo: https://github.com/ikifar2012/Magic-Marker

License
MIT