import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface DanceSceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const DanceScene: React.FC<DanceSceneProps> = ({
  character = "cat",
  action = "groovy sway",
  background = "disco floor",
  palette,
  motion = "lively",
  text = "",
  subtitle = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const beat = frame % 48;
  const danceSpring = spring({ frame: beat, fps, config: { damping: 180, mass: 0.5, stiffness: 200 } });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background={background} palette={palette} motion={motion} character={character} />
      <g transform={`translate(${danceSpring * 20}, 0)`}>
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      </g>
    </svg>
  );
};

export const danceComposition = {
  id: "DanceScene",
  component: DanceScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "cat",
    action: "groovy sway, tail whipping, ears flopping",
    background: "disco floor, spinning spotlight",
    palette: ["#ff6b6b", "#ffd93d"],
    motion: "lively",
    text: "",
    subtitle: "",
  },
};