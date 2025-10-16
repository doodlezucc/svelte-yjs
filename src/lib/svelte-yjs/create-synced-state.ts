import * as Y from 'yjs';
import { createProxyFromYType } from './proxies/generic.js';
import { MapSynchronizer } from './proxies/synchronizers/map-synchronizer.svelte.js';
import type { SyncableDocument, SyncableType } from './syncable-document-type.js';

export function createSyncedState<T extends SyncableDocument>(
	options: CreateSyncedStateOptions<T>
): T {
	const { initialState, yjsDocument, yjsTopLevelIdentifier = '' } = options;

	if (!yjsDocument.isSynced || !yjsDocument.isLoaded) {
		throw new Error(
			'Y.Doc has not received "sync" or "load" events yet. A Y.Doc must be synced with a provider before calling createSyncedState(...).'
		);
	}

	if (yjsDocument.share.has(yjsTopLevelIdentifier)) {
		const existingMap = yjsDocument.getMap(yjsTopLevelIdentifier);
		const proxiedDocument = createProxyFromYType<T>(existingMap);

		return proxiedDocument;
	} else {
		const initialMap = yjsDocument.getMap<SyncableType>(yjsTopLevelIdentifier);
		const synchronizer = new MapSynchronizer(initialMap, initialState);

		return synchronizer.asTrap() as unknown as T;
	}
}

interface CreateSyncedStateOptions<T extends SyncableDocument> {
	/**
	 * Fallback data if the supplied `Y.Doc` is empty during creation.
	 */
	initialState: T;

	/**
	 * An already synced `Y.Doc` instance to observe and update.
	 *
	 * Note that an error is thrown if no `"sync"` or `"load"` event has been
	 * emitted on the document yet.
	 */
	yjsDocument: Y.Doc;

	/**
	 * All data is stored nested in a map at the root level of the `Y.Doc`, as returned by
	 * calling `doc.getMap(yjsTopLevelIdentifier)`. This property controls the map's
	 * identifying name inside the document.
	 *
	 * @default ''
	 */
	yjsTopLevelIdentifier?: string;
}
