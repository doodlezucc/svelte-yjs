export { createReactiveAwareness } from './awareness/awareness.svelte.js';
export type { ReactiveAwareness } from './awareness/awareness.svelte.js';
export { createSyncedState } from './create-synced-state.js';
export { SyncedText } from './framework/synced-text.svelte.js';
export type {
	DeleteOperation,
	DeltaOperation,
	InsertOperation,
	RetainOperation
} from './framework/synced-text.svelte.js';
export type { PreventMapProperties } from './types/prevent-map-properties.js';
export type {
	DeclareSyncableDocument,
	SyncableDocument,
	SyncableNative,
	SyncableObject,
	SyncableType
} from './types/syncable-document-type.js';
