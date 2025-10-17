import * as Y from 'yjs';
import { isSyncableNative, type SyncableType } from '../syncable-document-type.js';
import { ConnectedYText, SyncedText } from './synced-text.svelte.js';
import { ArraySynchronizer } from './synchronizers/array-synchronizer.svelte.js';
import { MapSynchronizer } from './synchronizers/map-synchronizer.svelte.js';

export interface SynchronizedPair<TType, YType> {
	state: TType;
	inYjs: YType;
}

export function createSynchronizedPairFromValue<T extends SyncableType>(
	value: T
): SynchronizedPair<T, any> {
	if (isSyncableNative(value)) {
		// Native value can't have a dedicated reactive wrapper.
		return {
			state: value,
			inYjs: value
		};
	}

	if (Array.isArray(value)) {
		const arraySynchronizer = new ArraySynchronizer(new Y.Array(), value);

		return {
			inYjs: arraySynchronizer.inYjs,
			state: arraySynchronizer.asTrap() as T
		};
	}

	if (value instanceof SyncedText) {
		return {
			inYjs: value[ConnectedYText],
			state: value
		};
	}

	if (value instanceof Map || typeof value === 'object') {
		const mapSynchronizer = new MapSynchronizer(new Y.Map<SyncableType>(), value);

		return {
			inYjs: mapSynchronizer.inYjs,
			state: mapSynchronizer.asTrap() as unknown as T
		};
	}

	throw new Error(`createSynchronizedPairFromValue received invalid value ${value}`);
}

export function createProxyFromYType<T>(yType: unknown): T {
	if (isSyncableNative(yType)) {
		return yType as T;
	}

	if (yType instanceof Y.Array) {
		const synchronizer = new ArraySynchronizer(yType);
		return synchronizer.asTrap() as T;
	}

	if (yType instanceof Y.Map) {
		const synchronizer = new MapSynchronizer(yType);
		return synchronizer.asTrap() as T;
	}

	if (yType instanceof Y.Text) {
		return new SyncedText(yType) as T;
	}

	throw new Error(`Unable to map Yjs type ${yType} back to Svelte proxy`);
}
