import { bind } from "astal";
import { Gtk } from "astal/gtk3";
import AstalTray from "gi://AstalTray";
import BarGroup from "./BarGroup";

export default () => {
  const tray = AstalTray.get_default();

  const trayItemsBind = bind(tray, "items");

  const trayBoxesList = trayItemsBind.as((trayItems) => {
    return trayItems
      .map((trayItem) => {
        trayItem.actionGroup
        return (
          (trayItem.id && trayItem.iconName)
            ? (
              <box
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                child={
                  <button
                    tooltipText={trayItem.tooltip?.title}
                    className="btn-ghost rounded-full"
                    child={<icon icon={trayItem.iconName} className="bar-icon" />}
                  />
                }
              />
            )
            : <></>
        )
      })
  })

  return (
    <BarGroup
      visible={trayItemsBind.as((trayItems) => {
        return trayItems.length > 0;
      })}
      orientation={Gtk.Orientation.HORIZONTAL}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
    >
      {trayBoxesList}
    </BarGroup>
  )
}
