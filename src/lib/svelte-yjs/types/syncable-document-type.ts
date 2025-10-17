import type { SyncedText } from '../framework/synced-text.svelte.js';
import type { PreventMapProperties } from './prevent-map-properties.js';

export type SyncableType =
	| SyncableNative
	| SyncableObject
	| SyncableType[]
	| Map<string, SyncableType>
	| SyncedText;

export type SyncableNative = boolean | string | number | null | undefined | Uint8Array;

// Translates to a Y.Map (which only supports `string` keys)
export type SyncableObject = {
	[K in string]: SyncableType;
} & PreventMapProperties;

export type SyncableDocument = SyncableObject;

export type DeclareSyncableDocument<T extends SyncableDocument> = T;

export function isSyncableNative(value: unknown): value is SyncableNative {
	const type = typeof value;

	if (type === 'boolean' || type === 'string' || type === 'number') {
		return true;
	}

	if (value === null || value === undefined) {
		return true;
	}

	if (value instanceof Uint8Array) {
		return true;
	}

	return false;
}
