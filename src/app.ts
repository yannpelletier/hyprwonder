import { App } from "astal/gtk4"
// import { parseCliInput } from "./lib/cli"
// import { closeWindow, getWindowName } from "./lib/widget"
// import AppLauncher from "./modules/app-launcher/AppLauncher"
// import Bar from "./modules/bar/Bar"
// import ClipboardManager from "./modules/clipboard-manager/ClipboardManager"
// import WallpaperSelector from "./modules/wallpaper-selector/WallpaperSelector"
// import Indicators from "./modules/indicators/Indicators"
// import LogoutMenu from "./modules/logout/LogoutMenu"
// import Notifications from "./modules/notifications/Notifications"
// import PasswordManager, { PasswordManagerRoute } from "./modules/password-manager/PasswordManager"
import AstalHyprland from "gi://AstalHyprland"
// import { Router } from "./lib/router"
import style from "./scss/main.scss"
// import { resetCss } from "./lib/system"

// const POPUP_NAME = "popup";
//
// const passwordRouter = new Router<PasswordManagerRoute>({ name: "search" });

const openAppWindows = (monitor: number) => {
  if (monitor === 0) {
    // Indicators({ name: "indicators", monitor })
    // if (!App.get_window("bar")) {
    //   Bar({ name: "bar", monitor });
    // }
    // if (!App.get_window("indicators")) {
    //   Indicators({ name: "indicators", monitor })
    // }
    // if (!App.get_window("notifications")) {
    //   Notifications({ name: "notifications", monitor })
    // }
  }
}

const closeAppWindows = (monitor: number) => {
  // for (const window of App.get_windows()) {
  //   closeWindow(window.name);
  // }
}

App.start({
  instanceName: "hyprwonder",
  css: style,
  // requestHandler: async (input, res) => {
  //   const request = parseCliInput(input);
  //   const monitor = 0;
  //
  //   const gdkmonitor = App.get_monitors()[0];
  //   if (!gdkmonitor) {
  //     return res("No monitor available");
  //   }
  //
  //   const name = getWindowName(POPUP_NAME, 0);
  //   if (closeWindow(name)) {
  //     return res("Closed popup");
  //   }
  //
  //   switch (request.command) {
  //     case "update-css":
  //       resetCss();
  //       return res("Updating CSS");
  //
  //     case "app-launcher":
  //       AppLauncher({
  //         name,
  //         monitor,
  //         closeWindow: () => {
  //           closeWindow(name);
  //         }
  //       })
  //       return res("Toggling App Launcher");
  //
  //     case "clipboard-history":
  //       ClipboardManager({
  //         name,
  //         monitor,
  //         closeWindow: () => {
  //           closeWindow(name);
  //         }
  //       });
  //       return res("Toggling Clipboard History");
  //
  //     case "wallpaper-selector":
  //       WallpaperSelector({
  //         name,
  //         monitor,
  //         closeWindow: () => {
  //           closeWindow(name);
  //         }
  //       });
  //       return res("Toggling Wallpaper Selector");
  //
  //     case "password-manager":
  //       if (!passwordRouter.currentRoute) {
  //         passwordRouter.push({ name: "search" });
  //       }
  //
  //       PasswordManager({
  //         name,
  //         monitor,
  //         router: passwordRouter,
  //         closeWindow: () => {
  //           closeWindow(name);
  //         }
  //       });
  //       return res("Toggling Password History");
  //
  //     case "logout":
  //       LogoutMenu({ name, monitor })
  //       return res("Toggling Logout Menu");
  //
  //     default:
  //       return res("No command match");
  //   }
  // },
  main: () => {
    const hyprland = AstalHyprland.get_default();
    hyprland.connect("monitor-added", (_, monitor) => {
      openAppWindows(monitor.id);
    });

    hyprland.connect("monitor-removed", (_, monitor) => {
      closeAppWindows(monitor);
    })
    //
    App.get_monitors().map((_, monitor) => {
      openAppWindows(monitor);
    })
  },
})
