# ArrayPlus

A strongly-typed Array subclass that extends native arrays with key-based upsert operations, mutation tracking, and type-safe partial object support.

**Overview**

- all Array methods, properties and behaviour
- `remove` method
- `upsert` method
- `addEventListener` / `removeEventListener` / `dispatchEvent`
  dispatched events:
  - `mutation`

> Designed for my personal use, I wanted a somewhat simple way to do reactivity for array when using vanilla js and have some useful additional methods

## Basic Usage

```typescript
import { ArrayPlus } from './ArrayPlus';

interface User {
  id: number;
  name: string;
  email: string;
}

// Create a typed array
const users = new ArrayPlus<User>([
  { id: 1, name: "Alice", email: "alice@example.com" }
]);

// All standard array methods work
users.push({ id: 2, name: "Bob", email: "bob@example.com" });
```

## Constructor Options

ArrayPlus accepts two parameters:

1. **items** (optional): An array of initial items (defaults to empty array)

2. **options** (optional): Configuration object with these properties:
   - `key`: String property name to use for upsert operations
   - `upsertStrategy`: Default upsert strategy ("upsert" | "insert" | "replace")
   - `template`: Default values to fill into new items (must match item type: object or map)
   - `upsertMutator`: Custom function to control property merging

   > Notes:
   >
   > `key` is only applicable for object and map items
   > `upsertStrategy` "upsert" and "replace" are only applicable to objects and maps via the `key`
   > `template` only takes effect if `key` is defined
   > `upsertMutator` only applicable to `upsertStrategy` "upsert" conditions

```typescript
// With initial items and key
const users = new ArrayPlus<User>(
  [{ id: 1, name: "Alice", email: "alice@example.com" }],
  { key: "id" }
);

// With all options
const users = new ArrayPlus<User>(
  [],
  {
    key: "id",
    upsertStrategy: "replace",
    template: { status: "active" },
    upsertMutator: (newItem, existing) => {
      existing.name = newItem.name;
      // Custom merge logic
    }
  }
);
```

## Key-Based Upsert

Set a key property to enable upsert operations that update existing items or insert new ones.

```typescript
const users = new ArrayPlus<User>([], { key: "id" });

// Updates if id: 1 exists, inserts if not
users.upsert({ id: 1, name: "Alice", email: "alice@example.com" });
users.upsert({ id: 1, name: "Alice Smith", email: "alice@example.com" }); // Updates

// Multiple items at once
users.upsert([
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" }
]);
```

## Type-Safe Partial Objects with K Constraint

Use the second generic parameter `K` to specify a required key property at compile time. This allows partial objects in upsert while requiring the key field.

> Note:
>
> This will make properties of item optional for all array methods.
> It may be undesirable that non upsert methods can insert incomplete items.
> In most cases it is best combined with the `template` option so you can guarantee items have all the props you want.

```typescript
// K = "id" means: id is required, other properties optional
const users = new ArrayPlus<User, "id">(
  [{ id: 1, name: "Alice", email: "alice@example.com" }],
  { key: "id" }
);

// TypeScript requires id, but other properties are optional
users.upsert({ id: 1, name: "Alice Updated" }); // ✅ Valid

// This would be a TypeScript error:
// users.upsert({ name: "Bob" }); // ❌ Missing required 'id'

// With all properties (also valid):
users.upsert({ id: 2, name: "Bob", email: "bob@example.com" }); // ✅ Valid
```

### Without K Constraint

When K is not specified, all properties defined in the type are required at compile time:

```typescript
const users = new ArrayPlus<User>([], { key: "id" });

// All properties required
users.upsert({
  id: 1,
  name: "Alice",
  email: "alice@example.com"
}); // ✅ Valid

// Missing email is a TypeScript error:
// users.upsert({ id: 1, name: "Alice" }); // ❌ Missing 'email'
```

## Optional Properties

If your type has optional properties, they don't need to be provided:

```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

const users = new ArrayPlus<User>([], { key: "id" });

users.upsert({ id: 1, name: "Alice" }); // ✅ Valid, email optional
users.upsert({ id: 2, name: "Bob", email: "bob@example.com" }); // ✅ Also valid
```

## Upsert Strategies

Control how items are merged when updating:

> new items in "upsert" and "replace" mode get inserted

### "upsert" (default)
Merges the incoming object properties into the existing item:

