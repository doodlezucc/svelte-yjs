import { Doc as YDoc } from 'yjs';
import type { DeclareDocument, SyncableDocument } from './syncable-document-type.js';
import { SyncedText } from './synced-text.svelte.js';

function createThing<T extends SyncableDocument>(initialState: T) {
	const yDoc = new YDoc();

	yDoc.getMap().get;

	return { doc: yDoc };
}

type MySchema = DeclareDocument<{
	a?: 'abc' | 'cde';
}>;

const document = createThing({
	nodes: new Map<string, SyncedText>(),
	todoItems: [] as string[]
});
