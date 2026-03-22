import React, { useEffect, useState } from "react";

import boltUxpLogo from "./assets/bolt-uxp.png";
import viteLogo from "./assets/vite.png";
import tsLogo from "./assets/typescript.png";
import sassLogo from "./assets/sass.png";
import reactLogo from "./assets/react.png";

import { uxp, indesign, photoshop, premierepro, illustrator } from "./globals";
import { api } from "./api/api";
import {
  applyChapterMarkersToSelectedClip,
  probeSelectedClip,
  type ProbedClipResult,
} from "./api/utils/premierepro-utils";


declare global {
  namespace JSX {
    interface IntrinsicElements {
      "uxp-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { panelid?: string },
        HTMLElement
      >;
    }
  }
}

export const App = () => {
  const webviewUI = import.meta.env.VITE_BOLT_WEBVIEW_UI === "true";
  
  const [count, setCount] = useState(0);
  const [clipData, setClipData] = useState<ProbedClipResult | null>(null);
  const [clipError, setClipError] = useState<string | null>(null);
  const [clipStatus, setClipStatus] = useState<string | null>(null);
  const [isLoadingClip, setIsLoadingClip] = useState(false);
  const [isApplyingMarkers, setIsApplyingMarkers] = useState(false);
  const increment = () => setCount((prev) => prev + 1);

  const hostName = (uxp.host.name as string).toLowerCase();

  //* Call Functions Conditionally by App
  if (hostName === "premierepro") {
    console.log("Hello from Premiere Pro", premierepro);
  }
  
  //* Or call the unified API object directly and the correct app function will be used
  const simpleAlert = () => {
    api.notify("Hello World");
  };
  const getClips = async () => {
      setIsLoadingClip(true);
      setClipError(null);
      setClipStatus(null);

      try {
        const parsedClip = await probeSelectedClip();
        setClipData(parsedClip);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to parse the selected clip.";
        setClipError(message);
        setClipData(null);
      } finally {
        setIsLoadingClip(false);
      }

  };

  const applyMarkers = async () => {
      setIsApplyingMarkers(true);
      setClipError(null);
      setClipStatus(null);

      try {
        const result = await applyChapterMarkersToSelectedClip();
        setClipData(result);

        if (result.appliedCount === 0) {
          setClipStatus("No chapter markers were found to apply.");
        } else {
          setClipStatus(`Applied ${result.appliedCount} chapter markers and replaced ${result.removedCount} existing chapter markers.`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to apply chapter markers to the selected clip.";
        setClipError(message);
      } finally {
        setIsApplyingMarkers(false);
      }

  };
  return (

    <>
      {!webviewUI ? (
        <main>
          <div>
            <img className="logo-lg" src={boltUxpLogo} alt="" />
          </div>
          <div className="stack-icons">
            <img src={viteLogo} className="logo" alt="" />
            <span> + </span>
            <img src={reactLogo} className="logo" alt="" />
            <span> + </span>
            <img src={tsLogo} className="logo" alt="" />
            <span> + </span>
            <img src={sassLogo} className="logo" alt="" />
          </div>
          <div className="button-group">
            <button onClick={increment}>count is {count}</button>
            <button onClick={simpleAlert}>Alert</button>
            <button onClick={getClips} disabled={isLoadingClip}>
              {isLoadingClip ? "Reading Chapter Markers..." : "Read Clip Chapter Markers"}
            </button>
            <button
              onClick={applyMarkers}
              disabled={isApplyingMarkers || isLoadingClip || !clipData}
            >
              {isApplyingMarkers ? "Applying Chapter Markers..." : "Apply Chapter Markers"}
            </button>
            
          </div>
          <div>
            {clipError ? <p>{clipError}</p> : null}
            {clipStatus ? <p>{clipStatus}</p> : null}
            {clipData ? (
              <div>
                <p>
                  <strong>{clipData.filename}</strong>
                </p>
                <p>{clipData.filePath}</p>
                <p>
                  Duration: {Math.round(clipData.duration)} ms | FPS: {clipData.fps} | Chapters: {clipData.chapters.length}
                </p>
                <p>
                  Video: {clipData.specs.width}x{clipData.specs.height} | Codec: {clipData.specs.codec}
                </p>
                {clipData.chapters.length > 0 ? (
                  <div>
                    <h3>Chapter Markers</h3>
                    <ul>
                      {clipData.chapters.map((chapter) => (
                        <li key={chapter.id}>
                          {chapter.startTimecode} - {chapter.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No chapter markers were found in this file.</p>
                )}
              </div>
            ) : null}
          </div>
          <div className="stack-colors">
            <div className="stack-colors-a"></div>
            <div className="stack-colors-b"></div>
            <div className="stack-colors-c"></div>
            <div className="stack-colors-d"></div>
            <div className="stack-colors-e"></div>
            <div className="stack-colors-f"></div>
            <div className="stack-colors-g"></div>
            <div className="stack-colors-h"></div>
            <div className="stack-colors-i"></div>
            <div className="stack-colors-j"></div>
          </div>
          <div>
            <p>
              Edit <span className="code">main.tsx</span> and save to test HMR
              updates.
            </p>
          </div>
          <div className="button-group">
            <a href="https://github.com/hyperbrew/bolt-uxp/">Bolt UXP Docs</a>
            <a href="https://svelte.dev">Svelte Docs</a>
            <a href="https://vitejs.dev/">Vite Docs</a>
          </div>
        </main>
      ) : (
        <></>
      )}

      {/* Example of a secondary panel entrypoint 
      <uxp-panel panelid="bolt.uxp.plugin.settings">
        <h1>Settings Panel</h1>
        <p>count is: {count}</p>
      </uxp-panel>
      */}
    </>
  );
};
