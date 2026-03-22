import React, { useState } from "react";

import { uxp, premierepro } from "./globals";
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

  const [clipData, setClipData] = useState<ProbedClipResult | null>(null);
  const [clipError, setClipError] = useState<string | null>(null);
  const [clipStatus, setClipStatus] = useState<string | null>(null);
  const [isLoadingClip, setIsLoadingClip] = useState(false);
  const [isApplyingMarkers, setIsApplyingMarkers] = useState(false);

  const hostName = (uxp.host.name as string).toLowerCase();
  if (hostName === "premierepro") {
    console.log("Hello from Premiere Pro", premierepro);
  }

  const getClips = async () => {
    setIsLoadingClip(true);
    setClipError(null);
    setClipStatus(null);
    try {
      const parsedClip = await probeSelectedClip();
      setClipData(parsedClip);
    } catch (error) {
      setClipError(error instanceof Error ? error.message : "Unable to parse the selected clip.");
      setClipData(null);
    } finally {
      setIsLoadingClip(false);
    }
  };

  const applyMarkers = async () => {
    if (!clipData) return;
    setIsApplyingMarkers(true);
    setClipError(null);
    setClipStatus(null);
    try {
      const result = await applyChapterMarkersToSelectedClip(clipData);
      setClipData(result);
      setClipStatus(
        result.appliedCount === 0
          ? "No chapter markers found."
          : `Applied ${result.appliedCount} markers (removed ${result.removedCount} old).`
      );
    } catch (error) {
      setClipError(error instanceof Error ? error.message : "Unable to apply markers.");
    } finally {
      setIsApplyingMarkers(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <>
      {!webviewUI ? (
        <main style={{ padding: "12px", fontFamily: "sans-serif", fontSize: "15px" }}>
          <p style={{ margin: "0 0 10px", textAlign: "center", fontSize: "12px", opacity: 0.6 }}>
            Source Monitor clip — probe then apply markers
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", justifyContent: "center" }}>
            <sp-button
              onClick={isLoadingClip || isApplyingMarkers ? undefined : getClips}
              disabled={isLoadingClip || isApplyingMarkers || undefined}
            >
              {isLoadingClip ? "Probing…" : "Probe Clip"}
            </sp-button>
            <sp-button
              variant="cta"
              onClick={isApplyingMarkers || isLoadingClip || !clipData ? undefined : applyMarkers}
              disabled={isApplyingMarkers || isLoadingClip || !clipData || undefined}
            >
              {isApplyingMarkers ? "Applying…" : "Apply Markers"}
            </sp-button>
          </div>

          {clipError && (
            <p style={{ color: "red", margin: "4px 0", textAlign: "center" }}>{clipError}</p>
          )}
          {clipStatus && (
            <p style={{ margin: "4px 0", textAlign: "center" }}>{clipStatus}</p>
          )}

          {clipData && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", opacity: 0.55, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Probed clip
              </p>
              <p style={{ margin: "0 0 6px", fontWeight: "bold", fontSize: "16px", textAlign: "center" }}>
                {clipData.filename}
              </p>
              <p style={{ margin: "0 0 8px", textAlign: "center", opacity: 0.65 }}>
                {clipData.chapters.length} chapter{clipData.chapters.length !== 1 ? "s" : ""}
              </p>
              <sp-divider size="s" />
              {clipData.chapters.length === 0 ? (
                <p style={{ margin: "8px 0", textAlign: "center" }}>No chapters found in this clip.</p>
              ) : (
                <ul style={{ margin: "8px 0", paddingLeft: "20px", lineHeight: "1.8" }}>
                  {clipData.chapters.map((ch, i) => (
                    <li key={i}>
                      {formatTime(ch.startTimeMs)} — {ch.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      ) : (
        <></>
      )}
    </>
  );
};
