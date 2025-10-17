import type { PageLoad } from './$types.js';
import { createSyncedDocument } from './synced-document.js';

export const ssr = false;

export const load: PageLoad = async () => {
	const syncedDocument = await createSyncedDocument();

	return syncedDocument;
};
