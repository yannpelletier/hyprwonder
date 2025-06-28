import { App, Astal, Gtk } from "astal/gtk3";
import BarClientFocus from "./BarClientFocus";
import BarClock from "./BarClock";
import BarGroup from "./BarGroup";
import BarKeyboardLayout from "./BarKeyboardLayout";
import BarMedia from "./BarMedia";
import BarNetwork from "./BarNetwork";
import BarNotifications from "./BarNotifications";
import BarResources from "./BarResources";
import BarTray from "./BarTray";
import BarWorkspaces from "./BarWorkspaces";

import type { BaseWindowProps } from "../../lib/widget";

export default ({ name, monitor }: BaseWindowProps) => {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  const leftSection = (
    <box
      spacing={10}
      halign={Gtk.Align.START}
      valign={Gtk.Align.CENTER}
      child={<BarClientFocus />}
    />
  )

  const middleSection = (
    <box
      spacing={10}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
    >
      <BarResources />
      <BarMedia />
      <BarWorkspaces />
      <BarClock />
    </box>
  )

  const rightSection = (
    <box
      spacing={10}
      halign={Gtk.Align.END}
      valign={Gtk.Align.CENTER}
    >
      <BarKeyboardLayout />
      <BarTray />
      <BarGroup
        halign={Gtk.Align.END}
        valign={Gtk.Align.CENTER}
      >
        <BarNetwork />
        <BarNotifications />
      </BarGroup>
    </box>
  )

  return <window
    name={name}
    monitor={monitor}
    application={App}
    className="bar frosted-glass text-surface text-md"
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={TOP | LEFT | RIGHT}
    child={
      <centerbox
        className="px-lg py-sm"
        startWidget={leftSection}
        centerWidget={middleSection}
        endWidget={rightSection}
      />
    }
  />
}
