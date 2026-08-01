import React from "react";
import { useVideoConfig } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface SpaceSceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const SpaceScene: React.FC<SpaceSceneProps> = ({
  character = "none",
  action = "stars twinkling",
  background = "deep space with nebula",
  palette,
  motion = "slow",
  text = "",
  subtitle = "",
}) => {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background="space" palette={palette} motion={motion} character={character} />
      {character !== "none" && (
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      )}
    </svg>
  );
};

export const spaceComposition = {
  id: "SpaceScene",
  component: SpaceScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "none",
    action: "stars twinkling",
    background: "deep space with nebula",
    palette: ["#0f0c29", "#302b63", "#c850c0"],
    motion: "slow",
    text: "",
    subtitle: "",
  },
};
