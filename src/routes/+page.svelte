<script lang="ts">
	import {
		createReactiveAwareness,
		createSyncedState,
		SyncedText,
		type DeclareSyncableDocument
	} from 'svelte-yjs';
	import * as Y from 'yjs';

	type ExampleDocument = DeclareSyncableDocument<{
		description: SyncedText;
		stringItems: string[];
		nestedItems: {
			name?: string;
			isCool: boolean;
		}[];
	}>;

	interface Presence {
		name: string;
	}

	const { data } = $props();

	const reactiveAwareness = createReactiveAwareness<Presence>({
		yjsAwareness: data.awareness,
		initialState: {
			name: 'Me :)'
		}
	});

	const syncedState = createSyncedState<ExampleDocument>({
		yjsDocument: data.doc,
		initialState: {
			description: new SyncedText(),
			stringItems: [],
			nestedItems: []
		}
	});

	let array = $derived(syncedState.nestedItems);

	$inspect(array);
	$inspect(syncedState.description.delta);

	$inspect(reactiveAwareness.states);
</script>

<h1>Awareness</h1>

<input bind:value={reactiveAwareness.local.name} placeholder="Awareness name..." />

<ul>
	{#each reactiveAwareness.states as [id, state] (id)}
		<li>{id} - {JSON.stringify(state)}</li>
	{/each}
</ul>

<h1>SyncedText</h1>

<textarea>{syncedState.description.string}</textarea>

<button onclick={() => syncedState.description.insert(0, 'new text')}>Insert</button>
<button
	onclick={() =>
		syncedState.description.insertEmbed(5, {
			embeddedInfo: {
				isCool: true
			}
		})}
>
	Insert Embed
</button>
<button onclick={() => syncedState.description.insertEmbed(5, new Y.Array())}>
	Insert Embed YType
</button>

<h1>Synced Array</h1>

<button onclick={() => array.push({ name: 'new item', isCool: false })}>Push</button>

{#each array as item, i (i)}
	<input type="text" name="test" bind:value={item.name} />

	<button onclick={() => array.splice(i, 1)}>Remove</button>
{/each}

<h1>Welcome to your library project {array.at(0)?.name?.length}</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
