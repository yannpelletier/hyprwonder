import { Variable } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import AstalApps from "gi://AstalApps";
import { closeWindow, keyPressToBuffer } from "../../widget";
import MaterialIcon from "../../widgets/material-icon";

import type { BaseWindowProps } from "../../widget";

type AppLauncherResult = {
  label: string;
  icon: string;
  execute: () => void;
}

const queryApps = (apps: AstalApps.Apps, query: string): AppLauncherResult[] => {
  const resultApps = apps.fuzzy_query(query);
  return resultApps.map((resultApp) => {
    return {
      label: resultApp.name,
      icon: resultApp.iconName,
      execute: () => {
        resultApp.launch()
      }
    }
  })
}


export default ({ name, monitor, closeWindow }: BaseWindowProps & { closeWindow: () => void; }) => {
  const apps = new AstalApps.Apps();
  const queryVar = Variable("");
  const resultsVar = Variable(queryApps(apps, queryVar.get()));

  const onQueryChange = (query: string) => {
    resultsVar.set(queryApps(apps, query));
  }

  const handleKeyPress = (self: Gtk.Widget, event: Gdk.Event) => {
    if (keyPressToBuffer(queryVar, event)) {
      return true;
    }
    return false;
  };

  onQueryChange(queryVar.get());
  queryVar.subscribe((q) => {
    onQueryChange(q);
  });

  const entry = (
    <box
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.CENTER}
      className="p-sm rounded bg-surface text-base text-surface border"
      spacing={5}
    >
      <MaterialIcon
        halign={Gtk.Align.START}
        valign={Gtk.Align.CENTER}
        icon="search"
      />
      <label
        halign={Gtk.Align.START}
        valign={Gtk.Align.CENTER}
        label={queryVar().as((query) => {
          return query || "Search Application";
        })}
      />
    </box>
  )

  const resultDisplay = (result: AppLauncherResult) => {
    return (
      <box spacing={10}>
        {result.icon ? <icon icon={result.icon} className="icon-xl" /> : <></>}
        <label label={result.label} className="text-base" />
      </box>
    )
  }

  const resultsArea = (
    <scrollable
      css="min-height: 360px;"
      vscroll={Gtk.PolicyType.AUTOMATIC}
      hscroll={Gtk.PolicyType.NEVER}
      maxContentHeight={500}
      child={
        <box
          className="p-sm"
          orientation={Gtk.Orientation.VERTICAL}
          spacing={5}
        >
          {resultsVar().as((items) => {
            const list = items.length > 0 ? items.map((item, index) => (
              <button
                className="px-base py-sm btn-ghost-base btn-primary-focus btn-ghost-hover"
                halign={Gtk.Align.FILL}
                hasFocus={true} // Set focus for all buttons
                onRealize={(self) => {
                  if (index === 0) {
                    self.grab_focus();
                  }
                }}
                onClicked={() => {
                  item.execute();
                  closeWindow();
                }}
                child={resultDisplay(item)}
              />
            )) : ([
              <button
                label="No results found"
                className="bg-transparent border-none shadow-none text-md"
                halign={Gtk.Align.FILL}
                valign={Gtk.Align.CENTER}
                onRealize={(self) => {
                  self.grab_focus();
                }}
              />
            ]);
            return list;
          })}
        </box>
      }
    />
  )

  return (
    <window
      name={name}
      monitor={monitor}
      application={App}
      className="app-launcher border text-surface text-md rounded-lg"
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      visible={true}
      onKeyPressEvent={(self, event) => {
        const keyval = event.get_keyval()[1];
        if (keyval === Gdk.KEY_Escape) {
          closeWindow();
          return true;
        }
        return false;
      }}
      child={
        <box
          className="p-lg"
          css="min-width: 550px"
          valign={Gtk.Align.CENTER}
          orientation={Gtk.Orientation.VERTICAL}
          spacing={10}
          onKeyPressEvent={(self, event) => {
            return handleKeyPress(self, event);
          }}
        >
          {entry}
          {resultsArea}
        </box>
      }
    />
  ) as Gtk.Window;
}
