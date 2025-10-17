import { createHocuspocusProvider } from '$lib/demo/client.js';
import * as Y from 'yjs';

export async function createSyncedDocument() {
	const doc = new Y.Doc();

	createHocuspocusProvider(doc);
	await doc.whenSynced;

	return doc;
}
