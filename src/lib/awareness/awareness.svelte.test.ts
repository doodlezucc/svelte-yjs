import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { applyAwarenessUpdate, Awareness, encodeAwarenessUpdate } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import { wrapYjsAwarenessInState, type ReactiveAwareness } from './awareness.svelte.js';

interface Presence {
	name: string;
}

test('Initialize local state in constructor', () => {
	const { yjsAwareness, reactiveAwareness } = createAwarenessPairWithEffectRoot({
		name: 'Alice'
	});

	flushSync();

	expect(yjsAwareness.states.entries().toArray()).toEqual(
		// Expect populated local state
		[[reactiveAwareness.localId, { name: 'Alice' }]]
	);
});

test('Initialize peer states in constructor', () => {
	const { yjsAwareness: peerYjsAwareness } = createAwarenessPairWithEffectRoot({
		name: 'Alice'
	});

	flushSync();

	// Synchronize awareness before creating ReactiveAwareness
	const localYjsAwareness = new Awareness(new Y.Doc());
	synchronizeAwarenesses(peerYjsAwareness, localYjsAwareness);

	// Create ReactiveAwareness
	const localReactiveAwareness = createReactiveAwarenessWithEffectRoot(localYjsAwareness, {
		name: 'Bob'
	});

	flushSync();

	expect(localReactiveAwareness.states.entries().toArray()).toEqual(
		expect.arrayContaining([
			[peerYjsAwareness.clientID, { name: 'Alice' }],
			[localReactiveAwareness.localId, { name: 'Bob' }]
		])
	);
});

test('Update awareness when assigning state', () => {
	const { yjsAwareness, reactiveAwareness } = createAwarenessPairWithEffectRoot({
		name: 'Alice'
	});

	reactiveAwareness.local = { name: 'New Alice' };

	flushSync();
	expect(yjsAwareness.getLocalState()).toEqual({ name: 'New Alice' });
});

test('Update awareness when assigning state properties', () => {
	const { yjsAwareness, reactiveAwareness } = createAwarenessPairWithEffectRoot({
		name: 'Alice'
	});

	reactiveAwareness.local.name = 'New Alice';

	flushSync();
	expect(yjsAwareness.getLocalState()).toEqual({ name: 'New Alice' });
});

function createAwarenessPairWithEffectRoot(initialState: Presence) {
	const yjsAwareness = new Awareness(new Y.Doc());
	const reactiveAwareness = createReactiveAwarenessWithEffectRoot(yjsAwareness, initialState);

	return {
		yjsAwareness,
		reactiveAwareness
	};
}

function createReactiveAwarenessWithEffectRoot(yjsAwareness: Awareness, initialState: Presence) {
	let reactiveAwareness!: ReactiveAwareness<Presence>;

	$effect.root(() => {
		reactiveAwareness = wrapYjsAwarenessInState<Presence>({
			yjsAwareness,
			initialState
		});
	});

	return reactiveAwareness;
}

function synchronizeAwarenesses(a: Awareness, b: Awareness) {
	const awarenessUpdate = encodeAwarenessUpdate(a, a.states.keys().toArray());
	applyAwarenessUpdate(b, awarenessUpdate, null);
}
