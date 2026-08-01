import React from "react";
import { useVideoConfig } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface FireSceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const FireScene: React.FC<FireSceneProps> = ({
  character = "none",
  action = "flames rising",
  background = "fire and embers",
  palette,
  motion = "intense",
  text = "",
  subtitle = "",
}) => {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background="fire" palette={palette} motion={motion} character={character} />
      {character !== "none" && (
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      )}
    </svg>
  );
};

export const fireComposition = {
  id: "FireScene",
  component: FireScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "none",
    action: "flames rising",
    background: "fire and embers",
    palette: ["#f83600", "#f9d423", "#ff4e50"],
    motion: "intense",
    text: "",
    subtitle: "",
  },
};
