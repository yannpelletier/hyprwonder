import { GObject, property, register, signal } from "astal";

@register({ GTypeName: "Router" })
export class Router<T> extends GObject.Object {
  #routeHistory: T[];

  constructor(initialRoute: T) {
    super();
    this.#routeHistory = [initialRoute];
  }

  @property(String)
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
