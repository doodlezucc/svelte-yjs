import type * as Y from 'yjs';
import type { SyncableObject } from '../syncable-document-type.js';

export function createSyncedObjectProxy<T extends SyncableObject>(
	initialState: T,
	yMap: Y.Map<unknown>
) {
	const customState = $state(initialState);

	function setProperty<K extends keyof T>(property: K, value: T[K]) {
		console.log('SET', property, value);

		if (!(property in customState)) {
			console.log('HUGE!');
		} else {
			// The property already exists and should be updated.
			// If it's a primitive, simply assign it on the state.
			// If it's something like an array or an object, proxify it first.
		}

		customState[property] = value;
	}

	yMap.observe((event, transaction) => {
		if (!transaction.local) {
			console.log(event);
			const changes = event.changes.keys;

			for (const [key, change] of changes) {
				const property = key as keyof T & string;

				switch (change.action) {
					case 'add':
					case 'update':
						const valueInMap = yMap.get(property) as T[typeof property];

						setProperty(property, valueInMap);
						break;

					case 'delete':
						delete customState[property];
						break;
				}
			}
		}
	});

	return new Proxy<T>(customState, {
		set(state, p, newValue) {
			const property = p as keyof T & string;

			setProperty(property, newValue);

			yMap.set(property, newValue);

			return true;
		}
	});
}
