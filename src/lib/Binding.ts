import { Gtk } from "ags/gtk4"
import GObject, { property, register, signal } from "ags/gobject";

@register({ GTypeName: "Router" })
export class Router<T> extends GObject.Object {
  #routeHistory: T[];

  constructor(initialRoute: T) {
    super();
    this.#routeHistory = [initialRoute];
  }

  @property()
  get currentRoute(): T | null {
    return this.#routeHistory[this.#routeHistory.length - 1] || null;
  }

  push(route: T) {
    this.#routeHistory.push(route);
    this.notify("current-route");
  }

  pop(count = 1): boolean {
    if (count < 1) {
      return false;
    }

    this.#routeHistory = this.#routeHistory.slice(0, -count);
    this.notify("current-route");
    if (this.#routeHistory.length === 0) {
      this.emit("empty");
      return true;
    }
    return false;
  }

  @signal()
  declare empty: () => void;
}

export class VarMap<K, T = Gtk.Widget> implements Subscribable {
  #subs = new Set<(v: Array<[K, T]>) => void>()
  #map: Map<K, T>

  #notifiy() {
    const value = this.get()
    for (const sub of this.#subs) {
      sub(value)
    }
  }

  #delete(key: K) {
    const v = this.#map.get(key)

    if (v instanceof Gtk.Widget) {
      v.destroy()
    }

    this.#map.delete(key)
  }

  constructor(initial?: Iterable<[K, T]>) {
    this.#map = new Map(initial)
  }

  set(key: K, value: T) {
    this.#delete(key)
    this.#map.set(key, value)
    this.#notifiy()
  }

  getValue(key: K) {
    return this.#map.get(key);
  }

  has(key: K) {
    return this.#map.has(key);
  }

  delete(key: K) {
    this.#delete(key)
    this.#notifiy()
  }

  get() {
    return [...this.#map.entries()]
  }

  subscribe(callback: (v: Array<[K, T]>) => void) {
    this.#subs.add(callback)
    return () => this.#subs.delete(callback)
  }
}

export class VarSet<T = Gtk.Widget> implements Subscribable {
  #subs = new Set<(v: Array<T>) => void>()
  #set: Set<T>

  #notify() {
    const value = this.get()
    for (const sub of this.#subs) {
      sub(value)
    }
  }

  #delete(value: T) {
    if (value instanceof Gtk.Widget) {
      value.destroy()
    }
    this.#set.delete(value)
  }

  constructor(initial?: Iterable<T>) {
    this.#set = new Set(initial)
  }

  add(value: T) {
    this.#set.add(value)
    this.#notify()
    return this
  }

  has(value: T) {
    return this.#set.has(value)
  }

  delete(value: T) {
    this.#delete(value)
    this.#notify()
    return this
  }

  clear() {
    for (const value of this.#set) {
      this.#delete(value)
    }
    this.#notify()
  }

  get() {
    return [...this.#set]
  }

  subscribe(callback: (v: Array<T>) => void) {
    this.#subs.add(callback)
    return () => this.#subs.delete(callback)
  }
}
