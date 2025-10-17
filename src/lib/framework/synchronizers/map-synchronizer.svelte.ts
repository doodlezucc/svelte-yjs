import { SvelteMap } from 'svelte/reactivity';
import type { ValueOf } from 'ts-essentials';
import * as Y from 'yjs';
import { type SyncableObject, type SyncableType } from '../../types/syncable-document-type.js';
import {
	createProxyFromYType,
	createSynchronizedPairFromValue,
	type SynchronizedPair
} from '../generic.js';
import { Synchronizer } from './interface.js';

export type MapObjectHybrid<T extends Record<string, SyncableType>> = T &
	SvelteMap<keyof T, ValueOf<T>>;

export class MapSynchronizer<T extends SyncableObject>
	extends Synchronizer<T, Y.Map<ValueOf<T>>>
	implements Map<keyof T, ValueOf<T>>
{
	inSvelte = $state({}) as T;

	constructor(inYjs: Y.Map<ValueOf<T>>, initialValue?: SyncableMapOrObject) {
		super(inYjs);

		const yjsMapHasItems = inYjs.doc !== null && inYjs.size > 0;

		if (initialValue) {
			if (yjsMapHasItems) {
				throw new Error('Initial map items were specified for non-empty Y.Map');
			}

			this.addFromMapOrObject(initialValue);
		} else if (yjsMapHasItems) {
			for (const [key, value] of inYjs.entries()) {
				const proxiedValue = createProxyFromYType<ValueOf<T>>(value);

				this.setPropertyInSvelteState(key, proxiedValue);
			}
		}
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	// In a usual map, this is 'Map'. By using 'Object' instead, vitest can
	// validate the equality of this map object hybrid to an actual object.
	[Symbol.toStringTag] = 'Object';

	readonly size = $derived.by(() => Object.keys(this.inSvelte).length);

	get(key: keyof T): ValueOf<T> | undefined {
		return this.inSvelte[key] as ValueOf<T> | undefined;
	}

	has(key: keyof T): boolean {
		return key in this.inSvelte;
	}

	forEach(): void {
		throw new Error('This function must be called on the proxied map object hybrid to work');
	}

	*entries(): MapIterator<[keyof T, ValueOf<T>]> {
		// The Yjs map keys are iterated here instead of the object keys
		// because object keys don't follow insertion order in all cases.
		for (const key of this.inYjs.keys()) {
			yield [key, this.inSvelte[key] as ValueOf<T>];
		}
	}

	*keys(): MapIterator<keyof T> {
		for (const key of this.inYjs.keys()) {
			yield key;
		}
	}

	*values(): MapIterator<ValueOf<T>> {
		for (const key of this.inYjs.keys()) {
			yield this.inSvelte[key] as ValueOf<T>;
		}
	}

	clear(): void {
		this.inYjs.clear();

		for (const key of Object.keys(this.inSvelte)) {
			delete this.inSvelte[key];
		}
	}

	delete(key: keyof T & string): boolean {
		if (key in this.inSvelte) {
			this.inYjs.delete(key);
			delete this.inSvelte[key];
			return true;
		} else {
			return false;
		}
	}

	set(key: keyof T & string, value: ValueOf<T>): this {
		const synchronized = createSynchronizedPairFromValue(value);

		this.inYjs.set(key, synchronized.inYjs);
		this.setPropertyInSvelteState(key, synchronized.state);
		return this;
	}

	private addFromMapOrObject(source: SyncableMapOrObject) {
		const synchronizerEntries = createSynchronizersFromMapOrObject(source);

		for (const [key, synchronized] of synchronizerEntries) {
			this.inYjs.set(key, synchronized.inYjs as ValueOf<T>);
			this.setPropertyInSvelteState(key, synchronized.state as ValueOf<T>);
		}
	}

	private setPropertyInSvelteState(key: keyof T, value: ValueOf<T>) {
		// @ts-expect-error T might not be writable, but let's pretend it is.
		this.inSvelte[key] = value;
	}

	handleRemoteUpdate(event: Y.YMapEvent<ValueOf<T>>): void {
		const changes = event.changes.keys;

		for (const [key, change] of changes) {
			if (change.action === 'add' || change.action === 'update') {
				const proxiedValue = createProxyFromYType<ValueOf<T>>(this.inYjs.get(key));
				this.setPropertyInSvelteState(key, proxiedValue);
			} else if (change.action === 'delete') {
				delete this.inSvelte[key];
			}
		}
	}

	asTrap(): MapObjectHybrid<T> {
		return new Proxy(this.inSvelte, {
			get: (state, property, receiver) => {
				const isMapProperty = isMapInstanceProperty(property);
				const isMapFunction = isMapInstanceFunction(property);

				// Use default map implementation for map.size property
				if (isMapProperty) {
					return this[property];
				}

				// Use overridden, "synchronized" implementation declared in this class for functions
				// like map.set(...), map.clear(), etc.
				else if (isMapFunction) {
					if (property === 'forEach') {
						// Because the callback must be provided with the "this" object,
						// it has to be replaced with the proxied map object hybrid.

						const forEach: Map<keyof T, ValueOf<T>>['forEach'] = (callback) => {
							[...this.entries()].forEach(([key, value]) => {
								callback(value, key, receiver);
							});
						};

						return forEach;
					}

					return (...args: unknown[]) => {
						// @ts-expect-error Dynamic function calls require spreaded arguments.
						const functionResult = this[property](...args);

						if (functionResult === this.inSvelte) {
							// Any functions which return the "this" object have to return the proxied version instead.
							return receiver;
						} else {
							return functionResult;
						}
					};
				}

				// Use default lookup for all other property access (e.g. map.myValue, map['customValue'])
				else {
					return Reflect.get(state, property, receiver);
				}
			},

			// Trap "object['property'] = newValue" calls
			set: (_, property, newValue) => {
				if (typeof property === 'symbol') {
					throw new Error(
						'Declaring symbols on synced map object hybrids is not implemented due to potential risks'
					);
				}

				this.set(property, newValue);
				return true;
			},

			// Trap "delete object['property']" operator calls
			deleteProperty: (state, property) => {
				const isMapProperty = isMapInstanceProperty(property) || isMapInstanceFunction(property);

				if (!isMapProperty && typeof property === 'string') {
					return this.delete(property);
				} else {
					return Reflect.deleteProperty(state, property);
				}
			}
		}) as MapObjectHybrid<T>;
	}
}

type SyncableMapOrObject = Map<string, SyncableType> | SyncableObject;

function createSynchronizersFromMapOrObject(source: SyncableMapOrObject) {
	const entries = extractEntriesFromMapOrObject(source);
	return entries.map<[string, SynchronizedPair<SyncableType, unknown>]>(([key, value]) => [
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

const MapPropertyNames = new Set([
	// Properties
	'size',
	Symbol.iterator,
	Symbol.toStringTag
] satisfies (keyof Map<never, never>)[]);
const MapFunctionNames = new Set([
	// Access functions
	'entries',
	'forEach',
	'get',
	'has',
	'keys',
	'values',

	// Mutation functions
	'clear',
	'delete',
	'set'
] satisfies (keyof Map<never, never>)[]);

type MapPropertyName = typeof MapPropertyNames extends Set<infer P> ? P : never;
type MapFunctionName = typeof MapFunctionNames extends Set<infer P> ? P : never;

function isMapInstanceProperty(property: string | symbol): property is MapPropertyName {
	return MapPropertyNames.has(property as MapPropertyName);
}

function isMapInstanceFunction(property: string | symbol): property is MapFunctionName {
	return MapFunctionNames.has(property as MapFunctionName);
}
