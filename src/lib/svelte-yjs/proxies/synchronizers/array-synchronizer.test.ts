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

test('Array.copyWithin behavior', () => {
	const testCaseArguments: [number, number, number?][] = [];

	for (const target of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
		for (const start of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
			for (const end of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
				testCaseArguments.push([target, start, end]);
			}
		}
	}

	for (const args of testCaseArguments) {
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
			expect(yjsArrayModified).toHaveBeenCalledOnce();
		}

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	}
});

test('Array.fill behavior', () => {
	const testCaseArguments: [number?, number?][] = [];

	for (const start of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
		for (const end of [undefined, -4, -3, -2, -1, 0, 1, 2, 3, 4]) {
			testCaseArguments.push([start, end]);
		}
	}

	for (const args of testCaseArguments) {
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
			expect(yjsArrayModified).toHaveBeenCalledOnce();
		}

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	}
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

describe('Array.reverse behavior', () => {
	test.for<[string[], string[], number]>([
		[['first', 'second', 'third'], ['third', 'second', 'first'], 1],
		[['first', 'second'], ['second', 'first'], 1],
		[['first'], ['first'], 0],
		[[], [], 0]
	])('%o reversed is %o with %i modifications', ([source, expectedResult, calls]) => {
		const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
			createdSynchronizedDocument(source);

		expect(proxiedArray.reverse()).toBe(proxiedArray);
		expect(proxiedArray).toEqual(expectedResult);
		expect(yjsArrayModified).toHaveBeenCalledTimes(calls);

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedResult);
	});
});

test('Array.shift behavior', () => {
	const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
		createdSynchronizedDocument(['first', 'second', 'third']);

	expect(proxiedArray.shift()).toEqual('first');
	expect(proxiedArray).toEqual(['second', 'third']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(1);
	synchronize();
	expect(remoteProxiedArray).toEqual(['second', 'third']);

	expect(proxiedArray.shift()).toEqual('second');
	expect(proxiedArray).toEqual(['third']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2);
	synchronize();
	expect(remoteProxiedArray).toEqual(['third']);

	expect(proxiedArray.shift()).toEqual('third');
	expect(proxiedArray).toEqual([]);
	expect(yjsArrayModified).toHaveBeenCalledTimes(3);
	synchronize();
	expect(remoteProxiedArray).toEqual([]);

	expect(proxiedArray.shift()).toBeUndefined();
	expect(proxiedArray).toEqual([]);
	expect(yjsArrayModified).toHaveBeenCalledTimes(3); // Expect no unnecessary call
	synchronize();
	expect(remoteProxiedArray).toEqual([]);
});

describe('Array.sort behavior', () => {
	describe('Default comparison', () => {
		test.for<[string[], string[], number]>([
			[[], [], 0],
			[['a'], ['a'], 0],
			[['a', 'b'], ['a', 'b'], 0],
			[['b', 'a'], ['a', 'b'], 1],
			[['c', 'b', 'a'], ['a', 'b', 'c'], 1],
			[['a', 'd', 'b', 'a', 'c'], ['a', 'a', 'b', 'c', 'd'], 1]
		])('%o sorted is %o with %i modifications', ([source, expectedResult, calls]) => {
			const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
				createdSynchronizedDocument(source);

			// Expect the function result to be the proxied "this" object
			expect(proxiedArray.sort()).toBe(proxiedArray);
			expect(proxiedArray).toEqual(expectedResult);
			expect(yjsArrayModified).toHaveBeenCalledTimes(calls);

			synchronize();
			expect(remoteProxiedArray).toEqual(expectedResult);
		});
	});

	describe('Reverse localeCompare comparison', () => {
		test.for<[string[], string[], number]>([
			[[], [], 0],
			[['a'], ['a'], 0],
			[['b', 'a'], ['b', 'a'], 0],
			[['c', 'b', 'a'], ['c', 'b', 'a'], 0],
			[['a', 'b'], ['b', 'a'], 1],
			[['c', 'a', 'b'], ['c', 'b', 'a'], 1],
			[['a', 'd', 'b', 'a', 'c'], ['d', 'c', 'b', 'a', 'a'], 1]
		])('%o sorted is %o with %i modifications', ([source, expectedResult, calls]) => {
			const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
				createdSynchronizedDocument(source);

			// Expect the function result to be the proxied "this" object
			expect(proxiedArray.sort((a, b) => b.localeCompare(a))).toBe(proxiedArray);
			expect(proxiedArray).toEqual(expectedResult);
			expect(yjsArrayModified).toHaveBeenCalledTimes(calls);

			synchronize();
			expect(remoteProxiedArray).toEqual(expectedResult);
		});
	});
});

test('Array.splice behavior', () => {
	const insertedItemsToTest = [
		[],
		['new a'],
		['new a', 'new b'],
		['new a', 'new b', 'new c', 'new d', 'new e']
	];

	const testCaseArguments: [number, number?, ...string[]][] = [];

	for (const start of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
		testCaseArguments.push([start]);

		for (const end of [undefined, -1, 0, 1, 2, 3, 4, Infinity]) {
			for (const insertedItems of insertedItemsToTest) {
				testCaseArguments.push([start, end, ...insertedItems]);
			}
		}
	}

	for (const args of testCaseArguments) {
		const jsArray = ['first', 'second', 'third'];

		// @ts-expect-error The parameters of splice don't intersect well.
		//
		// Array.splice returns the deleted items.
		const expectedResult = jsArray.splice(...args);
		const expectedNewArray = jsArray;

		const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
			createdSynchronizedDocument(['first', 'second', 'third']);

		// @ts-expect-error The parameters of splice don't intersect well.
		expect(proxiedArray.splice(...args), JSON.stringify(args)).toEqual(expectedResult);
		expect(proxiedArray).toEqual(expectedNewArray);
		expect(yjsArrayModified.mock.calls.length).toBeLessThanOrEqual(1);

		synchronize();
		expect(remoteProxiedArray).toEqual(expectedNewArray);
	}
});

test('Array.unshift behavior', () => {
	const { proxiedArray, yjsArrayModified, synchronize, remoteProxiedArray } =
		createdSynchronizedDocument([]);

	// Array.unshift returns the new length of the array.
	expect(proxiedArray.unshift('first', 'second')).toEqual(2);
	expect(proxiedArray).toEqual(['first', 'second']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(1);
	synchronize();
	expect(remoteProxiedArray).toEqual(['first', 'second']);

	expect(proxiedArray.unshift('third')).toEqual(3);
	expect(proxiedArray).toEqual(['third', 'first', 'second']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2);
	synchronize();
	expect(remoteProxiedArray).toEqual(['third', 'first', 'second']);

	expect(proxiedArray.unshift()).toEqual(3);
	expect(proxiedArray).toEqual(['third', 'first', 'second']);
	expect(yjsArrayModified).toHaveBeenCalledTimes(2); // Expect no unnecessary call
	synchronize();
	expect(remoteProxiedArray).toEqual(['third', 'first', 'second']);
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
