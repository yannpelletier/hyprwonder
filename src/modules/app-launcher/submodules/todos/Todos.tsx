import { Binding, Variable, GLib, Gio } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk3";

type TodoItem = {
  id: number;
  text: string;
};

type TodoProps = {
  gdkMonitor: Gdk.Monitor;
  name: string;
};

const TODO_FILE = GLib.build_filenamev([GLib.get_user_config_dir(), "ags", "todos.json"]);

const loadTodos = (): TodoItem[] => {
  try {
    const file = Gio.File.new_for_path(TODO_FILE);
    if (file.query_exists(null)) {
      const [, contents] = file.load_contents(null);
      return JSON.parse(contents.toString());
    }
  } catch (e) {
    console.error("Failed to load todos:", e);
  }
  return [];
};

const saveTodos = (todos: TodoItem[]) => {
  try {
    const file = Gio.File.new_for_path(TODO_FILE);
    const dir = file.get_parent();
    if (dir && !dir.query_exists(null)) {
      dir.make_directory_with_parents(null);
    }
    file.replace_contents(JSON.stringify(todos, null, 2), null, false, Gio.FileCreateFlags.NONE, null);
  } catch (e) {
    console.error("Failed to save todos:", e);
  }
};

function TodoContent({ name, resolve }: TodoProps & { resolve: () => void }) {
  const todos = Variable(loadTodos());
  const query = Variable("");
  const focusedIndex = Variable(0);
  let scrollableRef: Gtk.ScrolledWindow | null = null;

  todos.subscribe(() => saveTodos(todos.get()));
  todos.subscribe((items) => {
    if (focusedIndex.get() >= items.length) {
      focusedIndex.set(items.length > 0 ? items.length - 1 : 0);
    }
  });

  focusedIndex.subscribe((index) => {
    if (scrollableRef && todos.get().length > 0) {
      const vadjustment = scrollableRef.get_vadjustment();
      const buttonHeight = 40;
      const targetPos = index * (buttonHeight + 5);
      const viewHeight = scrollableRef.get_allocated_height();
      const currentPos = vadjustment.get_value();
      const maxPos = vadjustment.get_upper() - viewHeight;

      if (targetPos < currentPos) {
        vadjustment.set_value(Math.max(0, targetPos));
      } else if (targetPos + buttonHeight > currentPos + viewHeight) {
        vadjustment.set_value(Math.min(maxPos, targetPos + buttonHeight - viewHeight));
      }
    }
  });

  const addTodo = (text: string) => {
    if (text.trim()) {
      todos.set([...todos.get(), { id: Date.now(), text: text.trim() }]);
      query.set("");
    }
  };

  const deleteTodo = (id: number) => {
    todos.set(todos.get().filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (self: Gtk.Widget, event: Gdk.Event) => {
    const keyval = event.get_keyval()[1];
    const currentTodos = todos.get();

    if (keyval === Gdk.KEY_Escape) {
      App.toggle_window(name);
      resolve();
      return true;
    } else if (keyval === Gdk.KEY_Return) {
      if (query.get().trim()) {
        addTodo(query.get());
      } else if (currentTodos.length > 0) {
        deleteTodo(currentTodos[focusedIndex.get()].id);
      }
      self.grab_focus();
      return true;
    } else if (keyval === Gdk.KEY_Down) {
      focusedIndex.set(Math.min(focusedIndex.get() + 1, currentTodos.length - 1));
      self.grab_focus();
      return true;
    } else if (keyval === Gdk.KEY_Up) {
      focusedIndex.set(Math.max(focusedIndex.get() - 1, 0));
      self.grab_focus();
      return true;
    }

    return false;
  };

  return (
    <box
      className="main-container rofi-container"
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
    >
      <overlay
        halign={Gtk.Align.FILL}
        valign={Gtk.Align.CENTER}
        child={
          <entry
            halign={Gtk.Align.FILL}
            valign={Gtk.Align.CENTER}
            className="search-entry rofi-entry"
            css="padding: 0 35px;"
            text={query()}
            placeholderText="Add TODO..."
            onChanged={(self) => query.set(self.text || "")}
            onKeyPressEvent={(self, event) => handleKeyPress(self, event)}
          />
        }
        overlay={
          <label
            halign={Gtk.Align.START}
            valign={Gtk.Align.CENTER}
            label="\uE145" // Material Icons "add"
            className="search-entry-icon material-icon"
          />
        }
      />
      <label
        className="todo-count rofi-label"
        label={todos.as((items) => `${items.length} TODOs`)}
      />
      <scrollable
        className="results-scroll"
        vscroll={Gtk.PolicyType.AUTOMATIC}
        hscroll={Gtk.PolicyType.NEVER}
        maxContentHeight={500}
        setup={(self) => {
          scrollableRef = self as Gtk.ScrolledWindow;
        }}
      >
        <box
          className="results-list"
          orientation={Gtk.Orientation.VERTICAL}
          spacing={5}
        >
          {todos.as((items) =>
            items.map((todo, index) => (
              <button
                halign={Gtk.Align.FILL}
                className={`result-item rofi-item ${index === focusedIndex.get() ? "focused" : ""}`}
                can_focus={false}
                child={
                  <box spacing={10}>
                    <label label="\uE876" className="result-icon material-icon" /> {/* Material Icons "done" */}
                    <label label={todo.text} className="result-label rofi-label" wrap={true} />
                  </box>
                }
              />
            ))
          )}
        </box>
      </scrollable>
    </box>
  );
}

export function todo(props: TodoProps) {
  const window = (
    <window
      name={props.name}
      application={App}
      className="todo rofi-window"
      gdkmonitor={props.gdkMonitor}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      visible={true}
      onKeyPressEvent={(self, event) => {
        if (event.get_keyval()[1] === Gdk.KEY_Escape) {
          App.toggle_window(props.name);
          return true;
        }
        return false;
      }}
    />
  ) as Gtk.Window;

  App.add_window(window);
  App.toggle_window(props.name);
}
