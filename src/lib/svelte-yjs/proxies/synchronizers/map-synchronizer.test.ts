import type { ValueOf } from 'ts-essentials';
import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';
import type { DeclareSyncableDocument } from '../../syncable-document-type.js';
import { MapSynchronizer } from './map-synchronizer.svelte.js';

type TestDocument = DeclareSyncableDocument<{
	isCool: boolean;
	name?: string;
}>;

describe('Usage', () => {
	test('instanceof', () => {
		const { proxiedAsMap, proxiedAsObject } = createdSynchronizedDocument();

		expect(proxiedAsObject).toBeInstanceOf(Object);
		expect(proxiedAsObject).not.toBeInstanceOf(Map);
		expect(proxiedAsMap).not.toBeInstanceOf(Map); // TODO: This behavior can't be avoided and should be pointed out in the README
	});

	test('Access property with Map.get', () => {
		const { proxiedAsMap } = createdSynchronizedDocument({
			isCool: true
		});

		expect(proxiedAsMap.get('isCool')).toEqual(true);
		expect(proxiedAsMap.get('name')).toEqual(undefined);

		// @ts-expect-error
		expect(proxiedAsMap.get('unknownProperty')).toEqual(undefined);
	});

	test('Access property with getter', () => {
		const { proxiedAsObject } = createdSynchronizedDocument({
			isCool: true
		});

		expect(proxiedAsObject.isCool).toEqual(true);
		expect(proxiedAsObject.name).toEqual(undefined);

		// @ts-expect-error
		expect(proxiedAsObject['unknownProperty']).toEqual(undefined);
		// @ts-expect-error
		expect(proxiedAsObject.unknownProperty).toEqual(undefined);
	});

	test('Access Map.size', () => {
		const { proxiedAsMap } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		expect(proxiedAsMap.size).toEqual(2);
	});

	test('Iterate object entries', () => {
		const { proxiedAsObject: emptyObject } = createdSynchronizedDocument();

		expect(Object.entries(emptyObject)).toEqual([]);
		expect(Object.keys(emptyObject)).toEqual([]);
		expect(Object.values(emptyObject)).toEqual([]);
		expect({ ...emptyObject }).toEqual({});
		expect(emptyObject).toEqual({});

		const { proxiedAsObject } = createdSynchronizedDocument({
			isCool: true
		});

		expect(Object.entries(proxiedAsObject)).toEqual([['isCool', true]]);
		expect(Object.keys(proxiedAsObject)).toEqual(['isCool']);
		expect(Object.values(proxiedAsObject)).toEqual([true]);
		expect({ ...proxiedAsObject }).toEqual({ isCool: true });
		expect(proxiedAsObject).toEqual({ isCool: true });
	});

	test('Iterate map entries', () => {
		const { proxiedAsMap: emptyMap } = createdSynchronizedDocument();

		expect(emptyMap.entries().toArray()).toEqual([]);
		expect(emptyMap.keys().toArray()).toEqual([]);
		expect(emptyMap.values().toArray()).toEqual([]);

		const { proxiedAsMap } = createdSynchronizedDocument({
			isCool: true
		});

		expect(proxiedAsMap.entries().toArray()).toEqual([['isCool', true]]);
		expect(proxiedAsMap.keys().toArray()).toEqual(['isCool']);
		expect(proxiedAsMap.values().toArray()).toEqual([true]);
	});

	test('Check property existence with "in" operator', () => {
		const { proxiedAsObject } = createdSynchronizedDocument({
			isCool: true,
			name: undefined
		});

		expect('isCool' in proxiedAsObject).toEqual(true);
		expect('name' in proxiedAsObject).toEqual(true);
		expect('unknownProperty' in proxiedAsObject).toEqual(false);
	});

	test('Check property existence with Map.has', () => {
		const { proxiedAsMap } = createdSynchronizedDocument({
			isCool: true,
			name: undefined
		});

		expect(proxiedAsMap.has('isCool')).toEqual(true);
		expect(proxiedAsMap.has('name')).toEqual(true);

		// @ts-expect-error
		expect(proxiedAsMap.has('unknownProperty')).toEqual(false);
	});

	test('Map.forEach behavior', () => {
		const { proxiedAsMap } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		const expectedValues = ['Alice', true];
		const expectedKeys = ['name', 'isCool'];

		let index = 0;

		proxiedAsMap.forEach((value, key, map) => {
			expect(map).toBe(proxiedAsMap);

			expect(value).toEqual(expectedValues[index]);
			expect(key).toEqual(expectedKeys[index]);

			index++;
		});
	});

	test('Modify entry with setter', () => {
		const { proxiedAsObject, inYjs } = createdSynchronizedDocument({
			isCool: false
		});

		proxiedAsObject.isCool = true;

		expect(proxiedAsObject.isCool).toEqual(true);
		expect(proxiedAsObject).toEqual({ isCool: true });
		expect(inYjs.get('isCool')).toEqual(true);
	});

	test('Modify entry with Map.set', () => {
		const { proxiedAsMap, proxiedAsObject, inYjs } = createdSynchronizedDocument({
			isCool: false
		});

		proxiedAsMap.set('isCool', true);

		expect(proxiedAsMap.get('isCool')).toEqual(true);
		expect(proxiedAsObject).toEqual({ isCool: true });
		expect(inYjs.get('isCool')).toEqual(true);
	});

	test('Insert entry with setter', () => {
		const { proxiedAsObject, inYjs } = createdSynchronizedDocument({
			isCool: true
		});

		proxiedAsObject.name = 'Alice';

		expect(proxiedAsObject.name).toEqual('Alice');
		expect(proxiedAsObject).toEqual({ name: 'Alice', isCool: true });
		expect(inYjs.get('name')).toEqual('Alice');
	});

	test('Insert entry with Map.set', () => {
		const { proxiedAsMap, proxiedAsObject, inYjs } = createdSynchronizedDocument({
			isCool: true
		});

		proxiedAsMap.set('name', 'Alice');

		expect(proxiedAsMap.get('name')).toEqual('Alice');
		expect(proxiedAsObject).toEqual({ name: 'Alice', isCool: true });
		expect(inYjs.get('name')).toEqual('Alice');
	});

	test('Delete entry using "delete" operator', () => {
		const { proxiedAsObject, inYjs } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		expect(inYjs.has('name')).toEqual(true);

		delete proxiedAsObject.name;

		expect(proxiedAsObject.name).toBeUndefined();
		expect('name' in proxiedAsObject).toEqual(false);
		expect(proxiedAsObject).toEqual({ isCool: true });
		expect(inYjs.has('name')).toEqual(false);
	});

	test('Delete entry using Map.delete', () => {
		const { proxiedAsMap, proxiedAsObject, inYjs } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		expect(inYjs.has('name')).toEqual(true);

		proxiedAsMap.delete('name');

		expect(proxiedAsMap.get('name')).toBeUndefined();
		expect(proxiedAsMap.has('name')).toEqual(false);
		expect(proxiedAsObject).toEqual({ isCool: true });
		expect(inYjs.has('name')).toEqual(false);
	});

	test('Clear map entries', () => {
		const { proxiedAsMap, proxiedAsObject, inYjs } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		proxiedAsMap.clear();

		expect(proxiedAsMap.size).toEqual(0);
		expect(proxiedAsObject.isCool).toBeUndefined();
		expect(proxiedAsObject.name).toBeUndefined();
		expect(proxiedAsObject).toEqual({});

		expect(inYjs.size).toEqual(0);
		expect(inYjs.has('name')).toEqual(false);
		expect(inYjs.has('isCool')).toEqual(false);
	});
});

