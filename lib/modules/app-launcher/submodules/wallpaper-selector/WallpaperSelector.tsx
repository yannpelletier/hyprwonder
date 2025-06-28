import { exec, execAsync, Variable, Gio } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import { fileNameToDisplay, fuzzySearch } from "../../lib/string";
import { HOME_PATH, CONFIG_PATH, CACHE_PATH, resetCss } from "../../lib/system";
import { BaseWindowProps, closeWindow, keyPressToBuffer } from "../../lib/widget";
import MaterialIcon from "../../widgets/MaterialIcon";

type WallpaperResult = {
  name: string;
  path: string;
  thumbnailPath: string;
};

const ROW_LENGTH = 4;
const WALLPAPER_DIR = `${HOME_PATH}/Pictures/Wallpapers`;
const WALLPAPER_CONFIG_DIR = `${CONFIG_PATH}/wallpaper`;
const THUMBNAIL_DIR = `${CACHE_PATH}/thumbnails/normal`;
const CURRENT_WALLPAPER = `${WALLPAPER_CONFIG_DIR}/current_wallpaper`;

const getThumbnailName = (path: string): string => {
  try {
    // Create URI from path
    const uri = `file://${path}`;
    // Compute MD5 hash of the URI
    const hash = exec(`sh -c "echo -n "${uri}" | md5sum | cut -d' ' -f1"`).trim();
    return `${hash}.png`;
  } catch (e) {
    console.error(`Failed to compute MD5 hash for ${path}:`, e);
    return "";
  }
};

const getWallpapers = (): WallpaperResult[] => {
  try {
    // Ensure thumbnail directory exists
    exec(`sh -c 'mkdir -p "${THUMBNAIL_DIR}"'`);

    // Check if ImageMagick is installed
    if (!exec("sh -c 'command -v magick'")) {
      console.error("Error: ImageMagick (convert) not installed");
      return [];
    }

    const output = exec(`sh -c 'find -L "${WALLPAPER_DIR}" -type f \\( -iname "*.jpg" -o -iname "*.png" -o -iname "*.jpeg" \\) | sort'`);
    const wallpapers = output
      .split("\n")
      .filter((line) => {
        return line.trim()
      })
      .map((path) => {
        const name = fileNameToDisplay(path.split("/").pop() || path);
        const thumbName = getThumbnailName(path);
        if (!thumbName) {
          return { path, name, thumbnailPath: path }; // Fallback if hash fails
        }
        const thumbnailPath = `${THUMBNAIL_DIR}/${thumbName}`;

        // Generate thumbnail if it doesn't exist or is outdated
        const file = Gio.File.new_for_path(thumbnailPath);
        if (!file.query_exists(null)) {
          try {
            exec(`sh -c 'magick "${path}" -resize 256x256 -quality 85 "${thumbnailPath}" 2>/tmp/convert_error.log'`);
            const convertError = exec(`cat /tmp/convert_error.log`).trim();
            if (convertError) {
              console.error(`Failed to generate thumbnail for ${path}: ${convertError}`);
            }
          } catch (e) {
            console.error(`Failed to generate thumbnail for ${path}:`, e);
          }
        }

        return {
          path,
          name,
          thumbnailPath
        };
      });

    return wallpapers;
  } catch (e) {
    console.error("Failed to fetch wallpapers: ", e);
    return [];
  }
};

const setWallpaper = async (path: string) => {
  try {
    // Get color scheme configurations
    // Set wallpaper
    exec(`sh -c 'ln -sf "${path}" ${CURRENT_WALLPAPER}'`);
    if (exec("sh -c 'command -v swww'")) {
      // exec(`sh -c 'swww img --transition-type wipe --transition-duration 1 --transition-step 90 --transition-fps 60 "${path}"'`);
      await execAsync(`sh -c 'matugen image "${CURRENT_WALLPAPER}"'`);
    } else if (exec("sh -c 'command -v feh'")) {
      exec(`sh -c 'feh --bg-fill "${path}"'`);
    } else {
      throw new Error("Neither swww nor feh is installed");
    }
    console.log(`Wallpaper set: ${path}`);
  } catch (e) {
    console.error("Failed to set wallpaper: ", e);
  }
};

