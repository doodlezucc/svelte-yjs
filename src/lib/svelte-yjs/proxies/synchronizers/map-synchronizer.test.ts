import { expect, test } from 'vitest';
import * as Y from 'yjs';
import type { DeclareDocument } from '../../syncable-document-type.js';
import { createSynchronizedPairFromValue } from '../generic.js';
import type { MapObjectHybrid } from './map-synchronizer.svelte.js';

type MyDocument = DeclareDocument<{
	isCool: boolean;
	name?: string;
}>;

test('Map proxy :)', () => {
	const map = createSynchronizedPairFromValue<MyDocument>({
		isCool: true
	});

	const myHybrid = map.state as MapObjectHybrid<MyDocument>;

	expect(myHybrid.isCool).toEqual(true);

	// @ts-expect-error
	expect(myHybrid.get('hellish')).toEqual(undefined);
	expect(myHybrid.get('isCool')).toEqual(true);
	expect(myHybrid.name).toEqual(undefined);

	const inYjs = map.inYjs as Y.Map<unknown>;

	const yDoc = new Y.Doc();
	yDoc.getMap('global').set('myActualMap', inYjs);

	expect(inYjs.size).toEqual(1);
	expect(inYjs.toJSON()).toEqual({ isCool: true });

	// Modification

	myHybrid.name = 'John';
	expect(inYjs.toJSON()).toEqual({ isCool: true, name: 'John' });
	expect(myHybrid.get('name')).toEqual('John');
});
