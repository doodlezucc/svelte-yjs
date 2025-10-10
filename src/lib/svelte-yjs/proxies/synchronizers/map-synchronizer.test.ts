import { expect, test } from 'vitest';
import * as Y from 'yjs';
import type { DeclareDocument } from '../../syncable-document-type.js';
import { MapSynchronizer } from './map-synchronizer.svelte.js';

type MyDocument = DeclareDocument<{
	isCool: boolean;
	name?: string;
}>;

type MyDocumentMapEntry<K extends keyof MyDocument = keyof MyDocument> = [K, MyDocument[K]];

test('Map proxy :)', () => {
	const yjsDoc = new Y.Doc();
	const inYjs = yjsDoc.getMap<MyDocument[keyof MyDocument]>('myMap');

	const synchronizer = new MapSynchronizer(inYjs, {
		isCool: true
	});

	const proxiedAsMap = synchronizer.asTrap();
	const proxiedAsObject = proxiedAsMap as unknown as MyDocument;

	expect(proxiedAsMap).toBeInstanceOf(Map);
	expect(proxiedAsObject).toBeInstanceOf(Map); // TODO: This behavior can't be avoided and should be pointed out in the README

	expect(proxiedAsMap.get('isCool')).toEqual(true);
	expect(proxiedAsObject.isCool).toEqual(true);

	expect(proxiedAsMap.get('name')).toEqual(undefined);
	expect(proxiedAsObject.name).toEqual(undefined);

	expect(proxiedAsMap.get('unknownProperty')).toEqual(undefined);
	// @ts-expect-error
	expect(proxiedAsObject['unknownProperty']).toEqual(undefined);
	// @ts-expect-error
	expect(proxiedAsObject.unknownProperty).toEqual(undefined);

	expect(proxiedAsMap.size).toEqual(1);

	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry
		['isCool', true]
	]);

	expect(Object.entries(proxiedAsObject)).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry
		['isCool', true]
	]);

	expect(proxiedAsMap.keys().toArray()).toEqual(['isCool']);
	expect(Object.keys(proxiedAsObject)).toEqual(['isCool']);

	expect(proxiedAsMap.values().toArray()).toEqual([true]);
	expect(Object.values(proxiedAsObject)).toEqual([true]);

	expect(proxiedAsMap.has('isCool')).toEqual(true);
	expect('isCool' in proxiedAsObject).toEqual(true);

	expect(proxiedAsMap.has('unknownProperty')).toEqual(false);
	expect('unknownProperty' in proxiedAsObject).toEqual(false);

	// Modification

	// Modify using map.set(...)
	proxiedAsMap.set('isCool', false);
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry with modified value
		['isCool', false]
	]);

	expect(proxiedAsObject.isCool).toEqual(false);

	// Modify using setter
	proxiedAsObject.isCool = true;
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry with modified value
		['isCool', true]
	]);

	// Insert entry using map.set(...)
	proxiedAsMap.set('name', 'Alice');
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect two (insertion ordered) entries
		['isCool', true],
		['name', 'Alice']
	]);

	expect(proxiedAsObject.name).toEqual('Alice');

	// Delete entry using map.delete(...)
	proxiedAsMap.delete('isCool');
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry
		['name', 'Alice']
	]);

	// Insert entry using setter
	proxiedAsObject.isCool = true;
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect two (insertion ordered) entries
		['name', 'Alice'],
		['isCool', true]
	]);

	// Delete using "delete" operator
	delete proxiedAsObject.name;
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([
		// Expect single entry
		['isCool', true]
	]);

	Object.assign(proxiedAsObject, {
		name: 'Bob'
	});
	expect({ ...proxiedAsObject }).toEqual<MyDocument>({
		name: 'Bob',
		isCool: true
	});

	// TODO: Investigate using the OBJECT REPRESENTATION as the proxy source, so that you can do the following.
	//
	// expect(proxiedAsObject).toEqual<MyDocument>({
	// 	isCool: true,
	// 	name: 'Alice'
	// });

	proxiedAsMap.clear();
	expect(proxiedAsMap.entries().toArray()).toEqual<MyDocumentMapEntry[]>([]);

	expect(proxiedAsObject.name).toBeUndefined();
	expect(proxiedAsObject.isCool).toBeUndefined();
});