```typescript
const users = new ArrayPlus<User, "id">(
  [{ id: 1, name: "Alice", email: "alice@example.com" }],
  { key: "id" }
);

users.upsert({ id: 1, name: "Alice Updated" }, "upsert");
// Result: { id: 1, name: "Alice Updated", email: "alice@example.com" }
```

### "replace"
Replaces the entire object:

```typescript
users.upsert({ id: 1, name: "Alice Updated" }, "replace");
// Result: { id: 1, name: "Alice Updated" }
// Note: email property is removed
```

> Note:
>
> If you are using the `template` option and the template has email, it will be present but will be the default value in template. 

### "insert"

Only inserts new items, ignores items with matching keys:

```typescript
users.upsert({ id: 1, name: "Alice Updated" }, "insert");
// Existing item with id: 1 is NOT updated
// Item is NOT inserted (because a matching key already exists)

users.upsert({ id: 3, name: "Charlie" }, "insert");
// New item with id: 3 IS inserted (no matching key found)
```

> Note: 
>
> If you try to upsert an item whose key matches an existing item with "insert" strategy, that item is neither updated nor inserted - it's simply ignored.
>
> If you are using `template` option any missing template props will be filled.

Set a default strategy on the instance:

```typescript
const users = new ArrayPlus<User, "id">([], {
  key: "id",
  upsertStrategy: "replace" // All upserts use replace by default
});

users.upsert({ id: 1, name: "Alice" }); // Uses "replace"
users.upsert({ id: 2, name: "Bob" }, "upsert"); // Override with "upsert"
```

## Custom Mutators

Control how properties are merged during upsert:

```typescript
const users = new ArrayPlus<User, "id">(
  [{ id: 1, name: "Alice", email: "alice@example.com" }],
  {
    key: "id",
    // Only update specific properties
    upsertMutator: (newItem, existingItem) => {
      existingItem.name = newItem.name;
      // Don't update email, even if provided
    }
  }
);

users.upsert({ id: 1, name: "Alice Updated", email: "newemail@example.com" });
// Result: { id: 1, name: "Alice Updated", email: "alice@example.com" }
```

## Remove Items

Remove items by reference or by key. The remove method efficiently batches consecutive removals into single splice operations for better performance.

### Remove by Reference

Remove items by direct object reference (useful for primitive values or when you have a saved reference):

```typescript
// With primitive values
const numbers = new ArrayPlus([1, 2, 3, 4, 5]);
numbers.remove(3);
// Result: [1, 2, 4, 5]

// With objects, you need to keep a reference
const users = new ArrayPlus<User>([]);
const alice = { id: 1, name: "Alice", email: "alice@example.com" };
const bob = { id: 2, name: "Bob", email: "bob@example.com" };
const charlie = { id: 3, name: "Charlie", email: "charlie@example.com" };

users.push(alice, bob, charlie);

// Remove by passing the actual reference
users.remove(bob);

// Result: [alice, charlie]
```

**Note:** For objects, **key-based removal is usually more practical** since you don't need to maintain object references.

### Remove by Key

When a `key` is configured, remove items by partial key match:

```typescript
const users = new ArrayPlus<User>(
  [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
    { id: 3, name: "Charlie", email: "charlie@example.com" }
  ],
  { key: "id" }
);

// Remove by key - only need to provide the key property
// but often its more convinient to pass a full reference you may have
users.remove({ id: 2 });

// Result: [
//   { id: 1, name: "Alice", email: "alice@example.com" },
//   { id: 3, name: "Charlie", email: "charlie@example.com" }
// ]
```

### Remove Multiple Items

Remove multiple items at once by passing an array:

```typescript
const users = new ArrayPlus<User>([], { key: "id" });
users.push(
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
  { id: 4, name: "David", email: "david@example.com" }
);

// Remove multiple items
users.remove([
  { id: 2 },
  { id: 4 }
]);

// Result: [
//   { id: 1, name: "Alice", email: "alice@example.com" },
//   { id: 3, name: "Charlie", email: "charlie@example.com" }
// ]
```

### Performance: Consecutive Removals

When removing multiple items with consecutive indices, the remove method automatically batches them into a single splice operation for efficiency:

```typescript
const items = new ArrayPlus([1, 2, 3, 4, 5, 6, 7, 8], {});
const mutationListener = (event: CustomEvent) => {
  console.log("Mutation type:", event.detail.type); // "remove"
};

items.addEventListener("mutation", mutationListener);

// Removing items at consecutive indices [2, 3, 4] (values 3, 4, 5)
// This triggers only ONE splice operation instead of three
items.remove([3, 4, 5]);

// Result: [1, 2, 6, 7, 8]
```

