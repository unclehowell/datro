import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface GradientBgProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
}

export const GradientBg: React.FC<GradientBgProps> = ({
  color1 = "#667eea",
  color2 = "#764ba2",
  color3 = "#f093fb",
  speed = 1,
}) => {
  const frame = useCurrentFrame();

  const angle = interpolate(frame, [0, 150], [0, 360]) * speed;
  const shift = interpolate(frame, [0, 150], [0, 100]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${color1} ${shift}%, ${color2} ${50 + shift / 2}%, ${color3} ${100}%)`,
      }}
    />
  );
};

export const gradientBgComposition = {
  id: "GradientBg",
  component: GradientBg,
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    color1: "#667eea",
    color2: "#764ba2",
    color3: "#f093fb",
    speed: 1,
  },
};
