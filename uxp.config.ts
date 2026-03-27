import { UXP_Manifest, UXP_Config } from "vite-uxp-plugin";
import { version } from "./package.json";

const extraPrefs = {
  hotReloadPort: 8080,
    copyZipAssets: ["public-zip/*"],
  uniqueIds: true,
};

export const id = "com.mstep.magicmarker"; 
const name = "Magic Marker"; 

const manifest: UXP_Manifest = {
  id,
  name,
  version,
  main: "index.html",
  manifestVersion: 6,
  host: [
    {
      app: "premierepro",
      minVersion: "26.0",
    },
      ],
  entrypoints: [
    {
      type: "panel",
      id: `${id}.main`,
      label: {
        default: name,
      },
      minimumSize: { width: 480, height: 500 },
      maximumSize: { width: 2000, height: 2000 },
      preferredDockedSize: { width: 480, height: 500 },
      preferredFloatingSize: { width: 480, height: 500 },
    },


    // * Example of a UXP Secondary panel
    // * Must also enable the <uxp-panel panelid="bolt.uxp.plugin.settings">
    //* tag in your entrypoint (.tsx, .vue, or .svelte) file
    // {
    //   type: "panel",
    //   id: `${id}.settings`,
    //   label: {
    //     default: `${name} Settings`,
    //   },
    //   minimumSize: { width: 230, height: 200 },
    //   maximumSize: { width: 2000, height: 2000 },
    //   preferredDockedSize: { width: 230, height: 300 },
    //   preferredFloatingSize: { width: 230, height: 300 },
    //   icons: [
    //     {
    //       width: 23,
    //       height: 23,
    //       path: "icons/dark-panel.png",
    //       scale: [1, 2],
    //       theme: ["darkest", "dark", "medium"],
    //       species: ["chrome"],
    //     },
    //     {
    //       width: 23,
    //       height: 23,
    //       path: "icons/light-panel.png",
    //       scale: [1, 2],
    //       theme: ["lightest", "light"],
    //       species: ["chrome"],
    //     },
    //   ],
    // },

    // * Example of a UXP Command
    // {
    //   type: "command",
    //   id: "showAbout",
    //   label: {
    //     default: "Bolt UXP Command",
    //   },
    // },

  ],
  featureFlags: {
    enableAlerts: true,
  },
  requiredPermissions: {
    localFileSystem: "fullAccess",
    launchProcess: {
      schemes: ["https", "slack", "file", "ws"],
      extensions: [".xd", ".psd", ".bat", ".cmd", ""],
    },
    network: {
      domains: [
        `ws://localhost:${extraPrefs.hotReloadPort}`, // Required for hot reload
      ],
    },
    clipboard: "readAndWrite",
    // webview: {
    //   allow: "yes",
    //   allowLocalRendering: "yes",
    //   // domains: "all",
    //   // enableMessageBridge: "localAndRemote",
    // },
    ipc: {
      enablePluginCommunication: true,
    },
    allowCodeGenerationFromStrings: true,

  }
};

export const config: UXP_Config = {
  manifest,
  ...extraPrefs,
  webviewUi: false,
  webviewReloadPort: 0
};
