import { expect, test } from 'vitest';
import * as Y from 'yjs';
import type { DeclareDocument } from '../syncable-document-type.js';
import { createSynchronizerFromValue } from './generic.js';
import type { MapObjectHybrid } from './synced-map-object.svelte.js';

type MyDocument = DeclareDocument<{
	isCool: boolean;
	name?: string;
}>;

test('Map proxy :)', () => {
	const map = createSynchronizerFromValue<MyDocument>({
		isCool: true
	});

	const myHybrid = map.state as MapObjectHybrid<MyDocument>;

	expect(myHybrid.isCool).toEqual(true);

	expect(myHybrid.get('hellish')).toEqual(undefined);
	expect(myHybrid.get('isCool')).toEqual(true);
	expect(myHybrid.name).toEqual(undefined);

	const inYjs = map.inYjs as Y.Map<unknown>;

	const yDoc = new Y.Doc();
	yDoc.getMap('global').set('myActualMap', inYjs);

	expect(inYjs.size).toEqual(1);
	expect(inYjs.toJSON()).toEqual({ isCool: true });
});
