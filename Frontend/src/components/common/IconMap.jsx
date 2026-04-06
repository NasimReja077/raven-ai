// src/components/common/IconMap.jsx

import {
  RiFolder2Fill, RiCodeBoxFill, RiBrushFill, RiBookFill,
  RiRocketFill, RiMicroscopeFill, RiLightbulbFill, RiMusicFill,
  RiHeartFill, RiGlobeFill, RiStarFill, RiFireFill,
  RiCameraFill, RiBriefcaseFill, RiGamepadFill, RiLeafFill,
  RiPaletteFill, RiFilmFill, RiFootballFill, RiMoneyDollarCircleFill,
  RiShieldFill, RiToolsFill, RiBarChartFill, RiSearchFill,
  RiGraduationCapFill, RiBuildingFill, RiRobotFill, RiFlashlightFill,
} from "react-icons/ri";

export const COLLECTION_ICONS = {
  // Defaults
  GoFileDirectoryFill: <RiFolder2Fill />,
  folder: <RiFolder2Fill />,
  // Tech
  code:    <RiCodeBoxFill />,
  robot:   <RiRobotFill />,
  flash:   <RiFlashlightFill />,
  search:  <RiSearchFill />,
  chart:   <RiBarChartFill />,
  tools:   <RiToolsFill />,
  shield:  <RiShieldFill />,
  // Knowledge
  book:    <RiBookFill />,
  school:  <RiGraduationCapFill />,
  science: <RiMicroscopeFill />,
  idea:    <RiLightbulbFill />,
  // Creative
  design:  <RiBrushFill />,
  palette: <RiPaletteFill />,
  camera:  <RiCameraFill />,
  film:    <RiFilmFill />,
  music:   <RiMusicFill />,
  // Life
  heart:   <RiHeartFill />,
  leaf:    <RiLeafFill />,
  game:    <RiGamepadFill />,
  sport:   <RiFootballFill />,
  // Business
  work:    <RiBriefcaseFill />,
  money:   <RiMoneyDollarCircleFill />,
  build:   <RiBuildingFill />,
  // Misc
  globe:   <RiGlobeFill />,
  rocket:  <RiRocketFill />,
  star:    <RiStarFill />,
  fire:    <RiFireFill />,
};

export const getIcon = (key) =>
  COLLECTION_ICONS[key] || COLLECTION_ICONS["GoFileDirectoryFill"];

export const ICON_OPTIONS = Object.keys(COLLECTION_ICONS).filter(
  (k) => k !== "GoFileDirectoryFill" // deduplicate the alias
).concat(["GoFileDirectoryFill"]).reverse().slice(0, 28); // show max 28