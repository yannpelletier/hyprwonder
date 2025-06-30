import { Gdk, Gtk } from "ags/gtk4";
import { exec } from "ags/process";
import Gio from "gi://Gio?version=2.0"
import GLib from "gi://GLib?version=2.0"

const textDecoder = new TextDecoder();

export const HOME_PATH = GLib.getenv("HOME") as string;
export const CONFIG_PATH = `${HOME_PATH}/.config`;
export const CACHE_PATH = `${HOME_PATH}/.cache`;
export const AGS_CONFIG_PATH = `${CONFIG_PATH}/ags`;
export const SCSS_PATH = `${AGS_CONFIG_PATH}/scss/main.scss`;
export const CSS_PATH = `/tmp/style.css`;

export const resetCss = () => {
  const css = exec(`sass ${SCSS_PATH}`);

  if (!css) {
    return;
  }

  App.apply_css(css, true);
}

export const getUptime = () => {
  try {
    const [success, contents] = GLib.file_get_contents("/proc/uptime");
    if (success) {
      const uptimeSeconds = parseFloat(textDecoder.decode(contents).split(" ")[0]);
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      let uptimeStr = "";
      if (days > 0) uptimeStr += `${days} day${days > 1 ? "s" : ""}, `;
      if (hours > 0 || days > 0) uptimeStr += `${hours} hour${hours > 1 ? "s" : ""}, `;
      uptimeStr += `${minutes} minute${minutes > 1 ? "s" : ""}`;
      return uptimeStr;
    }
  } catch (e) {
    console.error("Failed to read /proc/uptime:", e);
  }
  return "Unknown";
};

export const getAppIcon = (appClass: string) => {
  if (!appClass) {
    return null;
  }

  const desktopEntry = `${appClass.toLowerCase()}.desktop`;
  const desktopPaths = [
    '/usr/share/applications/',
    '/usr/local/share/applications/',
    `${GLib.get_home_dir()}/.local/share/applications/`,
  ];

  for (const path of desktopPaths) {
    const file = Gio.File.new_for_path(`${path}${desktopEntry}`);
    if (file.query_exists(null)) {
      const keyFile = new GLib.KeyFile();
      try {
        const filePath = file.get_path();
        if (!filePath) {
          continue;
        }

        keyFile.load_from_file(filePath, GLib.KeyFileFlags.NONE);
        const icon = keyFile.get_string('Desktop Entry', 'Icon');
        if (icon) return icon;
      } catch (e) { }
    }
  }
  return null;
}

export const getKeyboardLayout = () => {
  try {
    const output = exec("hyprctl devices -j");
    const devices = JSON.parse(output);
    // Get the first keyboard's active_keymap or the main keyboard
    const keyboard = devices.keyboards.find((k: any) => k.main) || devices.keyboards[0];
    return keyboard.active_keymap.toUpperCase().slice(0, 2);
  } catch (err) {
    console.error(`Failed to get keyboard layout: ${err}`);
  }
}

export const copyToClipboard = (text: string) => {
  try {
    const display = Gdk.Display.get_default();
    if (!display) {
      console.error("Failed to copy to clipboard");
      return;
    }

    const clipboard = Gtk.Clipboard.get_default(display);
    clipboard.set_text(text, -1);
  } catch (e) {
    console.error("Failed to copy to clipboard:", e);
  }
}

export const requestClipboardText = (callback: (text: string | null) => void) => {
  try {
    const display = Gdk.Display.get_default();
    if (!display) {
      console.error("Failed to get clipboard");
      return;
    }

    const clipboard = Gtk.Clipboard.get_default(display);
    return clipboard.request_text((_, text) => {
      callback(text || null);
    })
  } catch (e) {
    console.error("Failed to get clipboard:", e);
  }
}
