import { AstalIO, Binding, timeout, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { getKeyboardLayout } from "../../lib/system";
import MaterialIcon from "../../widgets/MaterialIcon";

const INDICATOR_VISIBLE_TIMEOUT = 500;

type GenericIndicatorProps = {
  icon: string | Binding<string>;
  value?: Binding<number>;
  title?: string | Binding<string>;
  visibilitySignal: Binding<any>;
}

export default ({ icon, value, title, visibilitySignal }: GenericIndicatorProps) => {
  let unlocked = false;
  timeout(100, () => {
    unlocked = true;
  });
  const visibleVar = Variable(false);
  let cancelTimeout: AstalIO.Time | null = null;

  const onValueChange = () => {
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
  visibilitySignal.subscribe(onValueChange)

  return (
    <box
      visible={visibleVar()}
      className="border frosted-glass text-surface text-md rounded-lg p-xl"
      css="min-width: 18rem; min-height: 18rem;"
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.VERTICAL}
    >
      <MaterialIcon
        icon={icon}
        valign={Gtk.Align.CENTER}
        halign={Gtk.Align.CENTER}
        css="font-size: 12rem;"
      />
      {title ? <label label={title} className="text-title font-normal text-background m-sm" /> : <></>}
      {value
        ? <levelbar
          css="min-height: 12px;"
          orientation={Gtk.Orientation.HORIZONTAL}
          value={value}
        />
        : <></>
      }
    </box>
  )
};
