import { App, Astal } from "astal/gtk3";
import BrightnessIndicator from "./BrightnessIndicator";
import MicrophoneVolumeIndicator from "./MicrophoneVolumeIndicator";
import SpeakerVolumeIndicator from "./SpeakerVolumeIndicator";
import KeyboardLayoutIndicator from "./KeyboardLayoutIndicator";

import type { BaseWindowProps } from "../../lib/widget";

export default ({ name, monitor }: BaseWindowProps) => {
  return (
    <window
      name={name}
      monitor={monitor}
      application={App}
      className="indicators"
      layer={Astal.Layer.OVERLAY}
      anchor={Astal.WindowAnchor.NONE}
      margin={5}
      child={
        <box spacing={15}>
          <MicrophoneVolumeIndicator />
          <SpeakerVolumeIndicator />
          <BrightnessIndicator />
          <KeyboardLayoutIndicator />
        </box>
      }
    />
  )
}
