import { Binding, Variable } from "astal";
import { App, Gdk, Gtk } from "astal/gtk3";
import { requestClipboardText } from "./system";

export type BaseWindowProps = {
  name: string;
  monitor: number;
}

export const getWindowName = (name: string, monitor: number) => {
  return `${name}-${monitor}`;
}

export const closeWindow = (
  windowName: string,
): boolean => {
  const window = App.get_window(windowName);
  if (window) {
    App.toggle_window(windowName);
    App.remove_window(window);
    return true;
  }
  return false;
}

export const toggleWindowDestroy = <Props extends BaseWindowProps>(
  widget: (props: Props) => Gtk.Window,
  props: Props
) => {
  const windowName = getWindowName(props.name, props.monitor);
  const window = App.get_window(windowName);
  if (window) {
    App.toggle_window(windowName);
    App.remove_window(window);
    return;
  }

  widget(props);
  return;
}

export const doubleDerive = <T, E>(binding: Binding<T>, deriver: (value: T) => Binding<E>): [Binding<E>, () => void] => {
  let valueUnsubscriber: () => void;

  const valueVar = Variable(void 0) as Variable<E>;
  const updateValue = (value: T) => {
    valueUnsubscriber?.();

    const derivedBinding = deriver(binding.get());
    valueVar.set(deriver(binding.get()).get());

    valueUnsubscriber = derivedBinding.subscribe((value) => {
      valueVar.set(value);
    });
  }

  updateValue(binding.get());
  const bindingUnsubscribe = binding.subscribe(updateValue)

  return [valueVar(), bindingUnsubscribe]
}

export const keyPressToBuffer = (buffer: Variable<string>, event: Gdk.Event) => {
  const keyval = event.get_keyval()[1];
  const state = event.get_state()[1];
  const unicode = Gdk.keyval_to_unicode(keyval);

  // Backspace
  if (keyval === Gdk.KEY_BackSpace) {
    const currentText = buffer.get();
    if (currentText.length > 0) {
      buffer.set(currentText.slice(0, -1));
    }
    return true;
  }

  // Return
  if (keyval === Gdk.KEY_Return) {
    return false;
  }

  // Paste
  if (keyval === Gdk.KEY_v && state & Gdk.ModifierType.CONTROL_MASK) {
    requestClipboardText((text) => {
      if (text) {
        buffer.set(buffer.get() + text);
      }
    })
    return true;
  }

  // Text
  if (unicode > 0 && !(state & (Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.MOD1_MASK))) {
    const char = String.fromCharCode(unicode);
    buffer.set(buffer.get() + char);
    return true;
  }

  return false;
}
