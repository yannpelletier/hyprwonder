import { execAsync, GLib, Variable } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import { getUptime } from "../../lib/system";
import MaterialIcon from "../../widgets/MaterialIcon"; // Adjust path if needed

import { closeWindow, type BaseWindowProps } from "../../lib/widget";

// Update time every second
const now = Variable(GLib.DateTime.new_now_local()).poll(1000, () => {
  return GLib.DateTime.new_now_local();
});

// Session action definitions
const actions = [
  {
    icon: "power_settings_new",
    label: "Power Off",
    command: () => {
      execAsync("systemctl poweroff").catch(console.error)
    }
  },
  {
    icon: "restart_alt",
    label: "Reboot",
    command: () => {
      execAsync("systemctl reboot").catch(console.error)
    }
  },
  {
    icon: "logout",
    label: "Logout",
    command: () => {
      execAsync("hyprctl dispatch exit").catch(console.error)
    }
  },
  {
    icon: "lock",
    label: "Lock",
    command: () => {
      execAsync("loginctl lock-session").catch(console.error);
    }
  },
  {
    icon: "bedtime",
    label: "Suspend",
    command: () => {
      execAsync("systemctl suspend").catch(console.error)
    }
  },
];

// Logout container component
const LogoutContainer = () => (
  <box
    className="p-lg"
    halign={Gtk.Align.CENTER}
    valign={Gtk.Align.CENTER}
    orientation={Gtk.Orientation.VERTICAL}
    spacing={30}
  >
    {/* Greeting */}
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.VERTICAL}
      className="top-container"
    >
      <label
        className="text-title text-surface"
        label="System"
      />
      <label
        className="text-subtitle text-surface"
        label={`Uptime: ${getUptime()}`}
      />
    </box>

    {/* Action Buttons */}
    <box
      className="p-md"
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.HORIZONTAL}
      spacing={20}
    >
      {actions.map(({ icon, label, command }) => (
        <button
          className="btn-neutral p-md"
          css="min-width: 80px; min-height: 80px;"
          onClicked={() => {
            command();
            App.toggle_window("Logout");
          }}
          tooltipText={label}
          child={
            <box
              halign={Gtk.Align.CENTER}
              valign={Gtk.Align.CENTER}
              orientation={Gtk.Orientation.VERTICAL}
            >
              <MaterialIcon
                icon={icon}
                className="icon-xl m-md"
              />
              <label label={label} className="action-label text-small" />
            </box>
          }
        />
      ))}
    </box>
  </box>
);

export default ({ name, monitor }: BaseWindowProps) => {
  return (
    <window
      name={name}
      monitor={monitor}
      application={App}
      className="logout border frosted-glass text-surface text-md rounded-lg"
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      onButtonPressEvent={(self, event) => {
        if (event.get_button()[1] === 1) {
          closeWindow(name);
          return true;
        }
        return false;
      }}
      onKeyPressEvent={(self, event) => {
        if (event.get_keyval()[1] === Gdk.KEY_Escape) {
          closeWindow(name);
          return true;
        }
        return false;
      }}
      child={<LogoutContainer />}
    />
  );
};
