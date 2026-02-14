<template>
  <div class="wrap">
    <h1>{{ title }}</h1>

    <div class="card">
      <p>Hello <b>{{ user }}</b> 👋</p>

      <p>
        This component was rendered with <code>@vue/server-renderer</code>.
      </p>

      <div class="row">
        <span class="pill">Framework: Vue</span>
        <span class="pill">SSR: enabled</span>
        <span class="pill">Engine: DomainEx</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: { type: String, default: "Guest" },
  title: { type: String, default: "Vue SSR" }
});
</script>
