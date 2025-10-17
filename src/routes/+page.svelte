<script lang="ts">
	import { createSyncedState } from '$lib/svelte-yjs/create-synced-state.js';
	import { SyncedText } from '$lib/svelte-yjs/framework/synced-text.svelte.js';
	import type { DeclareSyncableDocument } from '$lib/svelte-yjs/types/syncable-document-type.js';
	import { onMount } from 'svelte';
	import * as Y from 'yjs';
	import { createSyncedDocument } from './synced-document.js';

	type ExampleDocument = DeclareSyncableDocument<{
		description: SyncedText;
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
				description: new SyncedText(),
				stringItems: [],
				nestedItems: []
			}
		});
	});

	let array = $derived(syncedState?.nestedItems ?? []);

	$inspect(array);
	$inspect(syncedState?.description.delta);
</script>

<textarea>{syncedState?.description.string}</textarea>

<button onclick={() => syncedState!.description.insert(0, 'new text')}>Insert</button>
<button
	onclick={() =>
		syncedState!.description.insertEmbed(5, {
			embeddedInfo: {
				isCool: true
			}
		})}
>
	Insert Embed
</button>
<button onclick={() => syncedState!.description.insertEmbed(5, new Y.Array())}>
	Insert Embed YType
</button>

<br />

<button onclick={() => array.push({ name: 'new item', isCool: false })}>Push</button>

{#each array as item, i (i)}
	<input type="text" name="test" bind:value={item.name} />

	<button onclick={() => array.splice(i, 1)}>Remove</button>
{/each}

<h1>Welcome to your library project {array.at(0)?.name?.length}</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
