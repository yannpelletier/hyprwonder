import { bind, derive, GLib, Variable } from "astal";
import { App, Astal, Gtk } from "astal/gtk3";
import { CircularProgress } from "astal/gtk3/widget";
import MemoryService from "../../services/memory";
import WeatherService from "../../services/weather";
import MaterialIcon from "../../widgets/MaterialIcon";

import type { BaseWindowProps } from "../../lib/widget";

const now = Variable(GLib.DateTime.new_now_local()).poll(1000, () => {
  return GLib.DateTime.new_now_local()
});

const dayOfWeek = now().as((v) => {
  return v.format("%A") || "Unknown"
})

const getDayTime = (v: GLib.DateTime) => {
  const currentHour = v.get_hour();
  if (currentHour >= 5 && currentHour < 8) {
    return "dawn";
  } else if (currentHour >= 8 && currentHour < 12) {
    return "morning";
  } else if (currentHour >= 12 && currentHour < 14) {
    return "noon";
  } else if (currentHour >= 14 && currentHour < 18) {
    return "afternoon";
  } else if (currentHour >= 18 && currentHour < 21) {
    return "evening";
  } else {
    return "night";
  }
}

const Time = () => {
  const weather = WeatherService.getDefault();
  const temperatureBind = bind(weather, "temperature");
  const feelsLikeBind = bind(weather, "feelsLike");
  const cityBind = bind(weather, "city");

  return (
    <box spacing={15} orientation={Gtk.Orientation.VERTICAL}>
      <box spacing={15} halign={Gtk.Align.START} orientation={Gtk.Orientation.HORIZONTAL}>
        <label
          className="auva-day"
          label="It's"
        />
        <label
          className="auva-day-color"
          label={dayOfWeek}
        />
      </box>
      <label
        className="auva-greeting"
        halign={Gtk.Align.START}
        label={bind(now).as((dateTime) => {
          return `HOPE YOUR ${getDayTime(dateTime)} IS GOING WELL.`
        })}
      />
      <label
        className="auva-clock"
        halign={Gtk.Align.START}
        label={bind(now).as((dateTime) => {
          return dateTime.format("%I:%M %p") || "Unknown"
        })}
      />
      <label
        className="auva-weather"
        halign={Gtk.Align.START}
        label={temperatureBind.as((temperature) => {
          return `Current temperature is ${temperature}`;
        })}
      />
      <label
        className="auva-weather"
        halign={Gtk.Align.START}
        label={derive([feelsLikeBind, cityBind], (feelsLike, city) => {
          return `Feels ${feelsLike} in ${city}`;
        })()}
      />
    </box>
  )
}

const DesktopMemory = () => {
  const memoryService = MemoryService.getDefault();

  const usedRamBind = bind(memoryService, "usedRam");
  const maxRamBind = bind(memoryService, "maxRam");
  const usedSwapBind = bind(memoryService, "usedSwap");
  const maxSwapBind = bind(memoryService, "maxSwap");
  const usedDiskSpaceBind = bind(memoryService, "usedDiskSpace");
  const maxDiskSpaceBind = bind(memoryService, "maxDiskSpace");

  const usedRamValueVar = derive([usedRamBind, maxRamBind], (usedRam, maxRam) => {
    return usedRam / maxRam
  });
  const usedRamLabelVar = derive([usedRamBind, maxRamBind], (usedRam, maxRam) => {
    return `${usedRam.toFixed(1)} / ${maxRam.toFixed(1)} GB`
  });

  const usedSwapValueVar = derive([usedSwapBind, maxSwapBind], (usedSwap, maxSwap) => {
    return usedSwap / maxSwap
  });
  const usedSwapLabelVar = derive([usedSwapBind, maxSwapBind], (usedSwap, maxSwap) => {
    return `${usedSwap.toFixed(1)} / ${maxSwap.toFixed(1)} GB`
  });

  const usedDiskSpaceValueVar = derive([usedDiskSpaceBind, maxDiskSpaceBind], (usedDiskSpace, maxDiskSpace,) => {
    return usedDiskSpace / maxDiskSpace
  });
  const usedDiskSpaceLabelVar = derive([usedDiskSpaceBind, maxDiskSpaceBind], (usedDiskSpace, maxDiskSpace,) => {
    return `${usedDiskSpace.toFixed(1)} / ${maxDiskSpace.toFixed(1)} GB`
  });

  return (
    <box
      spacing={25}
      className="spacing-h-15"
    >
      <box
        className="auva-resource-container"
        orientation={Gtk.Orientation.VERTICAL}
      >
        <CircularProgress
          className="auva-circprog-main"
          startAt={-0.25}
          endAt={0.75}
          value={usedRamValueVar()}
          child={<MaterialIcon icon="memory" className="auva-resource-icon" />}
        />
        <label label="Memory" className="auva-resource-label" />
        <label
          label={usedRamLabelVar()}
        />
      </box>
      <box
        className="auva-resource-container"
        orientation={Gtk.Orientation.VERTICAL}
      >
        <CircularProgress
          className="auva-circprog-main"
          startAt={-0.25}
          endAt={0.75}
          value={usedSwapValueVar()}
          child={<MaterialIcon icon="swap_horiz" className="auva-resource-icon" />}
        />
        <label label="Swap" className="auva-resource-label" />
        <label
          label={usedSwapLabelVar()}
        />
      </box>
      <box
        className="auva-resource-container"
        orientation={Gtk.Orientation.VERTICAL}
      >
        <CircularProgress
          className="auva-circprog-main"
          startAt={-0.25}
          endAt={0.75}
          value={usedDiskSpaceValueVar()}
          child={<MaterialIcon icon="hard_drive_2" className="auva-resource-icon" />}
        />
        <label label="Disk Space" className="auva-resource-label" />
        <label
          label={usedDiskSpaceLabelVar()}
        />
      </box>
    </box>
  )
}

const Content = () => {
  return (
    <box
      halign={Gtk.Align.START}
      valign={Gtk.Align.END}
      css={`margin: 0 0 2.5rem 3rem`}
      spacing={35}
      orientation={Gtk.Orientation.VERTICAL}
    >
      <Time />
      <DesktopMemory />
    </box>
  )
}

export default ({ name, monitor }: BaseWindowProps) => {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

  return <window
    name={name}
    monitor={monitor}
    application={App}
    className="Desktop"
    layer={Astal.Layer.BACKGROUND}
    exclusivity={Astal.Exclusivity.EXCLUSIVE}
    anchor={TOP | LEFT | RIGHT | BOTTOM}
    child={<Content />}
  />
}