**Note:** Scattered removals may trigger multiple splice operations to maintain efficiency. Duplicates in the removal array are automatically deduplicated.

### Remove with Maps

Works with Map objects using key-based lookup:

```typescript
const items = new ArrayPlus<Map<string, unknown>>(
  [
    new Map([["id", "1"], ["name", "Alice"]]),
    new Map([["id", "2"], ["name", "Bob"]]),
    new Map([["id", "3"], ["name", "Charlie"]])
  ],
  { key: "id" }
);

items.remove(new Map([["id", "2"]]));
// Typically you would be passing an item reference

// Remaining items:
// [
//   Map { "id" -> "1", "name" -> "Alice" },
//   Map { "id" -> "3", "name" -> "Charlie" }
// ]
```

## Template Property

Automatically fill default values for new items when both `key` and `template` are set:

```typescript
interface User {
  id: number;
  name: string;
  status: string;
}

const users = new ArrayPlus<User, "id">(
  [{ id: 1, name: "Alice" }],
  {
    key: "id",
    template: { status: "active" }
  }
);

// Items in constructor are filled
console.log(users[0].status); // "active"

// New items via push/unshift/splice are filled
users.push({ id: 2, name: "Bob" });
console.log(users[1].status); // "active"

// Existing values are preserved
users.push({ id: 3, name: "Charlie", status: "inactive" });
console.log(users[2].status); // "inactive" (not overwritten)
```

**Important:** The template is applied when:
- Constructor initialization (when both `key` and `template` are set)
- `push()`, `unshift()`, `splice()`, and `fill()` operations
- `upsert()` with "insert" or "replace" strategies

The template is **NOT** applied during `upsert()` with the default "upsert" strategy, as it only merges properties without filling new ones - no need for filling.

## Mutation Events

Listen for changes to track mutations:

```typescript
const users = new ArrayPlus<User>([]);

users.addEventListener("mutation", (event) => {
  const detail = (event as CustomEvent).detail;
  console.log(detail.type); // "push", "upsert", "splice", etc.
  console.log(detail.list); // Current array contents

  if (detail.type === "upsert") {
    console.log(detail.changed); // total count of updates and inserts
    console.log(detail.updates); // Items that were updated
    console.log(detail.inserts); // Items that were inserted
    console.log(detail.noaction) // items that neither updated or inserted
  }
});

users.upsert({ id: 1, name: "Alice", email: "alice@example.com" });
```

## Multiple Items

Upsert multiple items at once:

```typescript
const users = new ArrayPlus<User, "id">([], { key: "id" });

users.upsert([
  { id: 1, name: "Alice Updated" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie" }
]);

// Consecutive updates are batched into a single mutation event
```

## With Maps

Works with Map objects for dynamic key access:

```typescript
const items = new ArrayPlus<Map<string, unknown>>([], { key: "id" });

const map1 = new Map([
  ["id", 1],
  ["name", "Alice"]
]);

items.upsert(map1);

const map2 = new Map([
  ["id", 1],
  ["name", "Alice Updated"]
]);

items.upsert(map2); // Updates the first map
```

## All Array Methods Work

Since ArrayPlus extends Array, all standard array methods are available:

```typescript
const users = new ArrayPlus<User>([]);

// Standard methods
users.push(...);
users.pop();
users.shift();
users.unshift(...);
users.splice(...);
users.map(...);
users.filter(...);
users.find(...);
users.slice();
// ... and all other Array methods

// Mutation tracking applies to all mutating methods
users.addEventListener("mutation", handler); // Fires for push, pop, splice, etc.
```

## Important Notes

- **K parameter is compile-time only**: Setting `K` to a key doesn't automatically configure the runtime key. You must pass `key: "id"` in the constructor options for runtime behavior.
- **Runtime configuration**: All configuration (key, upsertStrategy, template, upsertMutator) is set via constructor options, not instance properties.
- **Type safety**: The K parameter provides compile-time type safety for your upsert calls.
- **Partial merging**: When using "upsert" strategy with partial objects, unmapped properties are preserved from the existing item.
- **Clean array representation**: Since properties are private fields, the array itself remains uncontaminated and directly usable for equality checks and serialization.
