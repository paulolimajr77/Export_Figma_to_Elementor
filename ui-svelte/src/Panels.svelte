<script>
  export let active = 'layout';
</script>

{#if active === 'layout'}
  <section class="panel">Ações de layout aqui.</section>
{:else if active === 'ai'}
  <section class="panel">Configuração de IA.</section>
{:else if active === 'wp'}
  <section class="panel">Configuração WP.</section>
{:else}
  <section class="panel">
    <ul class="help">
      <li>Selecione um frame raiz no Figma antes de gerar.</li>
      <li>Use Auto Layout para manter flex-direction.</li>
    </ul>
  </section>
{/if}

<style>
  @import '../tokens.css';
  .panel { background: var(--color-panel); border:1px solid var(--color-border); border-radius: var(--color-radius); padding:16px; margin:16px; }
  .help { margin:0; padding-left:18px; color:var(--color-text-secondary); line-height:1.6; }
</style>
