<script>
  import Tabs from './Tabs.svelte';
  import Panels from './Panels.svelte';
  let active = 'layout';
</script>

<main class="app">
  <Tabs bind:active />
  <Panels {active} />
</main>

<style>
  @import '../tokens.css';
  .app {
    max-width: 850px;
    margin: 0 auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
</style>
