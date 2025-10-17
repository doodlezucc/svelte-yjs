import { expect, test } from 'vitest';
import * as Y from 'yjs';
import { createSyncedState } from '../create-synced-state.js';
import type { DeclareSyncableDocument } from '../syncable-document-type.js';

type SyncedDocument = DeclareSyncableDocument<{
	stringArray: string[];
}>;

test('Undo/redo', () => {
	const yjsDocument = new Y.Doc();
	yjsDocument.isSynced = true;

	const syncedState = createSyncedState<SyncedDocument>({
		yjsDocument: yjsDocument,
		initialState: {
			stringArray: []
		}
	});

	const undoManager = new Y.UndoManager(yjsDocument);
	syncedState.stringArray = ['first item', 'second item'];

	expect(syncedState).toEqual<SyncedDocument>({
		stringArray: ['first item', 'second item']
	});

	undoManager.undo();
	expect(syncedState).toEqual<SyncedDocument>({
		stringArray: []
	});

	undoManager.redo();
	expect(syncedState).toEqual<SyncedDocument>({
		stringArray: ['first item', 'second item']
	});
});
