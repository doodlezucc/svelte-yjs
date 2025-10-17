import * as Y from 'yjs';
import { createHocuspocusProvider } from '../demo/client.js';

export async function createSyncedDocument() {
	const doc = new Y.Doc();

	createHocuspocusProvider(doc);
	await doc.whenSynced;

	return doc;
}
