import { Gtk } from "astal/gtk3"
import type { Subscribable } from "astal/binding"

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