const SearchRoute = ({ windowName }: { windowName: string; }) => {
  const queryVar = Variable("");
  const results = getWallpapers();
  const resultsVar = Variable(results);

  const onQueryChange = (query: string) => {
    resultsVar.set(
      results.filter((wallpaper) => {
        return fuzzySearch(query, wallpaper.name)
      })
    );
  };

  const handleKeyPress = (_: Gtk.Widget, event: Gdk.Event) => {
    if (keyPressToBuffer(queryVar, event)) {
      return true;
    }
    return false;
  };

  onQueryChange(queryVar.get());
  queryVar.subscribe((q) => {
    onQueryChange(q)
  });

  const title = (
    <box halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} className="text-subtitle font-bold" spacing={5}>
      <MaterialIcon halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} icon="image" />
      <label halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} label="Wallpaper Selector" />
    </box>
  );

  const entry = (
    <box
      halign={Gtk.Align.FILL}
      valign={Gtk.Align.CENTER}
      hexpand={true}
      vexpand={false}
      child={
        <box
          halign={Gtk.Align.FILL}
          valign={Gtk.Align.CENTER}
          hexpand={true}
          className="bg-surface text-base text-surface border p-sm rounded-sm"
          css="min-height: 15px;"
          spacing={8}
        >
          <MaterialIcon halign={Gtk.Align.START} valign={Gtk.Align.CENTER} icon="search" className="icon-md" />
          <label
            halign={Gtk.Align.START}
            valign={Gtk.Align.CENTER}
            hexpand={true}
            label={queryVar().as((query) => query || "Search Wallpapers")}
          />
        </box>
      }
    />
  );

  const resultDisplay = (result: WallpaperResult) => (
    <box spacing={8} halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} orientation={Gtk.Orientation.VERTICAL}>
      <box
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        className="rounded-lg"
        child={
          <icon
            icon={result.thumbnailPath}
            css="font-size:15rem;"
          />
        }
      />
      <label
        halign={Gtk.Align.CENTER}
        label={result.name}
        css="font-size: 12px;"
        wrap={true}
      />
    </box>
  );

  const resultsArea = (
    <scrollable
      css="min-height: 490px;"
      vscroll={Gtk.PolicyType.AUTOMATIC}
      hscroll={Gtk.PolicyType.NEVER}
      child={
        <box orientation={Gtk.Orientation.VERTICAL} spacing={12} halign={Gtk.Align.CENTER}>
          {resultsVar().as((items) => {
            if (items.length === 0) {
              return (
                [<button
                  label="No wallpapers found"
                  className="bg-transparent border-none shadow-none text-md"
                  halign={Gtk.Align.FILL}
                  valign={Gtk.Align.CENTER}
                  onRealize={(self) => self.grab_focus()}
                />]
              );
            }

            const rows = [];
            for (let i = 0; i < items.length; i += ROW_LENGTH) {
              const rowItems = items.slice(i, i + ROW_LENGTH);
              rows.push(
                <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12} halign={Gtk.Align.CENTER}>
                  {rowItems.map((item, index) => {
                    return (
                      <button
                        className="px-base py-sm btn-ghost-base btn-primary-focus btn-ghost-hover"
                        halign={Gtk.Align.CENTER}
                        onRealize={(self) => {
                          if (i + index === 0) {
                            self.grab_focus();
                          }
                        }}
                        onClicked={() => {
                          setWallpaper(item.path);
                          closeWindow(windowName);
                        }}
                        child={resultDisplay(item)}
                      />
                    )
                  })}
                </box>
              );
            }
            return rows;
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
};

export default ({ name, monitor, closeWindow }: BaseWindowProps & { closeWindow: () => void }) => {
  const handleKeyPress = (event: Gdk.Event) => {
    const keyval = event.get_keyval()[1];
    if (keyval === Gdk.KEY_Escape) {
      closeWindow();
      return true;
    }
    return false;
  };

  return (
    <window
      name={name}
      application={App}
      className="wallpaper-selector border frosted-glass text-surface text-md rounded-lg"
      monitor={monitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      visible={true}
      onKeyPressEvent={(_, event) => handleKeyPress(event)}
      child={
        <box
          name="search"
          className="p-lg"
          css="min-width: 900px"
          halign={Gtk.Align.FILL}
          valign={Gtk.Align.CENTER}
          child={<SearchRoute windowName={name} />}
        />
      }
    />
  ) as Gtk.Window;
};
