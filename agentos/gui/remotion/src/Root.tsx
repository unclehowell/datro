import React from "react";
import { Composition } from "remotion";
import { TextAnimation, textAnimationComposition } from "./templates/TextAnimation";
import { TitleCard, titleCardComposition } from "./templates/TitleCard";
import { GradientBg, gradientBgComposition } from "./templates/GradientBg";
import { Shapes, shapesComposition } from "./templates/Shapes";
import { DanceScene, danceComposition } from "./templates/DanceScene";
import { NatureScene, natureComposition } from "./templates/NatureScene";
import { CityScene, cityComposition } from "./templates/CityScene";
import { SpaceScene, spaceComposition } from "./templates/SpaceScene";
import { FireScene, fireComposition } from "./templates/FireScene";
import { SnowScene, snowComposition } from "./templates/SnowScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition {...danceComposition} component={DanceScene} />
      <Composition {...natureComposition} component={NatureScene} />
      <Composition {...cityComposition} component={CityScene} />
      <Composition {...spaceComposition} component={SpaceScene} />
      <Composition {...fireComposition} component={FireScene} />
      <Composition {...snowComposition} component={SnowScene} />
      <Composition {...textAnimationComposition} component={TextAnimation} />
      <Composition {...titleCardComposition} component={TitleCard} />
      <Composition {...gradientBgComposition} component={GradientBg} />
      <Composition {...shapesComposition} component={Shapes} />
    </>
  );
};