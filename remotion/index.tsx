import { registerRoot, Composition } from "remotion";
import NoteFixrVideo, {
  VIDEO_CONFIG,
} from "../app/components/landing/NoteFixrVideo";

function Root() {
  return (
    <Composition
      id="NoteFixrVideo"
      component={NoteFixrVideo}
      width={VIDEO_CONFIG.width}
      height={VIDEO_CONFIG.height}
      durationInFrames={VIDEO_CONFIG.durationInFrames}
      fps={VIDEO_CONFIG.fps}
    />
  );
}

registerRoot(Root);
