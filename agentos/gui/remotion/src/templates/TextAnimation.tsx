import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface TextAnimationProps {
  text?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  animation?: "fade" | "slide" | "bounce" | "typewriter";
}

export const TextAnimation: React.FC<TextAnimationProps> = ({
  text = "Hello World",
  fontSize = 72,
  color = "#ffffff",
  backgroundColor = "#1a1a2e",
  animation = "fade",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const getAnimationStyle = (): React.CSSProperties => {
    switch (animation) {
      case "fade":
        return {
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
        };
      case "slide":
        const slideX = spring({ frame, fps, config: { damping: 12 } });
        return {
          transform: `translateX(${interpolate(slideX, [0, 1], [-200, 0])}px)`,
          opacity: interpolate(slideX, [0, 1], [0, 1]),
        };
      case "bounce":
        const bounce = spring({ frame, fps, config: { damping: 8, mass: 0.5 } });
        return {
          transform: `scale(${interpolate(bounce, [0, 1], [0, 1])})`,
        };
      case "typewriter":
        const chars = Math.floor(
          interpolate(frame, [0, durationInFrames * 0.8], [0, text.length], {
            extrapolateRight: "clamp",
          })
        );
        return {};
      default:
        return {};
    }
  };

  const displayText = animation === "typewriter" 
    ? text.slice(0, Math.floor(
        interpolate(frame, [0, durationInFrames * 0.8], [0, text.length], {
          extrapolateRight: "clamp",
        })
      ))
    : text;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize,
          color,
          fontWeight: "bold",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 40px",
          ...getAnimationStyle(),
        }}
      >
        {displayText}
      </div>
    </AbsoluteFill>
  );
};

export const textAnimationComposition = {
  id: "TextAnimation",
  component: TextAnimation,
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    text: "Hello World",
    fontSize: 72,
    color: "#ffffff",
    backgroundColor: "#1a1a2e",
    animation: "fade" as const,
  },
};
