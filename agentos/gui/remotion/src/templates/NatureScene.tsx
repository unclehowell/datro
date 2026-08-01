import React from "react";
import { useVideoConfig } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface NatureSceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const NatureScene: React.FC<NatureSceneProps> = ({
  character = "none",
  action = "waves gently rolling",
  background = "tropical beach, palm trees, golden sand",
  palette,
  motion = "calm",
  text = "",
  subtitle = "",
}) => {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background="nature" palette={palette} motion={motion} character={character} />
      {character !== "none" && (
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      )}
    </svg>
  );
};

export const natureComposition = {
  id: "NatureScene",
  component: NatureScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "none",
    action: "waves gently rolling",
    background: "tropical beach, palm trees, golden sand",
    palette: ["#ff6b6b", "#ffa94d", "#0077be"],
    motion: "calm",
    text: "",
    subtitle: "",
  },
};
