import React from "react";
import { useVideoConfig } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface CitySceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const CityScene: React.FC<CitySceneProps> = ({
  character = "none",
  action = "traffic flowing",
  background = "night skyline with neon lights",
  palette,
  motion = "energetic",
  text = "",
  subtitle = "",
}) => {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background="city" palette={palette} motion={motion} character={character} />
      {character !== "none" && (
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      )}
    </svg>
  );
};

export const cityComposition = {
  id: "CityScene",
  component: CityScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "none",
    action: "traffic flowing",
    background: "night skyline with neon lights",
    palette: ["#232526", "#414345", "#fc466b"],
    motion: "energetic",
    text: "",
    subtitle: "",
  },
};
