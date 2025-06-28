import { bind, timeout, Variable, AstalIO } from "astal";
import { Gtk } from "astal/gtk3";
import BrightnessService from "../../services/brightness";
import MaterialIcon from "../../widgets/MaterialIcon";
import GenericIndicator from "./GenericIndicator";

const INDICATOR_VISIBLE_TIMEOUT = 500;

const getBrightnessIcon = (value: number) => {
  const percent = value * 100;
  if (percent >= 70) {
    return 'brightness_high';
  } else if (percent >= 30) {
    return 'brightness_medium';
  } else {
    return 'brightness_low';
  }
};

export default () => {
  const brightness = BrightnessService.getDefault();

  const screenBrightnessBind = bind(brightness, "screen");

  const brightnessIconBind = screenBrightnessBind.as((brightness) => {
    return getBrightnessIcon(brightness);
  });

  return (
    <GenericIndicator
      icon={brightnessIconBind}
      value={screenBrightnessBind}
      title="Brightness"
      visibilitySignal={screenBrightnessBind}
    />
  )
};
