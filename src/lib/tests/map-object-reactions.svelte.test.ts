import {
	type MapObjectHybrid,
	MapSynchronizer
} from '$lib/framework/synchronizers/map-synchronizer.svelte.js';
import { flushSync } from 'svelte';
import { expect, test, vi } from 'vitest';
import * as Y from 'yjs';

type Callback = (map: MapObjectHybrid<Record<string, string>>) => void;

test.for<[string, Callback]>([
	['get(...)', (map) => map.get('name')],
	['has(...)', (map) => map.has('name')],
	['size', (map) => map.size],
	['entries()', (map) => [...map.entries()]],
	['keys()', (map) => [...map.keys()]],
	['values()', (map) => [...map.values()]]
])('Reacts on Map.%s', ([, accessMap]) => {
	$effect.root(() => {
		const yjsDocument = new Y.Doc();
		const yjsMap = yjsDocument.getMap<string>();
		const mapSynchronizer = new MapSynchronizer<Record<string, string>>(yjsMap);
		const proxiedMap = mapSynchronizer.asTrap();

		const didTriggerEffect = vi.fn();

		$effect(() => {
			accessMap(proxiedMap);
			didTriggerEffect();
		});

		flushSync();
		expect(didTriggerEffect).toHaveBeenCalledOnce();

		proxiedMap.set('name', 'Alice');
		flushSync();
		expect(didTriggerEffect).toHaveBeenCalledTimes(2);
	});
});
