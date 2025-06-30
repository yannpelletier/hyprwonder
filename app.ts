import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import style from "./scss/main.scss"
import { parseCliInput } from "./src/lib/cli";
import { createBar, createBarClientFocus, createBarKeyboardLayout } from "./src/Bar";

const barClientFocus = createBarClientFocus({ halign: Gtk.Align.START });
const barKeyboardLayout = createBarKeyboardLayout({ halign: Gtk.Align.END });
// const trayBarModule = createTrayBarModule();

const barAppModule = createBar({
  name: "bar",
  monitor: 0,
  modules: [barClientFocus, barKeyboardLayout]
});

const modules = [
  barAppModule
];

app.start({
  instanceName: "hyprwonder",
  css: style,
  gtkTheme: "Adwaita",
  requestHandler: (input, res) => {
    const request = parseCliInput(input);
    for (const module of modules) {
      const response = module.requestHandler?.(request) || null;
      if (response) {
        return res(response);
      }
    }
    return res("No request handler found");
  },
  main: () => {
    for (const module of modules) {
      module.run(app);
    }
  },
});
