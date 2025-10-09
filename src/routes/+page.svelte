<script lang="ts">
	import { createProxyFromYType } from '$lib/svelte-yjs/proxies/generic.js';
	import { doc } from './synced-document.js';

	const array = createProxyFromYType<[string][]>(doc.getArray('items'));

	$inspect(array);
</script>

<button
	onclick={() => {
		array.push(['new item']);
	}}>Push</button
>

{#each array as item, i (i)}
	<input type="text" name="test" bind:value={item[0]} />

	<button onclick={() => array.splice(i, 1)}>Remove</button>
{/each}

<h1>Welcome to your library project {array.at(0)?.[0].length}</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
