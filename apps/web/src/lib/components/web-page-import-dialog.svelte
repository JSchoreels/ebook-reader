<script lang="ts">
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { buttonClasses, inputClasses } from '$lib/css-classes';
  import { createEventDispatcher, onMount } from 'svelte';

  export let resolver: (url: string | undefined) => void;

  const dispatch = createEventDispatcher<{ close: void }>();

  let input: HTMLInputElement;
  let pageUrl = '';
  let error = '';

  onMount(() => input.focus());

  function closeDialog(url?: string) {
    resolver(url);
    dispatch('close');
  }

  function submit() {
    const value = pageUrl.trim();

    try {
      const url = new URL(value);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      error = 'Enter a valid HTTP or HTTPS page URL';
      return;
    }

    closeDialog(value);
  }
</script>

<DialogTemplate>
  <svelte:fragment slot="header">Import Web Page</svelte:fragment>
  <form
    class="flex min-w-[60vw] flex-col text-sm sm:min-w-96 sm:text-base"
    slot="content"
    on:submit|preventDefault={submit}
  >
    <label for="web-page-url">Page URL</label>
    <input
      id="web-page-url"
      type="url"
      placeholder="https://www3.nhk.or.jp/news/..."
      class={inputClasses}
      bind:this={input}
      bind:value={pageUrl}
    />
    <div class="mt-4 text-red-500">{error}</div>
  </form>
  <div class="flex grow justify-between" slot="footer">
    <button class={buttonClasses} on:click={() => closeDialog(undefined)}>
      Cancel
      <Ripple />
    </button>
    <button class={buttonClasses} on:click={submit}>
      Import
      <Ripple />
    </button>
  </div>
</DialogTemplate>
