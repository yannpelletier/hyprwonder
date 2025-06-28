import { bind, Binding, derive, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland";
import { getAppIcon } from "../../lib/system";
import { doubleDerive } from "../../lib/widget";

const MAX_CLASS_LENGTH = 25;
const MAX_TITLE_LENGTH = 30;

export default () => {
  const hyprland = AstalHyprland.get_default();

  const focusedClientBind: Binding<AstalHyprland.Client | null> = bind(hyprland, "focusedClient");
  const focusedWorkspaceBind: Binding<AstalHyprland.Workspace | null> = bind(hyprland, "focusedWorkspace");

  const mergedBinds = derive([focusedClientBind, focusedWorkspaceBind])()

  const [classBind] = doubleDerive(focusedClientBind, (focusedClient) => {
    if (!focusedClient) {
      return Variable("Desktop")()
    }

    return bind(focusedClient, "class").as((classValue) => {
      return classValue !== null ? classValue : "Desktop";
    })
  });

  const [titleBind] = doubleDerive(mergedBinds, ([focusedClient, focusedWorkspace]) => {
    if (!focusedClient) {
      return Variable(`Workspace ${focusedWorkspace?.id}`)()
    }

    return bind(focusedClient, "title").as((title) => {
      return title !== null ? title : `Workspace ${focusedWorkspace?.id}`;
    })
  });

  const iconPathBind = classBind.as((classValue) => {
    if (!classValue) {
      return null;
    }

    return getAppIcon(classValue)
  });

  return (
    <box spacing={15} orientation={Gtk.Orientation.HORIZONTAL}>
      <icon
        className="icon-xxl"
        visible={iconPathBind.as((iconPath) => {
          return iconPath !== null;
        })}
        icon={iconPathBind.as((iconPath) => {
          return iconPath || ""
        })}
      />
      <box orientation={Gtk.Orientation.VERTICAL} >
        <label
          label={classBind}
          halign={Gtk.Align.START}
          className="font-bold"
          maxWidthChars={MAX_CLASS_LENGTH}
          truncate
        />
        <box
          orientation={Gtk.Orientation.VERTICAL}
          child={
            <label
              label={titleBind}
              halign={Gtk.Align.START}
              justifyFill={true}
              wrap={false}
              maxWidthChars={MAX_TITLE_LENGTH}
              truncate
            />
          }
        />
      </box>
    </box>
  )
}
