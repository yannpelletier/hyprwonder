import { bind, exec, Variable } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import { escapeCLIArgument as escapeCliArgument } from "../../lib/cli";
import { Router } from "../../lib/router";
import { capLines, ellipsisText } from "../../lib/string";
import { copyToClipboard } from "../../lib/system";
import { BaseWindowProps, closeWindow, keyPressToBuffer } from "../../lib/widget";
import MaterialIcon from "../../widgets/MaterialIcon";

export type ClipboardManagerRoute = 
  | { name: "search" }
  | { name: "confirm-clear" };
type ClipboardManagerRouter = Router<ClipboardManagerRoute>;

type ClipboardResult = {
  id: string;
  label: string;
}


const queryClipboardHistory = (query: string): ClipboardResult[] => {
  try {
    const output = exec(`sh -c 'cliphist list | grep -i "${escapeCliArgument(query)}"'`)
    return output
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const [id, ...textParts] = line.split("\t");
        return {
          id,
          label: capLines(ellipsisText(textParts.join("\t"), 55), 1),
        };
      });
  } catch (e) {
    console.error("Failed to fetch clipboard history: ", e);
    return [];
  }
};

const copyItemToClipboard = (id: string) => {
  try {
    const fetchedItem = exec(`sh -c 'echo -n "${escapeCliArgument(id)}" | cliphist decode'`);
    copyToClipboard(fetchedItem);
  } catch (e) {
    console.log("Failed to copy to clipboard: ", e);
  }
}


const clearHistory = () => {
  exec("cliphist wipe");
}

const SearchRoute = ({ windowName, router }: { windowName: string; router: ClipboardManagerRouter; }) => {
  const queryVar = Variable("");
  const resultsVar = Variable(queryClipboardHistory(queryVar.get()));

  const onQueryChange = (query: string) => {
    resultsVar.set(queryClipboardHistory(query));
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

  const title = (
    <box
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      className="text-subtitle font-bold"
      spacing={5}
    >
      <MaterialIcon
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        icon="content_paste"
      />
      <label
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        label="Clipboard Manager"
      />
    </box>
  );

  const entry = (
    <box
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.CENTER}
      hexpand={true}
      vexpand={false}
    >
      <box
        halign={Gtk.Align.FILL}
        valign={Gtk.Align.CENTER}
        hexpand={true}
        className="bg-surface text-base text-surface border p-sm"
        css="border-radius: 5px 0 0 5px; min-height: 15px;"
        spacing={8}
      >
        <MaterialIcon
          halign={Gtk.Align.START}
          valign={Gtk.Align.CENTER}
          icon="search"
          className="icon-md"
        />
        <label
          halign={Gtk.Align.START}
          valign={Gtk.Align.CENTER}
          hexpand={true} // Ensure label takes remaining space
          label={queryVar().as((query) => {
            return query || "Search Clipboard History"
          })}
        />
      </box>
      <button
        halign={Gtk.Align.END}
        valign={Gtk.Align.CENTER}
        hexpand={false}
        className="btn-neutral text-md p-sm"
        css="border-radius: 0 5px 5px 0; min-height: 15px;"
        onClicked={() => {
          router.push({ name: "confirm-clear" });
        }}
        child={
          <box spacing={8}>
            <MaterialIcon icon="delete" valign={Gtk.Align.CENTER} />
            <label label="Clear History" />
          </box>
        }
      />
    </box>
  );

  const resultDisplay = (result: ClipboardResult) => (
    <box spacing={8}>
      <MaterialIcon icon="content_copy" />
      <label
        halign={Gtk.Align.START}
        label={result.label}
      />
    </box>
  );

  const resultsArea = (
    <scrollable
      css="min-height: 320px;"
      vscroll={Gtk.PolicyType.AUTOMATIC}
      hscroll={Gtk.PolicyType.NEVER}
      child={
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={6}
        >
          {resultsVar().as((items) => {
            const list =
              items.length > 0
                ? items.map((item, index) => (
                  <button
                    className="px-base font-normal py-sm btn-ghost-base btn-primary-focus btn-ghost-hover"
                    halign={Gtk.Align.FILL}
                    onRealize={(self) => {
                      if (index === 0) {
                        self.grab_focus();
                      }
                    }}
                    onClicked={() => {
                      copyItemToClipboard(item.id);
                      closeWindow(windowName);
                    }}
                    child={resultDisplay(item)}
                  />
                ))
                : [
                  <button
                    label="No results found"
                    className="bg-transparent border-none shadow-none text-md"
                    halign={Gtk.Align.FILL}
                    valign={Gtk.Align.CENTER}
                    onRealize={(self) => {
                      self.grab_focus();
                    }}
                  />
                ];
            return list;
          })}
        </box>
      }
    />
  );

  return (
    <box
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.FILL}
      hexpand={true}
      vexpand={true}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={12}
      onKeyPressEvent={(self, event) => handleKeyPress(self, event)}
    >
      {title}
      {entry}
      {resultsArea}
    </box>
  );
}

const ConfirmClearRoute = ({
  windowName,
  router,
  closeWindow
}: {
  windowName: string;
  router: ClipboardManagerRouter;
  closeWindow: () => void;
}) => {
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={12}
    >
      <label label="Clear Clipboard History?" className="text-title" />
      <label label="This action cannot be undone." />
      <box spacing={8} halign={Gtk.Align.CENTER}>
        <button
          className="btn-secondary"
          onClicked={() => {
            router.pop();
          }}
          child={
            <box spacing={8}>
              <MaterialIcon icon="cancel" className="button-icon" />
              <label label="Cancel" />
            </box>
          }
        />
        <button
          className="btn-destructive"
          onClicked={() => {
            clearHistory();
            closeWindow();
          }}
          child={
            <box spacing={8}>
              <MaterialIcon icon="delete_forever" className="button-icon" />
              <label label="Clear" />
            </box>
          }
        />
      </box>
    </box>
  )
}


export default ({ name, monitor, closeWindow }: BaseWindowProps & { closeWindow: () => void; }) => {
  const router = new Router<ClipboardManagerRoute>({ name: "search" });
  const currentRouteBind = bind(router, "currentRoute");

  const handleKeyPress = (event: Gdk.Event) => {
    const keyval = event.get_keyval()[1];
    if (keyval === Gdk.KEY_Escape) {
      const empty = router.pop();
      if (empty) {
        closeWindow();
      }
      return true;
    }
    return false;
  }

  return (
    <window
      name={name}
      application={App}
      className="clipboard-history border frosted-glass text-surface text-md rounded-lg"
      monitor={monitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      visible={true}
      onKeyPressEvent={(_, event) => {
        return handleKeyPress(event);
      }}
      child={
        <stack
          className="p-lg"
          css="min-width: 480px"
          transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
          transitionDuration={100}
          visibleChildName={currentRouteBind.as((currentRoute) => {
            return currentRoute?.name || "search"
          })}
        >
          <box
            name="search"
            halign={Gtk.Align.FILL}
            valign={Gtk.Align.CENTER}
            child={<SearchRoute windowName={name} router={router} />}
          />
          <box
            name="confirm-clear"
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            child={<ConfirmClearRoute windowName={name} router={router} closeWindow={closeWindow} />}
          />
        </stack>
      }
    />
  ) as Gtk.Window;
}
