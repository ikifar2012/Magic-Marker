import { premierepro } from "../../globals";
import { parseMP4FilePath, ParseResult } from "../../lib/mp4parser";
import {
  Action,
  AudioClipTrackItem,
  ClipProjectItem,
  Project,
  VideoClipTrackItem,
} from "../../types/ppro";

export type ProbedClipResult = ParseResult & {
  filePath: string;
};

export type AppliedChapterMarkersResult = ProbedClipResult & {
  appliedCount: number;
  removedCount: number;
};

type TimelineClipContext = {
  clip: ClipProjectItem;
  trackItem: VideoClipTrackItem | AudioClipTrackItem;
};

export const asTransaction = async (
  proj: Project,
  actions: Action[],
  description: string,
) => {
  const didExecute = proj.executeTransaction((compAction) => {
    for (const action of actions) {
      compAction.addAction(action);
    }
  }, description);

  if (!didExecute) {
    throw new Error(`Failed to execute transaction: ${description}`);
  }
};

export const lockedTransaction = async (
  proj: Project,
  actions: Action[],
  description: string,
) => {
  console.log(`[transaction] executing "${description}" with ${actions.length} actions`);
  const didExecute = proj.executeTransaction((compAction) => {
    console.log("[transaction] inside callback, adding actions...");
    for (let i = 0; i < actions.length; i++) {
      const result = compAction.addAction(actions[i]);
      console.log(`[transaction] addAction[${i}] returned:`, result);
    }
    console.log("[transaction] callback done");
  }, description);
  console.log(`[transaction] executeTransaction returned:`, didExecute);

  if (!didExecute) {
    throw new Error(`Failed to execute transaction: ${description}`);
  }
};

const getSelectedSourceClip = async () => {
  const programmonitor = await premierepro.SourceMonitor.getProjectItem();

  if (!programmonitor) {
    throw new Error("No clip is loaded in the Source Monitor.");
  }

  const clip = await premierepro.ClipProjectItem.cast(programmonitor);

  if (!clip) {
    throw new Error("The selected Source Monitor item is not a valid clip.");
  }

  return clip;
};

const parseClipProjectItem = async (clip: Awaited<ReturnType<typeof getSelectedSourceClip>>): Promise<ProbedClipResult> => {
  const filePath = await clip.getMediaFilePath();

  if (!filePath) {
    throw new Error("The selected clip does not have an accessible media file path.");
  }

  const parsed = await parseMP4FilePath(filePath);

  return {
    filePath,
    ...parsed,
  };
};

export const probeSelectedClip = async (): Promise<ProbedClipResult> => {
  const clip = await getSelectedSourceClip();
  const result = await parseClipProjectItem(clip);

  console.log("Selected Clip File Path:", result.filePath);
  console.log("Parsed Chapter Markers:", result.chapters);

  return result;
};

const getSelectedTimelineClipContext = async (): Promise<TimelineClipContext> => {
  const project = await premierepro.Project.getActiveProject();
  const sequence = await project.getActiveSequence();

  if (!sequence) {
    throw new Error("No active sequence is available in the Program Monitor.");
  }

  const selection = await sequence.getSelection();
  const selectedTrackItems = await selection.getTrackItems();

  if (!selectedTrackItems || selectedTrackItems.length === 0) {
    throw new Error("Select a timeline clip in the active sequence before applying chapter markers.");
  }

  const trackItem = selectedTrackItems[0];
  const projectItem = await trackItem.getProjectItem();
  const clip = await premierepro.ClipProjectItem.cast(projectItem);

  if (!clip) {
    throw new Error("The selected timeline item is not backed by a valid clip.");
  }

  return {
    clip,
    trackItem,
  };
};

export const applyChapterMarkersToSelectedClip = async (probedClip: ProbedClipResult): Promise<AppliedChapterMarkersResult> => {
  console.log("[apply] starting — chapters to apply:", probedClip.chapters.length, probedClip.filename);

  const clip = await getSelectedSourceClip();
  console.log("[apply] got source clip:", clip);

  if (probedClip.chapters.length === 0) {
    return { ...probedClip, appliedCount: 0, removedCount: 0 };
  }

  const markers = await premierepro.Markers.getMarkers(clip);
  const existingMarkers = markers.getMarkers();
  const existingChapterMarkers = existingMarkers.filter(
    (marker) => marker.getType() === premierepro.Marker.MARKER_TYPE_COMMENT,
  );
  console.log("[apply] existing comment markers to remove:", existingChapterMarkers.length);

  const chaptersToApply = probedClip.chapters.filter(ch => ch.startTimeMs > 0);
  console.log("[apply] chapters to apply (excluding 0s):", chaptersToApply.length);

  const project = await clip.getProject();
  console.log("[apply] got project:", project?.name);

  let addCount = 0;

  project.lockedAccess(() => {
    project.executeTransaction((compAction) => {
      console.log("[apply] inside transaction");

      for (const marker of existingChapterMarkers) {
        compAction.addAction(markers.createRemoveMarkerAction(marker));
      }

      for (const chapter of chaptersToApply) {
        const startTime = premierepro.TickTime.createWithSeconds(chapter.startTimeMs / 1000);
        console.log(`[apply] adding "${chapter.title}" @ ${chapter.startTimeMs / 1000}s`);
        const action = markers.createAddMarkerAction(
          chapter.title,
          premierepro.Marker.MARKER_TYPE_COMMENT,
          startTime,
        );
        compAction.addAction(action);
        addCount++;
      }

      console.log("[apply] transaction built, addCount:", addCount);
    }, `Apply ${chaptersToApply.length} chapter markers`);
  });

  console.log("[apply] lockedAccess complete, addCount:", addCount);

  return {
    ...probedClip,
    appliedCount: addCount,
    removedCount: existingChapterMarkers.length,
  };
};