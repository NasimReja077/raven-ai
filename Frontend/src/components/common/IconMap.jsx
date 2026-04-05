// ─── src/components/common/IconMap.jsx ───────────────────────────────────────
import {
     RiFolder2Fill,
     RiCodeBoxFill,
     RiBrushFill,
     RiBookFill,
     RiRocketFill,
     RiMicroscopeFill,
     RiLightbulbFill,
     RiMusicFill,
     RiHeartFill,
     RiGlobeFill,
     RiStar2Fill,
     RiFireFill,
} from "react-icons/ri";

export const COLLECTION_ICONS = {
     GoFileDirectoryFill: <RiFolder2Fill />,
     code: <RiCodeBoxFill />,
     design: <RiBrushFill />,
     book: <RiBookFill />,
     rocket: <RiRocketFill />,
     science: <RiMicroscopeFill />,
     idea: <RiLightbulbFill />,
     music: <RiMusicFill />,
     heart: <RiHeartFill />,
     globe: <RiGlobeFill />,
     star: <RiStar2Fill />,
     fire: <RiFireFill />,
};

export const getIcon = (key) =>
     COLLECTION_ICONS[key] || COLLECTION_ICONS["GoFileDirectoryFill"];

export const ICON_OPTIONS = Object.keys(COLLECTION_ICONS);
