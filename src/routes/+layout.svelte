<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { setupConvex } from 'convex-svelte';
  import '../app.css';

  setupConvex(env.PUBLIC_CONVEX_URL ?? '');
</script>

<div class="app">
  <header class="header">
    <h1>CorpSpeak</h1>
    <p class="tagline">Where every message becomes corporate jargon.</p>
  </header>
  <main class="main">
    <slot />
  </main>
</div>
