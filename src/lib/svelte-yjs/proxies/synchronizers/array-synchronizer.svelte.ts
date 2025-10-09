import type { ElementOf } from 'ts-essentials';
import * as Y from 'yjs';
import { type SyncableType } from '../../syncable-document-type.js';
import { createProxyFromYType, createSynchronizedPairFromValue } from '../generic.js';
import { Synchronizer } from './interface.js';

const ArrayMutationFunctionNames = [
	'copyWithin',
	'fill',
	'pop',
	'push',
	'reverse',
	'shift',
	'sort',
	'splice',
	'unshift'
] satisfies (keyof Array<never>)[];

const ArrayMutationFunctionNameSet = new Set<string>(ArrayMutationFunctionNames);

type ArrayMutationFunctionName = ElementOf<typeof ArrayMutationFunctionNames>;
type WriteOnlyArray<E> = Pick<Array<E>, ArrayMutationFunctionName>;

export class ArraySynchronizer<E extends SyncableType>
	extends Synchronizer<E[], Y.Array<any>>
	implements WriteOnlyArray<E>
{
	inSvelte = $state([]) as E[];

	constructor(inYjs: Y.Array<E>, initialValue?: E[]) {
		super(inYjs);

		const yjsArrayHasItems = inYjs.doc !== null && inYjs.length > 0;

		if (initialValue) {
			if (yjsArrayHasItems) {
				throw new Error('Initial array items were specified for non-empty Y.Array');
			}

			this.push(...initialValue);
		} else if (yjsArrayHasItems) {
			const initialItemsInSvelte = inYjs.map((item) => createProxyFromYType<E>(item));

			this.inSvelte.push(...initialItemsInSvelte);
		}
	}

	copyWithin(target: number, start: number, end?: number): E[] {
		// TODO: Yjs update
		return this.inSvelte.copyWithin(target, start, end);
	}

	fill(value: E, start?: number, end?: number): E[] {
		// TODO: Yjs update
		return this.inSvelte.fill(value, start, end);
	}

	pop(): E | undefined {
		this.inYjs.delete(this.inSvelte.length - 1);

		return this.inSvelte.pop();
	}

	push(...items: E[]): number {
		const resolvedItems = items.map((item) => createSynchronizedPairFromValue(item));

		this.inYjs.push(resolvedItems.map((item) => item.inYjs));
		return this.inSvelte.push(...resolvedItems.map((item) => item.state));
	}

	reverse(): E[] {
		// TODO: Yjs update
		return this.inSvelte.reverse();
	}

	shift(): E | undefined {
		this.inYjs.delete(0);

		return this.inSvelte.shift();
	}

	sort(compareFn?: ((a: E, b: E) => number) | undefined): E[] {
		// TODO: Yjs update
		return this.inSvelte.sort(compareFn);
	}

	splice(start: number, deleteCount?: number, ...rest: E[]): E[] {
		// TODO: Write a proper test for this
		const itemsToInsert = rest.map((item) => createSynchronizedPairFromValue(item));

		this.inYjs.doc!.transact(() => {
			const effectiveDeleteCount = deleteCount ?? this.inYjs.length - start;

			this.inYjs.delete(start, effectiveDeleteCount);

			if (itemsToInsert.length > 0) {
				this.inYjs.insert(
					start,
					itemsToInsert.map((item) => item.inYjs)
				);
			}
		});

		if (deleteCount === undefined) {
			return this.inSvelte.splice(start);
		} else {
			return this.inSvelte.splice(start, deleteCount, ...itemsToInsert.map((item) => item.state));
		}
	}

	unshift(...items: E[]): number {
		// TODO: Write a proper test for this
		const resolvedItems = items.map((item) => createSynchronizedPairFromValue(item));
		this.inYjs.unshift(resolvedItems.map((item) => item.inYjs));

		return this.inSvelte.unshift(...resolvedItems.map((item) => item.state));
	}

	/**
	 * Handles element assignments on this array, e.g. `array[0] = "first item"`.
	 */
	assign(index: number, value: E) {
		// There's no integrated functionality in Yjs to update an element in an array,
		// because it's against the non-destructive philosophy of CRDT.
		// https://github.com/yjs/yjs/issues/16
		//
		// Only the last update to the element at this index will persist by using
		// delete & insert. For now, this is as close as it gets to an update transaction.
		this.inYjs.doc!.transact(() => {
			this.inYjs.delete(index);
			this.inYjs.insert(index, [value]);
		});

		this.inSvelte[index] = value;
	}

	handleRemoteUpdate(event: Y.YArrayEvent<E>): void {
		const delta = event.delta;

		let index = 0;
		for (const operation of delta) {
			// Skip unchanged indices
			if (operation.retain !== undefined) {
				index += operation.retain;
			}
			// Insert items at this point
			else if (operation.insert) {
				const newItems = operation.insert as E[];

				const newItemsInSvelte = newItems.map((item) => createProxyFromYType<E>(item));

				this.inSvelte.splice(index, 0, ...newItemsInSvelte);
				index += newItems.length;
			}
			// Delete items at this point
			else if (operation.delete !== undefined) {
				this.inSvelte.splice(index, operation.delete);
			}
		}
	}

	asTrap(): E[] {
		return new Proxy(this.inSvelte, {
			get: (state, property, receiver) => {
				if (typeof property === 'string') {
					const isMutationFunction = ArrayMutationFunctionNameSet.has(property);

					if (isMutationFunction) {
						// @ts-expect-error
						return (...args: unknown[]) => this[property as ArrayMutationFunctionName](...args);
					}
				}

				return Reflect.get(state, property, receiver);
			},

			// Trap "array[index] = newValue" calls
			set: (_, property, newValue) => {
				const index = Number(property);

				this.assign(index, newValue);

				return true;
			}
		});
	}
}
