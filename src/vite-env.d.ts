/// <reference types="vite/client" />

// TODO - not working in Svelte
import { HTMLWebViewElement as UXPHTMLWebViewElement } from "@adobe/cc-ext-uxp-types/uxp/index";

declare global {
  interface Window {
    webview: UXPHTMLWebViewElement;
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sp-button": { variant?: string; quiet?: boolean; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLElement>; children?: React.ReactNode; [key: string]: any };
      "sp-divider": { size?: string; [key: string]: any };
    }
  }
}
