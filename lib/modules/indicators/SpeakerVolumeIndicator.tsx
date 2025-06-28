import { AstalIO, bind, derive, timeout, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalWp from "gi://AstalWp";
import { doubleDerive } from "../../lib/widget";
import MaterialIcon from "../../widgets/MaterialIcon";
import GenericIndicator from "./GenericIndicator";

const INDICATOR_VISIBLE_TIMEOUT = 500;

const getVolumeIcon = (value: number, muted: boolean) => {
  if (muted) {
    return "volume_off";
  }

  const percent = value * 100;
  if (percent >= 66) {
    return 'volume_up';
  } else if (percent >= 33) {
    return 'volume_down';
  } else {
    return 'volume_mute';
  }
};

export default () => {
  const wp = AstalWp.get_default();
  if (!wp) {
    return <></>
  }

  const audio = wp.audio;
  const defaultSpeakerBind = bind(audio, "defaultSpeaker");

  const [volumeBind] = doubleDerive(defaultSpeakerBind, (defaultSpeaker) => {
    if (!defaultSpeaker) {
      return Variable(0)();
    }

    return bind(defaultSpeaker, "volume");
  });

  const [mutedBind] = doubleDerive(defaultSpeakerBind, (defaultSpeaker) => {
    if (!defaultSpeaker) {
      return Variable(true)();
    }

    return bind(defaultSpeaker, "mute");
  });

  const mergeBind = derive([volumeBind, mutedBind])();

  const volumeIconBind = mergeBind.as(([volume, muted]) => {
    return getVolumeIcon(volume, muted);
  });

  let unlocked = false;
  timeout(1000, () => {
    unlocked = true;
  });
  const visibleVar = Variable(false);
  let cancelTimeout: AstalIO.Time | null = null;

  const onVolumeChange = () => {
    if (!unlocked) {
      return;
    }

    cancelTimeout?.cancel();

    visibleVar.set(true);
    cancelTimeout = timeout(INDICATOR_VISIBLE_TIMEOUT, () => {
      visibleVar.set(false);
      cancelTimeout = null;
    })
  }
  mergeBind.subscribe(onVolumeChange)

  return (
    <GenericIndicator
      icon={volumeIconBind}
      value={volumeBind}
      title="Speaker Volume"
      visibilitySignal={mergeBind}
    />
  )
};
