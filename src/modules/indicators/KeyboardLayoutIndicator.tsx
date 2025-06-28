import { AstalIO, timeout, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { getKeyboardLayout } from "../../lib/system";
import MaterialIcon from "../../widgets/MaterialIcon";
import GenericIndicator from "./GenericIndicator";

const INDICATOR_VISIBLE_TIMEOUT = 500;

export default () => {
  const keyboardLayoutVar = Variable(getKeyboardLayout())

  const hyprland = AstalHyprland.get_default();
  hyprland.connect("keyboard-layout", () => {
    keyboardLayoutVar.set(getKeyboardLayout())
  })

  let unlocked = false;
  timeout(1000, () => {
    unlocked = true;
  });
  const visibleVar = Variable(false);
  let cancelTimeout: AstalIO.Time | null = null;

  const onKeyboardLayoutChange = () => {
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
  keyboardLayoutVar.subscribe(onKeyboardLayoutChange)

  return (
    <GenericIndicator
      icon="keyboard"
      title={keyboardLayoutVar()}
      visibilitySignal={keyboardLayoutVar()}
    />
  )
};
