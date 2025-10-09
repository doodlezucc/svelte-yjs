import type { PreventMapProperties } from './map-object-hybrid.js';
import type { SyncedText } from './synced-text.svelte.js';

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

export type DeclareDocument<T extends SyncableDocument> = T;

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
