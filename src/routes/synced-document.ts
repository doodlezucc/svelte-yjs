import { browser } from '$app/environment';
import { createHocuspocusProvider } from '$lib/demo/client.js';
import * as Y from 'yjs';

function createSyncedDocument() {
	const doc = new Y.Doc();

	if (browser) {
		createHocuspocusProvider(doc);

		doc.on('afterTransactionCleanup', () => {
			const update = Y.encodeStateAsUpdate(doc);
			Y.logUpdate(update);
			console.log(update.byteLength);
		});
	}

	return doc;
}

export const doc = createSyncedDocument();
