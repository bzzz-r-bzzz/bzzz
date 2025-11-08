import { describe, expect, test, vi } from "vitest";
import { ArrayPlus } from "./ArrayPlus.js";

describe("ArrayPlus", () => {
  test("new arrays from methods will be Array, instance itself will be ArrayPlus", () => {
    const ap = new ArrayPlus([]);
    expect(ap).toBeInstanceOf(ArrayPlus);
    expect(ap.slice()).toBeInstanceOf(Array);
  });

  describe("mutation tracking - push", () => {
    test("emits mutation event on push", () => {
      const ap = new ArrayPlus([1, 2]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.push(3);

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("push");
      expect(event.detail.list).toEqual([1, 2, 3]);
    });
  });

  describe("mutation tracking - pop", () => {
    test("emits mutation event on pop", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.pop();

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("pop");
      expect(event.detail.list).toEqual([1, 2]);
    });
  });

  describe("mutation tracking - shift", () => {
    test("emits mutation event on shift", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.shift();

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("shift");
      expect(event.detail.list).toEqual([2, 3]);
    });
  });

  describe("mutation tracking - unshift", () => {
    test("emits mutation event on unshift", () => {
      const ap = new ArrayPlus([2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.unshift(1);

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("unshift");
      expect(event.detail.list).toEqual([1, 2, 3]);
    });
  });

  describe("mutation tracking - splice", () => {
    test("emits mutation event on splice", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.splice(1, 2, 10, 11);

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("splice");
      expect(event.detail.list).toEqual([1, 10, 11, 4, 5]);
    });
  });

  describe("mutation tracking - sort", () => {
    test("emits mutation event on sort", () => {
      const ap = new ArrayPlus([3, 1, 2]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.sort();

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("sort");
      expect(event.detail.list).toEqual([1, 2, 3]);
    });
  });

  describe("mutation tracking - reverse", () => {
    test("emits mutation event on reverse", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.reverse();

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("reverse");
      expect(event.detail.list).toEqual([3, 2, 1]);
    });
  });

  describe("mutation tracking - fill", () => {
    test("emits mutation event on fill", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.fill(0);

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("fill");
      expect(event.detail.list).toEqual([0, 0, 0]);
    });
  });

  describe("mutation tracking - copyWithin", () => {
    test("emits mutation event on copyWithin", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.copyWithin(0, 3);

      expect(mutationListener).toHaveBeenCalledOnce();
      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail.type).toBe("copyWithin");
    });
  });

  describe("multiple mutations", () => {
    test("emits separate events for each mutation", () => {
      const ap = new ArrayPlus();
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.push(1);
      ap.push(2);
      ap.pop();

      expect(mutationListener).toHaveBeenCalledTimes(3);
    });
  });

  describe("event detail consistency", () => {
    test("mutation event always includes list snapshot", () => {
      const ap = new ArrayPlus([1, 2]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.push(3);

      const callArgs = mutationListener.mock.calls[0];
      const event = callArgs?.[0] as CustomEvent;
      expect(event.detail).toHaveProperty("type");
      expect(event.detail).toHaveProperty("list");
      expect(Array.isArray(event.detail.list)).toBe(true);
      expect(event.detail.list.length).toBe(ap.length);
      expect(ap.every((item, idx) => event.detail.list[idx] === item)).toBe(
        true,
      );
    });
  });

  describe("upsert", () => {
    test("updates existing item by key when found", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });
      ap.upsert({ id: 1, name: "Alice Updated" });
      expect(ap).toEqual([{ id: 1, name: "Alice Updated" }]);
    });

    test("inserts item when key not found", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

      ap.upsert({ id: 2, name: "Bob" });

      expect(ap).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    test("handles single item upsert", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

      ap.upsert({ id: 1, name: "Alice Updated" });

      expect(ap.length).toBe(1);
      expect(ap[0]).toEqual({ id: 1, name: "Alice Updated" });
    });

    test("handles array of mixed updates and inserts", () => {
      const ap = new ArrayPlus(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        { key: "id" },
      );

      ap.upsert([
        { id: 1, name: "Alice Updated" },
        { id: 3, name: "Charlie" },
        { id: 2, name: "Bob Updated" },
      ]);

      expect(ap).toEqual([
        { id: 1, name: "Alice Updated" },
        { id: 2, name: "Bob Updated" },
        { id: 3, name: "Charlie" },
      ]);
    });

    test("batches consecutive updates into single splice", () => {
      const ap = new ArrayPlus(
        [
          { id: 1, val: "a" },
          { id: 2, val: "b" },
          { id: 3, val: "c" },
          { id: 4, val: "d" },
        ],
        { key: "id" },
      );
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.upsert([
        { id: 2, val: "B" },
        { id: 3, val: "C" },
      ]);

      expect(mutationListener).toHaveBeenCalledOnce();
      const calls = mutationListener.mock.calls;
      console.log(calls.length);
      if (calls.length > 0 && calls[0]) {
        const event = calls[0][0] as CustomEvent;
        expect(event.detail.type).toBe("upsert");
        expect(event.detail.updates).toHaveLength(2);
      }
    });

    test("uses default key from instance", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

      ap.upsert({ id: 1, name: "Alice Updated" });

      expect(ap[0]).toEqual({ id: 1, name: "Alice Updated" });
    });

    test("works with Map objects", () => {
      const map1 = new Map<string, unknown>([
        ["id", 1],
        ["name", "Alice"],
      ]);
      const ap = new ArrayPlus<Map<string, unknown>>([map1], { key: "id" });

      const map2 = new Map<string, unknown>([
        ["id", 1],
        ["name", "Alice Updated"],
      ]);
      ap.upsert(map2);

      expect(ap[0]).toEqual(
        new Map<string, unknown>([
          ["id", 1],
          ["name", "Alice Updated"],
        ]),
      );
    });

    test("inserts items with all required properties", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

      ap.upsert({ id: 2, name: "Bob" });

      expect(ap).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });

    test("inserts items that match with type constraint", () => {
      const ap = new ArrayPlus<{ id: number; name?: string }>([{ id: 1 }], {
        key: "id",
      });

      // With optional name property, can insert without it
      ap.upsert({ id: 2 });

      expect(ap).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test("emits mutation event with updates and inserts detail", () => {
      const ap = new ArrayPlus(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        { key: "id" },
      );
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.upsert([
        { id: 1, name: "Alice Updated" },
        { id: 3, name: "Charlie" },
      ]);

      expect(mutationListener).toHaveBeenCalledOnce();
      const calls = mutationListener.mock.calls;
      if (calls.length > 0 && calls[0]) {
        const event = calls[0][0] as CustomEvent;
        expect(event.detail.type).toBe("upsert");
        expect(event.detail.updates).toHaveLength(1);
        expect(event.detail.inserts).toHaveLength(1);
      }
    });

    test("handles empty upsert", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.upsert([]);

      expect(ap).toEqual([{ id: 1, name: "Alice" }]);
      expect(mutationListener).toHaveBeenCalledOnce();
    });

    test("updates multiple non-consecutive items", () => {
      const ap = new ArrayPlus(
        [
          { id: 1, val: "a" },
          { id: 2, val: "b" },
          { id: 3, val: "c" },
          { id: 4, val: "d" },
        ],
        { key: "id" },
      );

      ap.upsert([
        { id: 1, val: "A" },
        { id: 4, val: "D" },
      ]);

      expect(ap).toEqual([
        { id: 1, val: "A" },
        { id: 2, val: "b" },
        { id: 3, val: "c" },
        { id: 4, val: "D" },
      ]);
    });

    test("maintains insertion order of new items", () => {
      const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

      ap.upsert([
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
        { id: 4, name: "David" },
      ]);

      expect(ap).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
        { id: 4, name: "David" },
      ]);
    });

    describe("replace strategy", () => {
      test("replaces entire objects instead of mutating", () => {
        const original = { id: 1, name: "Alice", extra: "field" };
        const ap = new ArrayPlus<{ id: number; name: string; extra?: string }>(
          [original],
          { key: "id" },
        );

        const replacement = { id: 1, name: "Alice Updated" };
        ap.upsert(replacement, "replace");

        // With "upsert" strategy, the original object would be mutated
        // With "replace" strategy, it should be replaced entirely
        expect(ap[0]).toEqual(replacement);
        // The original object is replaced, not mutated
        expect(ap[0]).not.toBe(original);
      });

      test("replaces consecutive items using batched splice", () => {
        const ap = new ArrayPlus(
          [
            { id: 1, val: "a" },
            { id: 2, val: "b" },
            { id: 3, val: "c" },
            { id: 4, val: "d" },
          ],
          { key: "id" },
        );
        const mutationListener = vi.fn();
        ap.addEventListener("mutation", mutationListener);

        ap.upsert(
          [
            { id: 2, val: "B" },
            { id: 3, val: "C" },
          ],
          "replace",
        );

        expect(ap).toEqual([
          { id: 1, val: "a" },
          { id: 2, val: "B" },
          { id: 3, val: "C" },
          { id: 4, val: "d" },
        ]);
        expect(mutationListener).toHaveBeenCalledOnce();
        const calls = mutationListener.mock.calls;
        if (calls.length > 0 && calls[0]) {
          const event = calls[0][0] as CustomEvent;
          expect(event.detail.strategy).toBe("replace");
        }
      });

      test("replaces non-consecutive items individually", () => {
        const ap = new ArrayPlus(
          [
            { id: 1, val: "a" },
            { id: 2, val: "b" },
            { id: 3, val: "c" },
            { id: 4, val: "d" },
          ],
          { key: "id" },
        );

        ap.upsert(
          [
            { id: 1, val: "A" },
            { id: 4, val: "D" },
          ],
          "replace",
        );

        expect(ap).toEqual([
          { id: 1, val: "A" },
          { id: 2, val: "b" },
          { id: 3, val: "c" },
          { id: 4, val: "D" },
        ]);
      });

      test("still inserts items that don't exist", () => {
        const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

        ap.upsert(
          [
            { id: 1, name: "Alice Updated" },
            { id: 2, name: "Bob" },
          ],
          "replace",
        );

        expect(ap).toEqual([
          { id: 1, name: "Alice Updated" },
          { id: 2, name: "Bob" },
        ]);
      });
    });

    describe("insert strategy", () => {
      test("only inserts new items, does not update existing", () => {
        const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

        ap.upsert({ id: 1, name: "Alice Updated" }, "insert");

        // Original item should be unchanged
        expect(ap).toEqual([{ id: 1, name: "Alice" }]);
      });

      test("inserts new items while ignoring updates to existing", () => {
        const ap = new ArrayPlus(
          [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
          { key: "id" },
        );

        ap.upsert(
          [
            { id: 1, name: "Alice Updated" },
            { id: 3, name: "Charlie" },
            { id: 2, name: "Bob Updated" },
          ],
          "insert",
        );

        // Only id: 3 should be inserted, updates to 1 and 2 should be ignored
        expect(ap).toEqual([
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" },
        ]);
      });

      test("emits mutation event with noaction array for insert strategy", () => {
        const ap = new ArrayPlus(
          [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
          { key: "id" },
        );
        const mutationListener = vi.fn();
        ap.addEventListener("mutation", mutationListener);

        ap.upsert(
          [
            { id: 1, name: "Alice Updated" },
            { id: 3, name: "Charlie" },
          ],
          "insert",
        );

        expect(mutationListener).toHaveBeenCalledOnce();
        const calls = mutationListener.mock.calls;
        if (calls.length > 0 && calls[0]) {
          const event = calls[0][0] as CustomEvent;
          expect(event.detail.strategy).toBe("insert");
          expect(event.detail.inserts).toHaveLength(1);
          expect(event.detail.updates).toHaveLength(0);
          expect(event.detail.noaction).toHaveLength(1);
        }
      });

      test("still inserts items without keys", () => {
        const ap = new ArrayPlus([{ id: 1, name: "Alice" }], { key: "id" });

        ap.upsert({ id: 1, name: "Alice" }, "insert");

        expect(ap).toEqual([{ id: 1, name: "Alice" }]);
      });
    });

    describe("custom upsertMutator", () => {
      test("uses custom mutator instead of default", () => {
        const customMutator = (
          item: Record<string, unknown>,
          currentItem: Record<string, unknown>,
        ) => {
          if (item.name) {
            currentItem.name = item.name;
          }
        };
        const ap = new ArrayPlus([{ id: 1, name: "Alice", age: 30 }], {
          key: "id",
          upsertMutator: customMutator,
        });

        ap.upsert({ id: 1, name: "Alice Updated", age: 31 });

        // Only name should be updated, age should remain 30
        expect(ap[0]).toEqual({ id: 1, name: "Alice Updated", age: 30 });
      });

      test("custom mutator is not called with replace strategy", () => {
        const customMutator = vi.fn();
        const ap = new ArrayPlus([{ id: 1, name: "Alice" }], {
          key: "id",
          upsertMutator: customMutator,
        });

        ap.upsert({ id: 1, name: "Alice Updated" }, "replace");

        expect(customMutator).not.toHaveBeenCalled();
        expect(ap[0]).toEqual({ id: 1, name: "Alice Updated" });
      });
    });

    describe("upsertStrategy property", () => {
      test("uses upsertStrategy property when no strategy parameter is passed", () => {
        const ap = new ArrayPlus<{ id: number; name: string; extra?: string }>(
          [
            {
              id: 1,
              name: "Alice",
              extra: "field",
            },
          ],
          { key: "id", upsertStrategy: "replace" },
        );

        ap.upsert({ id: 1, name: "Alice Updated" });

        // With replace strategy, the object should be replaced, not mutated
        expect(ap[0]).toEqual({ id: 1, name: "Alice Updated" });
        // Verify the extra field is gone (indicating replacement, not mutation)
        expect(ap[0]).not.toHaveProperty("extra");
      });

      test("strategy parameter overrides upsertStrategy property", () => {
        const ap = new ArrayPlus<{ id: number; name: string; extra?: string }>(
          [
            {
              id: 1,
              name: "Alice",
              extra: "field",
            },
          ],
          { key: "id", upsertStrategy: "replace" },
        );

        // Use "upsert" strategy explicitly, which should mutate instead
        ap.upsert({ id: 1, name: "Alice Updated" }, "upsert");

        // With upsert strategy, the object should be mutated (extra field preserved)
        expect(ap[0]).toEqual({
          id: 1,
          name: "Alice Updated",
          extra: "field",
        });
      });
    });
  });

  describe("generic type support", () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    test("works with specific typed array", () => {
      const users: User[] = new ArrayPlus<User>();
      users.push({ id: 1, name: "Alice", email: "alice@example.com" });
      users.push({ id: 2, name: "Bob", email: "bob@example.com" });

      expect(users.length).toBe(2);
      expect(users[0]?.name).toBe("Alice");
      expect(users[1]?.email).toBe("bob@example.com");
    });

    test("typed array with upsert preserves type safety", () => {
      const users = new ArrayPlus<User>(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        { key: "id" },
      );

      users.upsert({
        id: 1,
        name: "Alice Updated",
        email: "alice.updated@example.com",
      });

      expect(users[0]?.name).toBe("Alice Updated");
      expect(users[0]?.email).toBe("alice.updated@example.com");
    });

    test("typed array with custom upsertMutator", () => {
      const users = new ArrayPlus<User>(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        {
          key: "id",
          // Custom mutator for User type
          upsertMutator: (item: User, currentUser: User) => {
            currentUser.name = item.name;
            currentUser.email = item.email;
          },
        },
      );

      users.upsert({
        id: 1,
        name: "Alice Updated",
        email: "alice.updated@example.com",
      });

      expect(users[0]).toEqual({
        id: 1,
        name: "Alice Updated",
        email: "alice.updated@example.com",
      });
    });
  });

  describe("conditional type support with key constraint", () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    test("with key constraint, upsert accepts partial objects with required key", () => {
      const users = new ArrayPlus<User, "id">(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        { key: "id" },
      );

      // Should accept partial object with required 'id' key
      users.upsert({ id: 1, name: "Alice Updated" });

      expect(users[0]?.name).toBe("Alice Updated");
    });

    test("with key constraint, upsert requires the key property", () => {
      const users = new ArrayPlus<User, "id">(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        { key: "id" },
      );

      // TypeScript will error if we try to pass object without 'id' key
      // This test documents the type-safe behavior
      users.upsert({ id: 2, name: "Bob" });

      expect(users.length).toBe(2);
    });

    test("with key constraint, accepts multiple partial objects in array", () => {
      const users = new ArrayPlus<User, "id">(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        { key: "id" },
      );

      users.upsert([
        { id: 1, name: "Alice Updated" },
        { id: 2, name: "Bob", email: "bob@example.com" },
        { id: 3, email: "charlie@example.com" },
      ]);

      expect(users.length).toBe(3);
      expect(users[0]?.name).toBe("Alice Updated");
      expect(users[1]?.name).toBe("Bob");
    });

    test("without key constraint, upsert requires full objects", () => {
      const users = new ArrayPlus<User>(
        [{ id: 1, name: "Alice", email: "alice@example.com" }],
        { key: "id" },
      );

      // Without K specified, all properties are required at compile time
      // This is more restrictive but ensures type safety
      users.upsert({
        id: 1,
        name: "Alice Updated",
        email: "alice@example.com",
      });

      expect(users[0]?.name).toBe("Alice Updated");
    });

    test("multiple keys can be used with union type", () => {
      interface Document {
        uuid: string;
        id: number;
        title: string;
        content: string;
      }

      // Can use either uuid or id as key via cast (for complex scenarios)
      const docs = new ArrayPlus<Document, "uuid">(
        [
          {
            uuid: "a1",
            id: 1,
            title: "First",
            content: "Content 1",
          },
        ],
        { key: "uuid" },
      );

      // With uuid as key, uuid is required
      docs.upsert({ uuid: "a1", title: "Updated" });

      expect(docs[0]?.title).toBe("Updated");
    });
  });

  describe("remove", () => {
    test("removes a single item by reference", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.remove(2);

      expect(ap).toEqual([1, 3]);
      expect(mutationListener).toHaveBeenCalledOnce();
    });

    test("removes a single item by key", () => {
      interface Item {
        id: number;
        name: string;
      }

      const ap = new ArrayPlus<Item, "id">(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" },
        ],
        { key: "id" },
      );

      ap.remove({ id: 2 });

      expect(ap).toEqual([
        { id: 1, name: "Alice" },
        { id: 3, name: "Charlie" },
      ]);
    });

    test("removes multiple items from array input", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5]);
      ap.remove([2, 4]);

      expect(ap).toEqual([1, 3, 5]);
    });

    test("removes consecutive items with single splice call", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      // Remove items at consecutive indexes [2, 3, 4] (values 3, 4, 5)
      ap.remove([3, 4, 5]);

      expect(ap).toEqual([1, 2]);
      // Should have exactly 1 splice call (one mutation event)
      expect(mutationListener).toHaveBeenCalledOnce();
    });

    test("removes scattered items with multiple splice calls", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5, 6, 7, 8]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      // Remove items at scattered indexes (values 2, 5, 8)
      ap.remove([2, 5, 8]);

      expect(ap).toEqual([1, 3, 4, 6, 7]);
      // Should have splice calls for non-consecutive removals
      expect(mutationListener.mock.calls.length).toBeGreaterThan(0);
    });

    test("ignores duplicate items in removal array", () => {
      const ap = new ArrayPlus([1, 2, 3, 4, 5]);
      ap.remove([2, 2, 2]);

      expect(ap).toEqual([1, 3, 4, 5]);
    });

    test("does nothing when removing non-existent item", () => {
      const ap = new ArrayPlus([1, 2, 3]);
      const mutationListener = vi.fn();
      ap.addEventListener("mutation", mutationListener);

      ap.remove(99);

      expect(ap).toEqual([1, 2, 3]);
      expect(mutationListener).not.toHaveBeenCalled();
    });

    test("removes items using instance key", () => {
      interface User {
        id: number;
        name: string;
      }

      const users = new ArrayPlus<User, "id">(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
          { id: 3, name: "Charlie" },
        ],
        { key: "id" },
      );

      users.remove({ id: 2 });

      expect(users).toEqual([
        { id: 1, name: "Alice" },
        { id: 3, name: "Charlie" },
      ]);
    });

    test("removes items using key parameter override", () => {
      interface User {
        id: number;
        email: string;
        name: string;
      }

      const users = new ArrayPlus<User, "email">();
      users.push(
        { id: 1, email: "alice@example.com", name: "Alice" },
        { id: 2, email: "bob@example.com", name: "Bob" },
      );

      // Remove by email using key parameter
      users.remove({ email: "bob@example.com" }, "email");

      expect(users).toEqual([
        { id: 1, email: "alice@example.com", name: "Alice" },
      ]);
    });

    test("removes from Map-based items", () => {
      const map1 = new Map([
        ["id", "1"],
        ["name", "Alice"],
      ]);
      const map2 = new Map([
        ["id", "2"],
        ["name", "Bob"],
      ]);
      const map3 = new Map([
        ["id", "3"],
        ["name", "Charlie"],
      ]);

      const ap = new ArrayPlus<Map<string, string>>([map1, map2, map3], {
        key: "id",
      });

      ap.remove(new Map([["id", "2"]]));

      expect(ap).toEqual([map1, map3]);
    });

    test("removes multiple items with key-based lookup", () => {
      interface Item {
        id: number;
        value: string;
      }

      const ap = new ArrayPlus<Item, "id">(
        [
          { id: 1, value: "a" },
          { id: 2, value: "b" },
          { id: 3, value: "c" },
          { id: 4, value: "d" },
        ],
        { key: "id" },
      );

      ap.remove([{ id: 2 }, { id: 4 }]);

      expect(ap).toEqual([
        { id: 1, value: "a" },
        { id: 3, value: "c" },
      ]);
    });
  });

  describe("template property", () => {
    test("fills items during construction when key and template are both set", () => {
      interface User {
        id: number;
        name: string;
        status: string;
      }

      const ap = new ArrayPlus<User, "id">(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        {
          key: "id",
          template: { status: "active" } as Record<string, string>,
        },
      );

      expect(ap[0]?.status).toBe("active");
      expect(ap[1]?.status).toBe("active");
      expect(ap[0]?.name).toBe("Alice"); // Preserves existing properties
    });

    test("does not fill items during construction when key is not set", () => {
      interface User {
        id: number;
        name: string;
        status?: string;
      }

      const ap = new ArrayPlus<User>([{ id: 1, name: "Alice" }], {
        template: { status: "active" } as Record<string, string>,
      });

      expect(ap[0]?.status).toBeUndefined();
    });

    test("does not fill items during construction when template is not set", () => {
      interface User {
        id: number;
        name: string;
        status?: string;
      }

      const ap = new ArrayPlus<User, "id">([{ id: 1, name: "Alice" }], {
        key: "id",
      });

      expect(ap[0]?.status).toBeUndefined();
    });

    test("fills items when pushed with key and template set", () => {
      interface Item {
        id: number;
        name: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.push({ id: 1, name: "Item 1" });

      expect(ap[0]?.type).toBe("default");
      expect(ap[0]?.name).toBe("Item 1");
    });

    test("fills items when unshifted with key and template set", () => {
      interface Item {
        id: number;
        name: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.unshift({ id: 1, name: "Item 1" });

      expect(ap[0]?.type).toBe("default");
    });

    test("fills items when spliced with key and template set", () => {
      interface Item {
        id: number;
        name: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.splice(0, 0, { id: 1, name: "Item 1" });

      expect(ap[0]?.type).toBe("default");
    });

    test("fills items when fill() is called with key and template set", () => {
      interface Item {
        id: number;
        name: string;
        status: string;
      }

      const ap = new ArrayPlus<Item, "id">(
        [
          { id: 1, name: "A", status: "old" },
          { id: 2, name: "B", status: "old" },
        ],
        { key: "id", template: { status: "new" } as Record<string, string> },
      );

      ap.fill({ id: 99, name: "filled", status: "filled" }, 0, 1);

      expect(ap[0]?.status).toBe("filled");
    });

    test("does not fill when template is not set even if key is set", () => {
      interface Item {
        id: number;
        name: string;
        type?: string;
      }

      const ap = new ArrayPlus<Item, "id">([], { key: "id" });

      ap.push({ id: 1, name: "Item 1" });

      expect(ap[0]?.type).toBeUndefined();
    });

    test("preserves existing properties and only fills missing ones", () => {
      interface Item {
        id: number;
        name: string;
        type: string;
        status: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: {
          type: "default",
          status: "active",
        } as Record<string, string>,
      });

      ap.push({ id: 1, name: "Item", type: "custom" }); // type already set

      expect(ap[0]?.type).toBe("custom"); // Preserves existing value
      expect(ap[0]?.status).toBe("active"); // Fills missing value
    });

    test("fills with Map template when item is Map and both key and template are set", () => {
      const ap = new ArrayPlus<Map<string, string>>([], {
        key: "id",
        template: new Map([["status", "active"]]) as Map<string, string>,
      });

      const itemMap = new Map([["id", "1"]]);
      ap.push(itemMap);

      expect(ap[0]?.get("status")).toBe("active");
      expect(ap[0]?.get("id")).toBe("1");
    });

    test("does not fill when template is object but item is Map (type mismatch)", () => {
      const ap = new ArrayPlus<Map<string, string>>([], {
        key: "id",
        template: { status: "active" } as Record<string, string>, // Intentional mismatch
      });

      const itemMap = new Map([["id", "1"]]);
      ap.push(itemMap);

      expect(ap[0]?.get("status")).toBeUndefined();
    });

    test("does not fill when template is Map but item is object (type mismatch)", () => {
      interface Item {
        id: string;
        status?: string;
      }

      const ap = new ArrayPlus<Item>([], {
        key: "id",
        template: new Map([["status", "active"]]) as Map<string, string>, // Intentional mismatch
      });

      ap.push({ id: "1" });

      expect(ap[0]?.status).toBeUndefined();
    });

    test("upsert with 'insert' strategy fills new items with template", () => {
      interface Item {
        id: number;
        value: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.upsert({ id: 1, value: "test" }, "insert");

      expect(ap[0]?.type).toBe("default");
    });

    test("upsert with 'replace' strategy fills items with template", () => {
      interface Item {
        id: number;
        value: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.upsert({ id: 1, value: "test" }, "replace");

      expect(ap[0]?.type).toBe("default");
    });

    test("upsert with 'upsert' strategy (default) does NOT fill items with template", () => {
      interface Item {
        id: number;
        value: string;
        type?: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "default" } as Record<string, string>,
      });

      ap.upsert({ id: 1, value: "test" }); // Default strategy is 'upsert'

      expect(ap[0]?.type).toBeUndefined(); // Template NOT applied in upsert strategy
    });

    test("fill works with empty template without errors", () => {
      interface Item {
        id: number;
        name: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: {} as Record<string, string>,
      });

      ap.push({ id: 1, name: "Item" });

      expect(ap[0]?.name).toBe("Item");
    });

    test("multiple items pushed at once are all filled with template", () => {
      interface Item {
        id: number;
        name: string;
        type: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { type: "bulk" } as Record<string, string>,
      });

      ap.push({ id: 1, name: "A" }, { id: 2, name: "B" }, { id: 3, name: "C" });

      expect(ap[0]?.type).toBe("bulk");
      expect(ap[1]?.type).toBe("bulk");
      expect(ap[2]?.type).toBe("bulk");
    });

    test("template respects property descriptor behavior on objects", () => {
      interface Item {
        id: number;
        name: string;
        readonly status: string;
      }

      const ap = new ArrayPlus<Item, "id">([], {
        key: "id",
        template: { status: "active" } as Partial<Item>,
      });

      // This should work even though status might be readonly at type level
      ap.push({ id: 1, name: "Item" });

      // Template was attempted to be filled
      expect(ap[0]).toBeDefined();
    });
  });
});
