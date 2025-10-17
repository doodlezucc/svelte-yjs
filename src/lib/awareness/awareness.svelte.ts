import { SvelteMap } from 'svelte/reactivity';
import type { Awareness } from 'y-protocols/awareness.js';

export function createReactiveAwareness<T extends Record<string, any> | null>(
	options: Options<T>
): ReactiveAwareness<T> {
	const { yjsAwareness, initialState } = options;

	return new ReactiveAwarenessImplementation(yjsAwareness, (initialState ?? null) as T);
}

type Options<T> = T extends null ? OptionsWithNullableState<T> : OptionsWithState<T>;

interface OptionsWithState<T> {
	initialState: T;
	yjsAwareness: Awareness;
}

interface OptionsWithNullableState<T> {
	initialState?: T;
	yjsAwareness: Awareness;
}

export interface ReactiveAwareness<T extends Record<string, any> | null> {
	/**
	 * A deeply reactive `$state` used to access and modify the awareness data of
	 * the local client. When modifying this object, the peers are automatically
	 * notified with the updated state.
	 */
	local: T;

	/** A numeric ID used to identify the local client in the `states` map. */
	readonly localId: number;

	/** A reactive map of all remote clients' awareness states. */
	readonly peers: SvelteMap<number, T>;

	/**
	 * A `$derived` map of all current awareness states including the local client's state.
	 */
	readonly states: Map<number, T>;
}

class ReactiveAwarenessImplementation<T extends Record<string, any> | null>
	implements ReactiveAwareness<T>
{
	private readonly yjsAwareness: Awareness;

	constructor(yjsAwareness: Awareness, initialState: T) {
		this.yjsAwareness = yjsAwareness;

		this.local = initialState;

		for (const [id, state] of this.yjsAwareness.states) {
			if (id === this.localId) continue;

			this.peers.set(id, state as T);
		}

		this.yjsAwareness.on('change', (event: YjsAwarenessChangeEvent) => {
			this.handleAwarenessChangeEvent(event);
		});

		$effect(() => {
			this.yjsAwareness.setLocalState(this.#local);
		});
	}

	#local = $state() as T;
	readonly peers = new SvelteMap<number, T>();

	readonly states = $derived(new Map([[this.localId, this.#local], ...this.peers.entries()]));

	get localId() {
		return this.yjsAwareness.clientID;
	}

	get local() {
		return this.#local;
	}

	set local(newState: T) {
		this.#local = newState;
	}

	private handleAwarenessChangeEvent(event: YjsAwarenessChangeEvent) {
		const { added, updated, removed } = event;

		const latestStates = this.yjsAwareness.states;

		for (const removedClientId of removed) {
			if (removedClientId === this.localId) continue;

			this.peers.delete(removedClientId);
		}

		for (const addedClientId of added) {
			if (addedClientId === this.localId) continue;

			this.peers.set(addedClientId, latestStates.get(addedClientId)! as T);
		}

		for (const updatedClientId of updated) {
			if (updatedClientId === this.localId) continue;

			this.peers.set(updatedClientId, latestStates.get(updatedClientId)! as T);
		}
	}
}

interface YjsAwarenessChangeEvent {
	added: number[];
	updated: number[];
	removed: number[];
}