describe('Yjs synchronization', () => {
	test('Use initial value', () => {
		const { inYjs, synchronize, remoteProxiedAsObject } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		expect(inYjs.size).toEqual(2);
		expect(inYjs.get('name')).toEqual('Alice');
		expect(inYjs.get('isCool')).toEqual(true);

		synchronize();

		expect(remoteProxiedAsObject).toEqual({ name: 'Alice', isCool: true });
	});

	test('Modify entry', () => {
		const { proxiedAsObject, synchronize, remoteProxiedAsObject } = createdSynchronizedDocument({
			isCool: false
		});

		synchronize();
		expect(remoteProxiedAsObject).toEqual({ isCool: false });

		proxiedAsObject.isCool = true;

		synchronize();
		expect(remoteProxiedAsObject).toEqual({ isCool: true });
	});

	test('Insert entry', () => {
		const { proxiedAsObject, synchronize, remoteProxiedAsObject } = createdSynchronizedDocument({
			isCool: true
		});

		proxiedAsObject.name = 'Alice';

		synchronize();
		expect(remoteProxiedAsObject).toEqual({ isCool: true, name: 'Alice' });
	});

	test('Delete entry', () => {
		const { proxiedAsMap, synchronize, remoteProxiedAsObject } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		proxiedAsMap.delete('name');

		synchronize();
		expect(remoteProxiedAsObject).toEqual({ isCool: true });
	});

	test('Clear map entries', () => {
		const { proxiedAsMap, synchronize, remoteProxiedAsObject } = createdSynchronizedDocument({
			name: 'Alice',
			isCool: true
		});

		proxiedAsMap.clear();

		synchronize();
		expect(remoteProxiedAsObject).toEqual({});
	});
});

function createdSynchronizedDocument(initialValue?: TestDocument) {
	const { synchronizer, proxiedAsMap, proxiedAsObject } =
		createdSynchronizedYDocWithMap(initialValue);

	const { synchronizer: remoteSynchronizer, proxiedAsObject: remoteProxiedAsObject } =
		createdSynchronizedYDocWithMap();

	function synchronize() {
		const localUpdate = Y.encodeStateAsUpdate(synchronizer.inYjs.doc!);
		Y.applyUpdate(remoteSynchronizer.inYjs.doc!, localUpdate);
	}

	return {
		inYjs: synchronizer.inYjs,
		proxiedAsObject,
		proxiedAsMap,
		synchronize,
		remoteProxiedAsObject
	};
}

function createdSynchronizedYDocWithMap(initialValue?: TestDocument) {
	const yjsDoc = new Y.Doc();
	const inYjs = yjsDoc.getMap<ValueOf<TestDocument>>('myMap');

	const synchronizer = new MapSynchronizer<TestDocument>(inYjs, initialValue);
	const proxiedAsMap = synchronizer.asTrap();
	const proxiedAsObject = proxiedAsMap as unknown as TestDocument;

	return {
		synchronizer,
		proxiedAsObject,
		proxiedAsMap
	};
}
