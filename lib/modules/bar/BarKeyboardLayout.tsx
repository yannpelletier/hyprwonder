import { Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland";
import { getKeyboardLayout } from "../../lib/system";
import MaterialIcon from "../../widgets/MaterialIcon";

export default () => {
  const keyboardLayoutVar = Variable(getKeyboardLayout())

  const hyprland = AstalHyprland.get_default();
  hyprland.connect("keyboard-layout", () => {
    keyboardLayoutVar.set(getKeyboardLayout())
  })

  return (
    <box orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={0}>
      <MaterialIcon icon="keyboard" className="icon-lg" />
      <label className="text-sm font-normal" label={keyboardLayoutVar()} />
    </box>
  )
}
