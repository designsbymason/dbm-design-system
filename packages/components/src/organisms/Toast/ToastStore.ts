import type { ToastOpenChangeReason, ToastOptions } from "./Toast.types";

/** One toast the provider holds: what it was asked to show, and whether it is open or on its way out. */
export interface ToastEntry {
  id: string;
  options: ToastOptions;
  /** False once it has been told to close, until it has finished leaving and is removed. */
  open: boolean;
}

type Listener = () => void;

/**
 * The provider's list of toasts, outside React so that `useToast()` can hand out functions that never change and a
 * toast can be raised from an event handler, an effect or a promise callback alike. One store per provider: there
 * is no module-level state, so two providers (or two server renders) never share toasts.
 *
 * `snapshot` is a new array on every change and the same array between changes, which is what
 * `useSyncExternalStore` needs.
 */
export class ToastStore {
  private entries: ToastEntry[] = [];
  private listeners = new Set<Listener>();
  private counter = 0;
  private reasons = new Map<string, ToastOpenChangeReason>();
  private showing = Number.POSITIVE_INFINITY;

  /** How many toasts, from the front of the list, are on screen; the rest are waiting. */
  setShowing(count: number) {
    this.showing = count;
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  snapshot = (): readonly ToastEntry[] => this.entries;

  private emit(next: ToastEntry[]) {
    this.entries = next;
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Adds a toast, or, given the id of one that is still here, replaces its options as a whole and reopens it in the
   * same place. Returns the id.
   */
  add(options: ToastOptions): string {
    const id = options.id ?? `dbm-toast-${(this.counter += 1)}`;
    const existing = this.entries.find((entry) => entry.id === id);
    if (existing) {
      this.reasons.delete(id);
      this.emit(this.entries.map((entry) => (entry.id === id ? { id, options: { ...options, id }, open: true } : entry)));
    } else {
      this.emit([...this.entries, { id, options: { ...options, id }, open: true }]);
    }
    return id;
  }

  update(id: string, options: Partial<ToastOptions>) {
    if (!this.entries.some((entry) => entry.id === id)) return;
    this.emit(this.entries.map((entry) => (entry.id === id ? { ...entry, options: { ...entry.options, ...options, id } } : entry)));
  }

  /** Marks a toast closed (it stays in the list until `remove`, so its exit can play). Returns whether it changed. */
  close(id: string, reason: ToastOpenChangeReason): boolean {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry || !entry.open) return false;
    this.reasons.set(id, reason);
    this.emit(this.entries.map((item) => (item.id === id ? { ...item, open: false } : item)));
    return true;
  }

  /** Closes the toasts on screen and drops the ones still waiting. */
  closeAll() {
    const next = this.entries
      .slice(0, this.showing)
      .map((entry) => {
        if (entry.open) this.reasons.set(entry.id, "programmatic");
        return { ...entry, open: false };
      });
    this.emit(next);
  }

  /** The reason a toast was closed for, once, for the `onOpenChange` and completion that follow. */
  takeReason(id: string): ToastOpenChangeReason | undefined {
    const reason = this.reasons.get(id);
    this.reasons.delete(id);
    return reason;
  }

  /** Takes a toast out of the list, once it has finished leaving. */
  remove(id: string) {
    if (!this.entries.some((entry) => entry.id === id)) return;
    this.reasons.delete(id);
    this.emit(this.entries.filter((entry) => entry.id !== id));
  }
}
