import { Gtk } from "astal/gtk3"

import type { Subscribable } from "astal/binding"

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
