import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SvgCharacter } from "./svg/SvgCharacter";
import { SceneRig } from "./svg/SceneRig";

interface SnowSceneProps {
  character?: string;
  action?: string;
  background?: string;
  palette?: string[];
  motion?: string;
  text?: string;
  subtitle?: string;
}

export const SnowScene: React.FC<SnowSceneProps> = ({
  character = "cat",
  action = "gentle sway",
  background = "snowy landscape",
  palette,
  motion = "gentle",
  text = "",
  subtitle = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const beat = frame % 48;
  const snowSpring = spring({ frame: beat, fps, config: { damping: 250, mass: 0.5, stiffness: 150 } });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      <SceneRig background={background} palette={palette} motion={motion} character={character} />
      <g transform={`translate(${snowSpring * 15}, 0)`}>
        <SvgCharacter character={character} action={action} palette={palette} motion={motion} />
      </g>
    </svg>
  );
};

export const snowComposition = {
  id: "SnowScene",
  component: SnowScene,
  durationInFrames: 150,
  fps: 24,
  width: 1280,
  height: 720,
  defaultProps: {
    character: "cat",
    action: "gentle sway, tail swaying, ears perking",
    background: "snowy landscape, falling snowflakes",
    palette: ["#e0eafc", "#ffffff", "#a8d8ea"],
    motion: "gentle",
    text: "",
    subtitle: "",
  },
};