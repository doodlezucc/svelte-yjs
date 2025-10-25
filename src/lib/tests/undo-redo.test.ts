import { expect, test } from 'vitest';
import * as Y from 'yjs';
import type { DeclareSyncableDocument } from '../types/syncable-document-type.js';
import { wrapYjsDocumentInState } from '../wrap-in-state.js';

type SyncedDocument = DeclareSyncableDocument<{
	stringArray: string[];
}>;

test('Undo/redo', () => {
	const yjsDocument = new Y.Doc();
	yjsDocument.isSynced = true;

	const syncedState = wrapYjsDocumentInState<SyncedDocument>({
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
