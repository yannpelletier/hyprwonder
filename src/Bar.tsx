import { createBinding, createComputed, createExternal, createState, CCProps, Accessor } from "ags";
import { Astal, Gtk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland";
import GObject from "gi://GObject?version=2.0";
import { createPoll } from "ags/time";
import { AppModule } from "./App";
import { escapeCLIArgument } from "./lib/cli";
import { getAppIcon, getKeyboardLayout } from "./lib/system";
import MaterialIcon from "./widgets/MaterialIcon";

export type BarItem = {
  priority: number;
  widget: GObject.Object;
  halign: Gtk.Align;
}

export type BarModule = {
  items: Array<BarItem>;
}

const BarGroup = ({ class: className, ...restProps }: Partial<CCProps<Gtk.Box, Gtk.Box.ConstructorProps>>) => {
  return (
    <box
      class={`rounded-lg px-md py-sm bg-background ${className}`}
      css="min-height: 28px;"
      {...restProps}
    />
  )
}

const BarResource = ({ icon, value, tooltipText }: {
  icon: string | Accessor<string>;
  value: number | Accessor<number>;
  tooltipText?: string;
}) => {
  return (
    <box
      tooltipText={tooltipText}
      class="p-0"
      css="min-width: 1.25rem; min-height: 1.25rem;"
    >
      <levelbar
        class="p-0"
        css="font-size: 4px;"
        value={value}
      >
        <MaterialIcon icon={icon} class="p-sm icon-base" />
      </levelbar>
    </box>
  )
}

export const createBarClientFocus = (
  { halign,
    priority = 0,
    maxTitleLength = 30,
    maxClassLength = 25
  }: {
    halign: Gtk.Align;
    priority?: number;
    maxTitleLength?: number;
    maxClassLength?: number;
  }
): BarModule => {
  const hyprland = AstalHyprland.get_default();

  const focusedClient = createBinding(hyprland, "focusedClient");
  const focusedWorkspace = createBinding(hyprland, "focusedWorkspace");

  const clientClass = createExternal("Desktop", (set) => {
    let cleanup: (() => void) | null = null;
    return focusedClient.subscribe(() => {
      cleanup?.();

      const currentClient = focusedClient.get();
      if (!currentClient) {
        return set("Desktop");
      }

      const clientClassBinding = createBinding(currentClient, "class");
      cleanup = clientClassBinding.subscribe(() => {
        const clientClassValue = clientClassBinding.get();
        set(clientClassValue ?? "Desktop");
      });
    });
  });

  const clientTitle = createExternal(`Workspace ${focusedWorkspace.get()?.id}`, (set) => {
    let cleanup: (() => void) | null = null;
    return createComputed([focusedClient, focusedWorkspace]).subscribe(() => {
      cleanup?.();

      const currentClient = focusedClient.get();
      const currentWorkspace = focusedWorkspace.get();
      if (!currentClient) {
        return set(`Workspace ${currentWorkspace?.id}`);
      }

      const clientTitleBinding = createBinding(currentClient, "title");
      cleanup = clientTitleBinding.subscribe(() => {
        const clientTitleValue = clientTitleBinding.get();
        set(clientTitleValue ?? `Workspace ${currentWorkspace?.id}`);
      });
    });
  });

  const iconPathBind = clientClass.as((classValue) => {
    if (!classValue) {
      return null;
    }

    return getAppIcon(classValue)
  });

  const clientFocus = (
    <box spacing={15} orientation={Gtk.Orientation.HORIZONTAL}>
      <image
        class="icon-xxl"
        visible={iconPathBind.as((iconPath) => {
          return iconPath !== null;
        })}
        file={iconPathBind.as((iconPath) => {
          return iconPath || ""
        })}
      />
      <box orientation={Gtk.Orientation.VERTICAL} >
        <label
          label={clientClass}
          halign={halign}
          class="font-bold"
          maxWidthChars={maxClassLength}
        />
        <box
          orientation={Gtk.Orientation.VERTICAL}
        >
          <label
            label={clientTitle}
            halign={halign}
            wrap={false}
            maxWidthChars={maxTitleLength}
          />
        </box>
      </box>
    </box>
  );

  return {
    items:[{
      halign,
      priority,
      widget: clientFocus,
    }]
  }
}

export const createBarKeyboardLayout = ({
  halign,
  priority = 0,
}: {
  halign: Gtk.Align;
  priority?: number;
}): BarModule => {

  const [keyboardLayout, setKeyboardLayout] = createState(getKeyboardLayout());

  const hyprland = AstalHyprland.get_default();
  hyprland.connect("keyboard-layout", () => {
    setKeyboardLayout(getKeyboardLayout())
  })

  const keyboardLayoutWidget = (
    <box orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={0}>
      <MaterialIcon icon="keyboard" class="icon-lg" />
      <label class="text-sm font-normal" label={keyboardLayout} />
    </box>
  )

  return {
    items:[{
      halign,
      priority,
      widget: keyboardLayoutWidget,
    }]
  }
}

export const createBarTray = (): BarModule => {
  const hello = <label label="hello" />
  return {
    startItems: [<label label="hello"/>]
  }
} 

export const createBarRamUsage = (): BarModule => {

}

export const createBarClock = ({
  halign,
  priority = 0,
  timeFormat = "%I:%M",
  dateFormat = "%A, %d/%m"
}: {
  halign: Gtk.Align;
  priority?: number;
  timeFormat?: string;
  dateFormat?: string;
}): BarModule => {
  const time = createPoll("", 1000, `date ${escapeCLIArgument(timeFormat)}`)
  const date = createPoll("", 1000, `date ${escapeCLIArgument(dateFormat)}`)

  const clock = (
    <BarGroup>
      <label class="text-lg text-surface font-bold" label={time} />
      <label class="text-subtitle px-sm" label="•" />
      <label class="text-lg text-surface font-normal" label={date} />
    </BarGroup>
  )

  return {
    items: [{
      halign,
      priority,
      widget: clock,
    }]
  }
}

export const createBar = (config: {
  monitor: 0;
  name: string;
  modules: Array<BarModule>;
}): AppModule => {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

  const flattenedItems = config.modules
    .reduce((acc, module) => {
      return [...acc, module.items] as Array<BarItem>;
    }, [] as Array<BarItem>)
    .sort((a, b) => {
    return (b.priority || 0) - (a.priority || 0)
  })

  const startWidgets: Array<GObject.Object> = [];
  const centerWidgets: Array<GObject.Object> = [];
  const endWidgets: Array<GObject.Object> = [];

  for (const item of flattenedItems) {
    switch (item.halign) {
      case Gtk.Align.START:
        startWidgets.push(item.widget);
        break;
      case Gtk.Align.CENTER:
        centerWidgets.push(item.widget);
        break;
      case Gtk.Align.END:
        endWidgets.push(item.widget);
        break;
    }
  }

  const Bar = (app: Astal.Application) => (
    <window
      name={config.name}
      monitor={config.monitor}
      application={app}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      class="bar text-surface text-md"
    >
      <centerbox
        class="px-lg py-sm"
      >
        <box $type="start">
          {startWidgets}
        </box>
        <box $type="center">
          {centerWidgets}
        </box>
        <box $type="end">
          {endWidgets}
        </box>
      </centerbox>
    </window>
  );

  return {
    run: (app) => {
      Bar(app);
    },
  };
} 
