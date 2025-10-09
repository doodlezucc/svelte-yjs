import { expect, test } from 'vitest';
import type { SyncableType } from '../syncable-document-type.js';
import { createSynchronizerFromValue } from './generic.js';
import type { MapObjectHybrid } from './synced-map-object.svelte.js';

test('Map proxy :)', () => {
	const map = createSynchronizerFromValue({
		isCool: true
	});

	const myHybrid = map.state as unknown as MapObjectHybrid<SyncableType>;

	expect(myHybrid.isCool).toEqual(true);

	expect(myHybrid.get('hellish')).toEqual(undefined);
	expect(myHybrid.get('isCool')).toEqual(true);
});
