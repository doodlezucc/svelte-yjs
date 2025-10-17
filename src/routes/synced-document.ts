import * as Y from 'yjs';
import { createHocuspocusProvider } from '../demo/client.js';

export async function createSyncedDocument() {
	const doc = new Y.Doc();

	const provider = createHocuspocusProvider(doc);
	await doc.whenSynced;

	return {
		doc,
		awareness: provider.awareness!
	};
}
