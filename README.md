# svelte-yjs

Reactive [Svelte](https://svelte.dev/) wrappers around [Yjs](https://yjs.dev/).

## Usage

The heart of `svelte-yjs` is the `wrapYjsDocumentInState(...)` function. You can pass in an initialized Yjs document (a `Y.Doc` instance) and work with the result like with any `$state` wrapped object.

```ts
import { wrapYjsDocumentInState, type DeclareSyncableDocument } from 'svelte-yjs';
import * as Y from 'yjs';

// Yjs only supports certain "shared types". It's recommended that you
// declare your document structure with `DeclareSyncableDocument<...>`,
// which enforces a specific typed structure.
type TodoListDocument = DeclareSyncableDocument<{
	title: string;
	description?: string;
	items: {
		text: string;
		done: boolean;
	}[];
}>;

const doc = new Y.Doc();

// You should initialize persistence and/or syncing here using Yjs
// providers like "y-indexeddb" or "y-websocket".

const state = wrapYjsDocumentInState<TodoListDocument>({
	yjsDocument: doc,
	initialState: {
		title: 'New Todo List',
		items: []
	}
});

function createNewTodoItem() {
	// Interact with the document state like you would with any object.
	// The underlying Y.Array in the document is updated automatically.
	state.items.push({ text: '', done: false });
}

// Svelte runes can be used on the synchronized state. This also updates
// when any connected peers add or remove an item from the list.
let hasAnyTodoItems = $derived(state.items.length > 0);
```

### Allowed Types

The following types are allowed for declaring the structure of your document. The generic type `T` of complex data structures like arrays and maps is deeply bound to the same restrictions.

| Syncable Type       | Yjs Structure |
| ------------------- | ------------- |
| `boolean`           | (atomic)      |
| `number`            | (atomic)      |
| `string`            | (atomic)      |
| `null`              | (atomic)      |
| `undefined`         | (atomic)      |
| `Uint8Array`        | (atomic)      |
| `Record<string, T>` | `Y.Map<T>`    |
| `Map<string, T>`    | `Y.Map<T>`    |
| `Array<T>`          | `Y.Array<T>`  |
| `SyncedText`        | `Y.Text`      |

Note that `Record<string, T>` refers to any JavaScript object which consists of syncable type properties. In other words, you can declare your document as an object with multiple nesting levels - during runtime, each level is internally represented as a `Y.Map`.

`SyncedText` is an exported class from `svelte-yjs`, which can be used to implement collaborative text editing. Instead of replacing the entire shared text string on every keypress, you can use the "delta" functions on `SyncedText` instances to insert text at one point or to delete some characters at another point.

## Awareness

Awareness (or "presence") in Yjs represents **live** user information that isn't persisted in the document. For example, this could be a nickname or the current cursor position of any connected user.

In `svelte-yjs`, this live information can be modified and reacted to using the `wrapYjsAwarenessInState(...)` function.

```ts
import { wrapYjsAwarenessInState } from 'svelte-yjs';

interface UserState {
	nickname: string;
	cursor?: {
		x: number;
		y: number;
	};
}

// Most Yjs providers expose an interactable "Awareness"
// instance as a property. That instance can be passed to
// wrapYjsAwarenessInState(...) to produce a reactive version.
const yjsProvider = /** */;

const awareness = wrapYjsAwarenessInState<UserState>({
	yjsAwareness: yjsProvider.awareness,
	initialState: {
		nickname: 'Alice'
	}
});

function onMouseMove(ev: MouseEvent) {
	// Modify the live information associated with the local
	// user by updating the `local` property.
	awareness.local.cursor = { x: ev.pageX, y: ev.pageY };
}

// `states` maps all connected client IDs to their current state.
// Whenever a user updates their nickname, this $derived value
// gets automatically re-evaluated.
let allOnlineNames = $derived(
	awareness.states
		.values()
		.map((state) => state.nickname)
		.toArray()
);
```
