<script setup vapor lang="ts">
import { ArrayPlus } from "@bzzz/utility/ArrayPlus";
fetch("/api").then(async (r) => {
  const o = await r.json();
  console.log(o, r);
});
console.log({ArrayPlus})
</script>

<template>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>
</template>

<style scoped>

</style>
