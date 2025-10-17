<script lang="ts">
	import { createSyncedState } from '$lib/svelte-yjs/create-synced-state.js';
	import type { DeclareSyncableDocument } from '$lib/svelte-yjs/syncable-document-type.js';
	import { onMount } from 'svelte';
	import { createSyncedDocument } from './synced-document.js';

	type ExampleDocument = DeclareSyncableDocument<{
		stringItems: string[];
		nestedItems: {
			name?: string;
			isCool: boolean;
		}[];
	}>;

	let syncedState = $state<ExampleDocument>();

	onMount(async () => {
		const yjsDocument = await createSyncedDocument();

		syncedState = createSyncedState<ExampleDocument>({
			yjsDocument: yjsDocument,
			initialState: {
				stringItems: [],
				nestedItems: []
			}
		});
	});

	let array = $derived(syncedState?.nestedItems ?? []);

	$inspect(array);
</script>

<button onclick={() => array.push({ name: 'new item', isCool: false })}>Push</button>

{#each array as item, i (i)}
	<input type="text" name="test" bind:value={item.name} />

	<button onclick={() => array.splice(i, 1)}>Remove</button>
{/each}

<h1>Welcome to your library project {array.at(0)?.name?.length}</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
