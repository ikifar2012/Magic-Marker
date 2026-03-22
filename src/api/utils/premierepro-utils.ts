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
      const added = compAction.addAction(action);

      if (!added) {
        throw new Error(`Failed to enqueue action for transaction: ${description}`);
      }
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
  let didExecute = false;

  proj.lockedAccess(() => {
    didExecute = proj.executeTransaction((compAction) => {
      for (const action of actions) {
        const added = compAction.addAction(action);

        if (!added) {
          throw new Error(`Failed to enqueue action for transaction: ${description}`);
        }
      }
    }, description);
  });

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

export const applyChapterMarkersToSelectedClip = async (): Promise<AppliedChapterMarkersResult> => {
  const { clip } = await getSelectedTimelineClipContext();
  const parsedClip = await parseClipProjectItem(clip);

  if (parsedClip.chapters.length === 0) {
    return {
      ...parsedClip,
      appliedCount: 0,
      removedCount: 0,
    };
  }

  const markers = await premierepro.Markers.getMarkers(clip);
  const existingMarkers = markers.getMarkers();

  const existingChapterMarkers = existingMarkers.filter(
    (marker) => marker.getType() === premierepro.Marker.MARKER_TYPE_CHAPTER,
  );

  const actions: Action[] = [];

  for (const marker of existingChapterMarkers) {
    actions.push(markers.createRemoveMarkerAction(marker));
  }

  for (const chapter of parsedClip.chapters) {
    const startTime = premierepro.TickTime.createWithSeconds(chapter.startTimeMs / 1000);

    if (!startTime || startTime === premierepro.TickTime.TIME_INVALID) {
      throw new Error(`Invalid chapter marker time for ${chapter.title}.`);
    }

    actions.push(
      markers.createAddMarkerAction(
        chapter.title,
        premierepro.Marker.MARKER_TYPE_CHAPTER,
        startTime,
      ),
    );
  }

  const project = await clip.getProject();
  await lockedTransaction(project, actions, `Apply ${parsedClip.chapters.length} chapter markers`);

  return {
    ...parsedClip,
    appliedCount: parsedClip.chapters.length,
    removedCount: existingChapterMarkers.length,
  };
};