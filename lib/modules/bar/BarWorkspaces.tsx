import { bind, derive, exec, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import BarGroup from "./BarGroup";

const WORKSPACES_COUNT = 10;

const switchToWorkspace = (id: number) => {
  exec(`hyprctl dispatch workspace ${id}`)
}

// WorkspaceDisplay component with reactive updates
const WorkspaceDisplay = ({ id, hyprland }: { id: number; hyprland: AstalHyprland.Hyprland }) => {
  const workspacesBind = bind(hyprland, "workspaces");
  const idWorkspaceBind = workspacesBind.as((workspaces) => {
    return workspaces.find((workspace) => {
      return workspace?.id === id
    }) || null
  });
  const leftWorkspaceBind = workspacesBind.as((workspaces) => {
    return workspaces.find((workspace) => {
      return workspace?.id === (id - 1);
    }) || null
  });
  const rightWorkspaceBind = workspacesBind.as((workspaces) => {
    return workspaces.find((workspace) => {
      return workspace?.id === (id + 1);
    }) || null
  });
  const focusedWorkspaceBind = bind(hyprland, "focusedWorkspace");

  const isActiveBind = idWorkspaceBind.as((requestedWorkspace) => {
    return requestedWorkspace !== null;
  });
  const isFocusedBind = derive([idWorkspaceBind, focusedWorkspaceBind], (idWorkspace, focusedWorkspace) => {
    return idWorkspace?.id === focusedWorkspace?.id
  })()
  const surroundingCssBind = derive([leftWorkspaceBind, rightWorkspaceBind], (leftWorkspace, rightWorkspace) => {
    if (leftWorkspace && rightWorkspace) {
      return "border-radius: 0;";
    } else if (leftWorkspace && !rightWorkspace) {
      return "border-radius: 0 100% 100% 0;";
    } else if (rightWorkspace && !leftWorkspace) {
      return "border-radius: 100% 0 0 100%;";
    }
    return "";
  })()

  return (
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      child={
        <button
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          onClick={() => {
            switchToWorkspace(id)
          }}
          className="btn-ghost rounded-full text-sm p-0"
          child={
            <overlay
              passThrough={true}
              child={
                <label
                  halign={Gtk.Align.CENTER}
                  valign={Gtk.Align.CENTER}
                  className={isActiveBind.as((isActive) => {
                    return `rounded-full ${isActive ? "bg-surface-container text-background" : ""}`
                  })}
                  css={surroundingCssBind.as((surroundingCss) => {
                    return ` padding: 4px; min-width: 15px; min-height: 15px; transition: color 0.45s ease, background 0.45s ease, border-radius 0.45s ease; ${surroundingCss}`
                  })}
                />
              }
              overlay={
                <label
                  label={id.toString()}
                  halign={Gtk.Align.CENTER}
                  valign={Gtk.Align.CENTER}
                  className={isFocusedBind.as((focused) => {
                    return `rounded-full ${focused ? "bg-primary text-primary" : ""}`
                  })}
                  css="padding: 4px; min-width: 15px; min-height: 15px; transition: color 0.45s ease, background 0.45s ease, border-radius 0.45s ease;"
                />
              }
            />
          }
        />
      }
    />
  );
};

export default () => {
  const hyprland = AstalHyprland.get_default();

  const workspaceDisplays = Array.from({ length: WORKSPACES_COUNT }).map((_, index) => {
    return <WorkspaceDisplay id={index + 1} hyprland={hyprland} />
  })

  return (
    <BarGroup halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
      {workspaceDisplays}
    </BarGroup>
  )
}
