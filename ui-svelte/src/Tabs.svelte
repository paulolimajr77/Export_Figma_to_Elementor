<script>
  export let active = 'layout';
  const tabs = [
    { id: 'layout', label: 'Layout → Elementor' },
    { id: 'ai', label: 'Configuração da IA' },
    { id: 'wp', label: 'WordPress' },
    { id: 'help', label: 'Ajuda' }
  ];
  const set = (id) => active = id;
</script>

<div class="tab-bar">
  {#each tabs as t}
    <button class:active={active === t.id} on:click={() => set(t.id)}>{t.label}</button>
  {/each}
</div>

<style>
  @import '../tokens.css';
  .tab-bar { display:flex; border-bottom:1px solid var(--color-border); background:var(--color-panel); }
  button {
    flex:1; padding:12px; border:none; background:none; font-weight:600;
    color:var(--color-text-secondary); cursor:pointer; border-bottom:2px solid transparent;
    transition:160ms;
  }
  button:hover { transform: scale(1.03); }
  button.active { color:var(--color-primary); border-bottom-color:var(--color-primary); }
</style>
