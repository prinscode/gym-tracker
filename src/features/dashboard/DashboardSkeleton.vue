<template>
  <div class="skeleton-grid" role="status" aria-label="Dashboard laden">
    <div class="skeleton skeleton-hero" />
    <div class="skeleton skeleton-list" />
    <div class="skeleton skeleton-list small" />
    <span class="sr-only">Dashboard laden…</span>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  gap: 1rem;
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-2) 20%,
    color-mix(in srgb, var(--border), var(--surface) 35%) 50%,
    var(--surface-2) 80%
  );
  background-size: 220% 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  animation: shimmer 1.4s ease infinite;
}
.skeleton-hero {
  min-height: 260px;
}
.skeleton-list {
  min-height: 210px;
}
.skeleton-list.small {
  min-height: 150px;
}
@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}
@media (min-width: 900px) {
  .skeleton-grid {
    grid-template-columns: 1.25fr 1fr;
  }
  .skeleton-hero {
    grid-row: 1 / span 2;
  }
}
</style>
