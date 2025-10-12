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

		const [a, b, c] = expectedResult;

		if (a === 'first' && b === 'second' && c === 'third') {
			expect(yjsArrayModified).not.toHaveBeenCalled();
		} else {
			expect(yjsArrayModified).toHaveBeenCalled();
			expect(yjsArrayModified.mock.calls.length).toBeLessThanOrEqual(2);
		}

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	});
});

describe('Array.fill behavior', () => {
	const testCaseArguments: [number?, number?][] = [];

	for (const start of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
		for (const end of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
			testCaseArguments.push([start, end]);
		}
	}

	test.for(testCaseArguments)('fill(..., %i, %i)', (args) => {
		const expectedResult = ['first', 'second', 'third'].fill('FILL', ...args);

		const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
			createdSynchronizedDocument(['first', 'second', 'third']);

		// Expect the function result to be the proxied "this" object
		expect(proxiedArray.fill('FILL', ...args)).toBe(proxiedArray);
		expect(proxiedArray).toEqual(expectedResult);

		const [a, b, c] = expectedResult;

		if (a === 'first' && b === 'second' && c === 'third') {
			expect(yjsArrayModified).not.toHaveBeenCalled();
		} else {
			expect(yjsArrayModified).toHaveBeenCalled();
			expect(yjsArrayModified.mock.calls.length).toBeLessThanOrEqual(1);
		}

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	});
});

test('Array.pop behavior', () => {
	const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
		createdSynchronizedDocument(['first', 'second', 'third']);

	expect(proxiedArray.pop()).toEqual('third');
	expect(proxiedArray).toEqual(['first', 'second']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(1);
	synchronize();
	expect(remoteProxiedArray).toEqual(['first', 'second']);

	expect(proxiedArray.pop()).toEqual('second');
	expect(proxiedArray).toEqual(['first']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2);
	synchronize();
	expect(remoteProxiedArray).toEqual(['first']);

	expect(proxiedArray.pop()).toEqual('first');
	expect(proxiedArray).toEqual([]);
	expect(yjsArrayModified).toHaveBeenCalledTimes(3);
	synchronize();
	expect(remoteProxiedArray).toEqual([]);

	expect(proxiedArray.pop()).toBeUndefined();
	expect(proxiedArray).toEqual([]);
	expect(yjsArrayModified).toHaveBeenCalledTimes(3); // Expect no unnecessary call
	synchronize();
	expect(remoteProxiedArray).toEqual([]);
});

test('Array.push behavior', () => {
	const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
		createdSynchronizedDocument([]);

	// Array.push returns the new length of the array.
	expect(proxiedArray.push('first', 'second')).toEqual(2);
	expect(proxiedArray).toEqual(['first', 'second']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(1);
	synchronize();
	expect(remoteProxiedArray).toEqual(['first', 'second']);

	expect(proxiedArray.push('third')).toEqual(3);
	expect(proxiedArray).toEqual(['first', 'second', 'third']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2);
	synchronize();
	expect(remoteProxiedArray).toEqual(['first', 'second', 'third']);

	expect(proxiedArray.push()).toEqual(3);
	expect(proxiedArray).toEqual(['first', 'second', 'third']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2); // Expect no unnecessary call
	synchronize();
	expect(remoteProxiedArray).toEqual(['first', 'second', 'third']);
});

function createdSynchronizedDocument(initialValue?: string[]) {
	const { yjsDoc, synchronizer, proxiedArray } = createdSynchronizedYDocWithArray(initialValue);

	const { yjsDoc: remoteYjsDoc, proxiedArray: remoteProxiedArray } =
		createdSynchronizedYDocWithArray();

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
