/**
 * Conditional type for upsert items:
 * - If K is a specific key: allows partial T but requires that key
 * - If K is undefined: requires full T
 */
type ArrayPlusItem<T, K extends keyof T | undefined> = K extends keyof T
  ? Partial<T> & Pick<T, K>
  : T;

type ArrayPlusItemTemplate = object | Map<string, unknown> | undefined;

export class ArrayPlus<
  T = unknown,
  K extends keyof T | undefined = undefined,
> extends Array<ArrayPlusItem<T, K>> {
  #key?: string;
  #template?: ArrayPlusItemTemplate;
  #upsertStrategy = "upsert";
  #upsertMutator?: (
    item: ArrayPlusItem<T, K>,
    currentItem: ArrayPlusItem<T, K>,
  ) => void;

  #eventTarget = new EventTarget();

  static get [Symbol.species]() {
    return Array; // Return plain Arrays from methods like map/filter
  }

  constructor(
    items: ArrayPlusItem<T, K>[] = [],
    options: {
      key?: string;
      upsertStrategy?: string;
      template?: ArrayPlusItemTemplate;
      upsertMutator?: (
        item: ArrayPlusItem<T, K>,
        currentItem: ArrayPlusItem<T, K>,
      ) => void;
    } = {},
  ) {
    super(...items);

    if (options.key) this.#key = options.key;
    if (options.upsertStrategy) this.#upsertStrategy = options.upsertStrategy;
    if (options.template) this.#template = options.template;
    if (options.upsertMutator) this.#upsertMutator = options.upsertMutator;

    if (this.#key && this.#template) {
      for (let i = 0, c = this.length; i < c; i++) {
        fillItem(this[i], this.#template);
      }
    }

    const listMutated = (t: string) => {
      this.#listMutated(t);
    };

    // biome-ignore lint/correctness/noConstructorReturn: Proxy pattern requires returning an instance
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);

        // Intercept mutating methods
        const addativeMethods = ["push", "unshift", "splice", "fill"];
        const mutatingMethods = [
          ...addativeMethods,
          "pop",
          "shift",
          "sort",
          "reverse",
          "copyWithin",
        ];

        if (
          typeof value === "function" &&
          mutatingMethods.includes(String(prop))
        ) {
          return (...args: unknown[]) => {
            if (
              this.#key &&
              this.#template &&
              addativeMethods.includes(String(prop))
            ) {
              for (let i = 0, c = args.length; i < c; i++) {
                fillItem(args[i], this.#template);
              }
            }
            const result = value.apply(target, args);
            listMutated(String(prop));
            return result;
          };
        }

        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      },
      set: (target, prop, value, receiver) => {
        return Reflect.set(target, prop, value, receiver);
      },
      has: (target, prop) => {
        return Reflect.has(target, prop);
      },
      deleteProperty: (target, prop) => {
        return Reflect.deleteProperty(target, prop);
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor: (target, prop) => {
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  getKeyValue(item: ArrayPlusItem<T, K>, key: string): unknown {
    if (item instanceof Map) {
      return item.get(key);
    }
    if (isObject(item)) {
      return (item as Record<string, unknown>)[String(key)];
    }
    return undefined;
  }

  upsert(
    items: ArrayPlusItem<T, K> | ArrayPlusItem<T, K>[],
    strategy?: "upsert" | "insert" | "replace",
    key?: string,
  ) {
    const _key = key || this.#key;
    const _strategy = strategy || this.#upsertStrategy;
    const _upsert = Array.isArray(items) ? items : [items];

    if (this.#key && this.#template && _strategy !== "upsert") {
      for (let i = 0, c = _upsert.length; i < c; i++) {
        fillItem(_upsert[i], this.#template);
      }
    }

    // Separate items into updates and inserts
    const updates: Array<{ index: number; item: ArrayPlusItem<T, K> }> = [];
    const inserts: ArrayPlusItem<T, K>[] = [];
    const noaction: ArrayPlusItem<T, K>[] = [];

    for (const item of _upsert) {
      // If item has a key value, try to find existing item
      if (_key) {
        const keyValue = this.getKeyValue(item, _key);
        if (keyValue !== undefined) {
          const index = this.findIndex((existing) => {
            return this.getKeyValue(existing, _key) === keyValue;
          });

          if (index !== -1) {
            const existingItem = this[index];
            if (_strategy === "upsert" && existingItem !== undefined) {
              this.#mutateItem(item, existingItem);
            }
            updates.push({ item, index });
            continue;
          }
        }
      }

      // dont allow insert if item has no required key
      if (
        this.#key &&
        ((isObject(item) && !(item as Record<string, unknown>)[this.#key]) ||
          (item instanceof Map && !item.get(this.#key)))
      ) {
        noaction.push(item);
        continue;
      }

      // Otherwise add to inserts
      inserts.push(item);
    }

    // Apply updates using splice (grouped for consecutive indexes)
    if (_strategy === "replace" && updates.length > 0) {
      // Sort by index
      updates.sort((a, b) => a.index - b.index);

      // Group consecutive updates
      const groups: Array<{
        startIndex: number;
        items: ArrayPlusItem<T, K>[];
      }> = [];
      let currentGroup: {
        startIndex: number;
        items: ArrayPlusItem<T, K>[];
      } | null = null;

      for (const update of updates) {
        if (
          currentGroup &&
          update.index === currentGroup.startIndex + currentGroup.items.length
        ) {
          // Continue existing group
          currentGroup.items.push(update.item);
        } else {
          // Start new group
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { startIndex: update.index, items: [update.item] };
        }
      }

      if (currentGroup) groups.push(currentGroup);

      // Apply groups in reverse order to avoid index shifting
      for (const group of groups.reverse()) {
        this.splice(group.startIndex, group.items.length, ...group.items);
      }
    }

    // Apply inserts using push
    if (inserts.length > 0) {
      this.push(...inserts);
    }

    if (_strategy === "insert") {
      noaction.push(...updates.map(({ item }) => item));
    }

    this.#listMutated("upsert", {
      changed: updates.length + inserts.length,
      updates: _strategy === "insert" ? [] : updates,
      noaction,
      inserts,
      strategy,
    });
  }

  remove(items: ArrayPlusItem<T, K> | ArrayPlusItem<T, K>[], key?: string) {
    const _key = key || this.#key;
    const _remove = Array.isArray(items) ? items : [items];

    // Find all indexes to remove
    const indexesToRemove: number[] = [];

    for (const item of _remove) {
      let index = -1;

      if (_key) {
        const keyValue = this.getKeyValue(item, _key);
        if (keyValue !== undefined) {
          index = this.findIndex((existing) => {
            return this.getKeyValue(existing, _key) === keyValue;
          });
        }
      } else {
        index = this.findIndex((existing) => item === existing);
      }

      if (index > -1) {
        indexesToRemove.push(index);
      }
    }

    // Remove duplicates and sort in descending order
    const uniqueIndexes = Array.from(new Set(indexesToRemove)).sort(
      (a, b) => b - a,
    );

    if (uniqueIndexes.length === 0) return;

    // Group consecutive indexes and splice
    let i = 0;
    while (i < uniqueIndexes.length) {
      const currentIndex = uniqueIndexes[i];
      if (currentIndex === undefined) break;

      let endIdx = currentIndex;
      let groupSize = 1;

      // Find consecutive indexes
      while (i + 1 < uniqueIndexes.length) {
        const nextIndex = uniqueIndexes[i + 1];
        if (nextIndex === undefined || nextIndex !== currentIndex - groupSize)
          break;
        groupSize++;
        i++;
        endIdx = nextIndex;
      }

      // Remove the group (endIdx is the lowest index, currentIndex is the highest)
      this.splice(endIdx, groupSize);

      i++;
    }

    this.#listMutated("remove");
  }

  #mutateItem(item: ArrayPlusItem<T, K>, currentItem: ArrayPlusItem<T, K>) {
    this.#upsertMutator
      ? this.#upsertMutator(item, currentItem)
      : arrayPlusUpsertMutator(item, currentItem);
  }

  #listMutated(type: string, deets: object = {}) {
    this.dispatchEvent(
      new CustomEvent("mutation", {
        detail: { type, list: this.slice(), ...deets },
      }),
    );
  }

  addEventListener(type: string, listener: EventListener) {
    this.#eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.#eventTarget.removeEventListener(type, listener);
  }

  dispatchEvent(event: CustomEvent) {
    this.#eventTarget.dispatchEvent(event);
  }
}

function arrayPlusUpsertMutator<T, K extends keyof T | undefined = undefined>(
  item: ArrayPlusItem<T, K>,
  currentItem: ArrayPlusItem<T, K>,
) {
  if (isObject(item)) {
    for (const [key, value] of Object.entries(item as object)) {
      (currentItem as Record<string, unknown>)[String(key)] = value;
    }
  }
  if (item instanceof Map) {
    for (const [key, value] of item) {
      (currentItem as Map<unknown, unknown>).set(key, value);
    }
  }
}

function fillItem<T, K extends keyof T | undefined = undefined>(
  item: ArrayPlusItem<T, K>,
  template: ArrayPlusItemTemplate,
) {
  if (isObject(item) && isObject(template)) {
    for (const [key, value] of Object.entries(template as object)) {
      if (key in (item as object)) continue;
      (item as Record<string, unknown>)[key] = (
        template as Record<string, unknown>
      )[key];
    }
  }
  if (item instanceof Map && template instanceof Map) {
    for (const [key, value] of template) {
      if ((item as Map<unknown, unknown>).has(key)) continue;
      (item as Map<unknown, unknown>).set(key, value);
    }
  }
}

function isObject(item: unknown): boolean {
  return typeof item === "object" && item !== null && !Array.isArray(item);
}
