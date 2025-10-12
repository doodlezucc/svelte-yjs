import { describe, expect, test, vi } from 'vitest';
import * as Y from 'yjs';
import { ArraySynchronizer } from './array-synchronizer.svelte.js';

test('Check Array.isArray passing', () => {
	const { proxiedArray } = createdSynchronizedDocument();

	expect(Array.isArray(proxiedArray)).toBeTruthy();
});

test('Access initial items', () => {
	const { proxiedArray, yjsArrayModified } = createdSynchronizedDocument(['first', 'second']);

	expect(proxiedArray).toEqual(['first', 'second']);
	expect(proxiedArray[0]).toEqual('first');
	expect(proxiedArray[1]).toEqual('second');

	expect(yjsArrayModified).not.toHaveBeenCalled();
});

test('Access array length', () => {
	const { proxiedArray, yjsArrayModified } = createdSynchronizedDocument(['first', 'second']);

	expect(proxiedArray).toHaveLength(2);
	expect(proxiedArray.length).toEqual(2);

	expect(yjsArrayModified).not.toHaveBeenCalled();
});

test('Iterate items', () => {
	const { proxiedArray, yjsArrayModified } = createdSynchronizedDocument(['first', 'second']);

	expect(proxiedArray.values().toArray()).toEqual(['first', 'second']);

	expect(proxiedArray.keys().toArray()).toEqual([0, 1]);
	expect(proxiedArray.entries().toArray()).toEqual([
		[0, 'first'],
		[1, 'second']
	]);

	let index = 0;
	for (const item of proxiedArray) {
		expect(item).toEqual(['first', 'second'][index]);
		index++;
	}

	expect(yjsArrayModified).not.toHaveBeenCalled();
});

test('Array.at behavior', () => {
	const { proxiedArray, yjsArrayModified } = createdSynchronizedDocument(['first', 'second']);

	expect(proxiedArray.at(0)).toEqual('first');
	expect(proxiedArray.at(1)).toEqual('second');
	expect(proxiedArray.at(2)).toBeUndefined();

	// A negative index counts back from the last.
	expect(proxiedArray.at(-1)).toEqual('second');

	expect(yjsArrayModified).not.toHaveBeenCalled();
});

test('Array.concat behavior', () => {
	const { proxiedArray, yjsArrayModified } = createdSynchronizedDocument(['first', 'second']);

	expect(proxiedArray.concat(['third'])).toEqual(['first', 'second', 'third']);

	// Array.concat doesn't modify the original array.
	expect(proxiedArray).toEqual(['first', 'second']);

	expect(yjsArrayModified).not.toHaveBeenCalled();
});

describe('Array.copyWithin behavior', () => {
	const testCaseArguments: [number, number, number?][] = [];

	for (const target of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
		for (const start of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
			for (const end of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
				testCaseArguments.push([target, start, end]);
			}
		}
	}

	test.for(testCaseArguments)('copyWithin(%i, %i, %i)', (args) => {
		const expectedResult = ['first', 'second', 'third'].copyWithin(...args);

		const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
			createdSynchronizedDocument(['first', 'second', 'third']);

		// Expect the function result to be the proxied "this" object
		expect(proxiedArray.copyWithin(...args)).toBe(proxiedArray);
		expect(proxiedArray).toEqual(expectedResult);

		if (
			expectedResult[0] === 'first' &&
			expectedResult[1] === 'second' &&
			expectedResult[2] === 'third'
		) {
			expect(yjsArrayModified).not.toHaveBeenCalled();
		} else {
			expect(yjsArrayModified).toHaveBeenCalled();
			expect(yjsArrayModified.mock.calls.length).toBeLessThanOrEqual(5);
		}

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	});
});

function createdSynchronizedDocument(initialValue?: string[]) {
	const { yjsDoc, synchronizer, proxiedArray } = createdSynchronizedYDocWithArray(initialValue);

	const {
		yjsDoc: remoteYjsDoc,
		synchronizer: remoteSynchronizer,
		proxiedArray: remoteProxiedArray
	} = createdSynchronizedYDocWithArray();

	function synchronize() {
		const localUpdate = Y.encodeStateAsUpdate(yjsDoc);
		Y.applyUpdate(remoteYjsDoc, localUpdate);
	}

	const yjsArrayModified = vi.fn();
	synchronizer.inYjs.observe(yjsArrayModified);

	return {
		inYjs: synchronizer.inYjs,
		proxiedArray,
		yjsArrayModified,
		synchronize,
		remoteProxiedArray
	};
}

function createdSynchronizedYDocWithArray(initialValue?: string[]) {
	const yjsDoc = new Y.Doc();
	const inYjs = yjsDoc.getArray<string>('myArray');

	const synchronizer = new ArraySynchronizer(inYjs, initialValue);
	const proxiedArray = synchronizer.asTrap();

	return {
		yjsDoc,
		synchronizer,
		proxiedArray
	};
}
