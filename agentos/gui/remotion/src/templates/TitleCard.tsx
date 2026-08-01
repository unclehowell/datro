import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface TitleCardProps {
  title?: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title = "AgentOS",
  subtitle = "",
  titleColor = "#ffffff",
  subtitleColor = "#a0a0a0",
  gradientStart = "#667eea",
  gradientEnd = "#764ba2",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const subtitleSpring = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  const gradientAngle = interpolate(frame, [0, 150], [135, 225]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: "bold",
            color: titleColor,
            fontFamily: "system-ui, sans-serif",
            transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
            opacity: titleSpring,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 48,
              color: subtitleColor,
              fontFamily: "system-ui, sans-serif",
              marginTop: 20,
              transform: `translateY(${interpolate(subtitleSpring, [0, 1], [30, 0])}px)`,
              opacity: Math.max(0, subtitleSpring),
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const titleCardComposition = {
  id: "TitleCard",
  component: TitleCard,
  durationInFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: {
    title: "AgentOS",
    subtitle: "Video Generation",
    titleColor: "#ffffff",
    subtitleColor: "#e0e0e0",
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
  },
};
