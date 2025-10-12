import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { type SyncableObject, type SyncableType } from '../../syncable-document-type.js';
import {
	createProxyFromYType,
	createSynchronizedPairFromValue,
	type SynchronizedPair
} from '../generic.js';
import { Synchronizer } from './interface.js';

export type MapObjectHybrid<T extends Record<string, SyncableType>> = T &
	SvelteMap<keyof T, T[keyof T]>;

type WriteOnlyMap<K, V> = Pick<Map<K, V>, 'clear' | 'delete' | 'set'>;

const MapPropertyNames = new Set<string>(['size'] satisfies (keyof Map<never, never>)[]);
const MapAccessFunctionNames = new Set<string>([
	'entries',
	'forEach',
	'get',
	'has',
	'keys',
	'values'
] satisfies (keyof Map<never, never>)[]);
const MapMutationFunctionNames = new Set<string>(['clear', 'delete', 'set'] satisfies (keyof Map<
	never,
	never
>)[]);

export class MapSynchronizer<K extends string, V extends SyncableType>
	extends Synchronizer<SvelteMap<K, V>, Y.Map<any>>
	implements WriteOnlyMap<K, V>
{
	inSvelte = new SvelteMap<K, V>();

	constructor(inYjs: Y.Map<V>, initialValue?: SyncableMapOrObject) {
		super(inYjs);

		const yjsMapHasItems = inYjs.doc !== null && inYjs.size > 0;

		if (initialValue) {
			if (yjsMapHasItems) {
				throw new Error('Initial map items were specified for non-empty Y.Map');
			}

			this.addFromMapOrObject(initialValue);
		} else if (yjsMapHasItems) {
			const initialEntriesInSvelte = [...inYjs.entries()].map<[K, V]>(
				// Create proxied entries
				([key, value]) => [key as K, createProxyFromYType<V>(value)]
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

	delete(key: K): boolean {
		this.inYjs.delete(key);

		return this.inSvelte.delete(key);
	}

	set(key: K, value: V): SvelteMap<K, V> {
		const synchronized = createSynchronizedPairFromValue(value);

		this.inYjs.set(key, synchronized.inYjs);
		return this.inSvelte.set(key, synchronized.state);
	}

	private addFromMapOrObject(source: SyncableMapOrObject) {
		const synchronizerEntries = createSynchronizersFromMapOrObject(source);

		for (const [key, synchronized] of synchronizerEntries) {
			this.inYjs.set(key, synchronized.inYjs);
			this.inSvelte.set(key as K, synchronized.state as V);
		}
	}

	handleRemoteUpdate(event: Y.YMapEvent<V>): void {
		const changes = event.changes.keys;

		for (const [key, change] of changes) {
			switch (change.action) {
				case 'add':
				case 'update':
					const proxiedValue = createProxyFromYType<V>(this.inYjs.get(key));
					this.inSvelte.set(key as K, proxiedValue);
					break;
				case 'delete':
					this.inSvelte.delete(key as K);
					break;
			}
		}
	}

	asTrap(): MapObjectHybrid<Record<K, V>> {
		return new Proxy(this.inSvelte, {
			get: (map, property, receiver) => {
				if (typeof property === 'symbol') {
					return Reflect.get(map, property, receiver);
				}

				const isMapProperty = MapPropertyNames.has(property);
				const isMapAccessFunction = MapAccessFunctionNames.has(property);
				const isMapMutationFunction = MapMutationFunctionNames.has(property);

				// Use default map implementation for map.size property
				if (isMapProperty) {
					return map[property as keyof typeof map];
				}

				// Use default map implementation for functions like map.get(...), map.values(), etc.
				else if (isMapAccessFunction) {
					// @ts-expect-error
					return (...args: unknown[]) => map[property as keyof typeof map](...args);
				}

				// Use overridden, "synchronized" implementation declared in this class for functions
				// like map.set(...), map.clear(), etc.
				else if (isMapMutationFunction) {
					// @ts-expect-error
					return (...args: unknown[]) => this[property as MapMutationFunctionName](...args);
				}

				// Use map lookup for all other property access (e.g. map.myValue, map['customValue'])
				else {
					return map.get(property as K);
				}
			},

			// Trap "object['property'] = newValue" calls
			set: (_, property, newValue) => {
				if (typeof property === 'symbol') {
					throw new Error(
						'Declaring symbols on synced map object hybrids is not implemented due to potential risks'
					);
				}

				this.set(property as K, newValue);
				return true;
			},

			// Trap Object.entries(...), Object.keys(...) and Object.values(...) calls
			ownKeys: (target) => {
				const result = target.keys().toArray();
				return result;
			},
			getOwnPropertyDescriptor: (map, prop) => {
				const result = Reflect.getOwnPropertyDescriptor(map, prop);

				if (result === undefined && typeof prop === 'string') {
					// Use map lookup for non-standard properties
					return {
						configurable: true,
						enumerable: true,
						value: map.get(prop as K),
						writable: true
					};
				}

				return result;
			},

			// Trap "'property' in object" operator calls
			has: (map, prop) => {
				const isMapProperty = Reflect.has(map, prop);

				if (!isMapProperty && typeof prop === 'string') {
					return map.has(prop as K);
				} else {
					return isMapProperty;
				}
			},

			// Trap "delete object['property']" operator calls
			deleteProperty: (map, prop) => {
				const isMapProperty = Reflect.has(map, prop);

				if (!isMapProperty && typeof prop === 'string') {
					return this.delete(prop as K);
				} else {
					return Reflect.deleteProperty(map, prop);
				}
			}
		}) as MapObjectHybrid<Record<K, V>>;
	}
}

type SyncableMapOrObject = Map<string, SyncableType> | SyncableObject;

function createSynchronizersFromMapOrObject(source: SyncableMapOrObject) {
	const entries = extractEntriesFromMapOrObject(source);
	return entries.map<[string, SynchronizedPair<SyncableType, any>]>(([key, value]) => [
		key,
		createSynchronizedPairFromValue(value)
	]);
}

function extractEntriesFromMapOrObject(source: SyncableMapOrObject) {
	if (source instanceof Map) {
		return source.entries().toArray();
	} else {
		return Object.entries(source);
	}
}
