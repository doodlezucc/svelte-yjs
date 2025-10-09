import { SvelteMap } from 'svelte/reactivity';
import type { ElementOf } from 'ts-essentials';
import * as Y from 'yjs';
import { type SyncableObject, type SyncableType } from '../syncable-document-type.js';
import {
	createProxyFromYType,
	createSynchronizerFromValue,
	type ResolvedSyncableType
} from './generic.js';
import { Synchronizer } from './interface.svelte.js';

export type MapObjectHybrid<V extends SyncableType> = SvelteMap<string, V> & Record<string, V>;

const MapMutationFunctionNames = ['clear', 'delete', 'set'] satisfies (keyof Map<never, never>)[];

const MapMutationFunctionNameSet = new Set<string>(MapMutationFunctionNames);

type MapMutationFunctionName = ElementOf<typeof MapMutationFunctionNames>;
type WriteOnlyMap<K, V> = Pick<Map<K, V>, MapMutationFunctionName>;

export class MapSynchronizer<V extends SyncableType>
	extends Synchronizer<SvelteMap<string, V>, Y.Map<any>>
	implements WriteOnlyMap<string, V>
{
	inSvelte = new SvelteMap<string, V>();

	constructor(inYjs: Y.Map<V>, initialValue?: SyncableMapOrObject) {
		super(inYjs);

		const yjsMapHasItems = inYjs.doc !== null && inYjs.size > 0;

		if (initialValue) {
			if (yjsMapHasItems) {
				throw new Error('Initial map items were specified for non-empty Y.Map');
			}

			this.addFromMapOrObject(initialValue);
		} else if (yjsMapHasItems) {
			const initialEntriesInSvelte = [...inYjs.entries()].map<[string, V]>(
				// Create proxied entries
				([key, value]) => [key, createProxyFromYType<V>(value)]
			);

			for (const [key, value] of initialEntriesInSvelte) {
				this.inSvelte.set(key, value);
			}
		}
	}

	clear(): void {
		this.inYjs.clear();

		return this.inSvelte.clear();
	}

	delete(key: string): boolean {
		this.inYjs.delete(key);

		return this.inSvelte.delete(key);
	}

	set(key: string, value: V): Map<string, V> {
		const synchronized = createSynchronizerFromValue(value);

		this.inYjs.set(key, synchronized.inYjs);
		return this.inSvelte.set(key, synchronized.state);
	}

	private addFromMapOrObject(source: SyncableMapOrObject) {
		const synchronizerEntries = createSynchronizersFromMapOrObject(source);

		for (const [key, synchronized] of synchronizerEntries) {
			this.inYjs.set(key, synchronized.inYjs);
			this.inSvelte.set(key, synchronized.state as V);
		}
	}

	handleRemoteUpdate(event: Y.YMapEvent<V>): void {
		const delta = event.delta;

		let index = 0;
		for (const operation of delta) {
			// Skip unchanged indices
			if (operation.retain !== undefined) {
				index += operation.retain;
			}
			// Insert items at this point
			else if (operation.insert) {
				const newItems = operation.insert as V[];

				// TODO: no idea what the format is for these events

				const newItemsInSvelte = newItems.map((item) => createProxyFromYType<V>(item));

				// this.inSvelte.splice(index, 0, ...newItemsInSvelte);
				index += newItems.length;
			}
			// Delete items at this point
			else if (operation.delete !== undefined) {
				// this.inSvelte.splice(index, operation.delete);
			}
		}
	}

	asTrap(): MapObjectHybrid<V> {
		return new Proxy(this.inSvelte, {
			get: (state, property, receiver) => {
				if (typeof property === 'string') {
					const isMutationFunction = MapMutationFunctionNameSet.has(property);

					if (isMutationFunction) {
						// @ts-expect-error
						return (...args: unknown[]) => this[property as MapMutationFunctionName](...args);
					} else if (!(property in this.inSvelte)) {
						// Trap object property access
						return this.inSvelte.get(property);
					}
				}

				// @ts-expect-error
				return (...args: unknown[]) => state[property as MapMutationFunctionName](...args);
			},

			// Trap "object[property] = newValue" calls
			set: (_, property, newValue) => {
				if (typeof property === 'symbol') {
					throw new Error(
						'Declaring symbols on synced map object hybrids is not implemented due to potential risks'
					);
				}

				this.set(property, newValue);
				return true;
			}
		}) as MapObjectHybrid<V>;
	}
}

type SyncableMapOrObject = Map<string, SyncableType> | SyncableObject;

function createSynchronizersFromMapOrObject(source: SyncableMapOrObject) {
	const entries = extractEntriesFromMapOrObject(source);
	return entries.map<[string, ResolvedSyncableType<SyncableType, any>]>(([key, value]) => [
		key,
		createSynchronizerFromValue(value)
	]);
}

function extractEntriesFromMapOrObject(source: SyncableMapOrObject) {
	if (source instanceof Map) {
		return source.entries().toArray();
	} else {
		return Object.entries(source);
	}
}
