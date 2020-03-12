<template>
  <div id="app">
    <div class="container">
      <waterfall :merge="true" :mergeColumns="[1, 2, 3]" :mergeHeight="750">
        <template slot="merge">
          <img class="image" src="https://s10.mogucdn.com/mlcdn/c45406/200309_6lb33405bb7f8gd022jlf1deacel8_710x750.jpg" alt="">
        </template>
      </waterfall>
    </div>
  </div>
</template>

<script>
import Waterfall from '@/components/Waterfall/index.vue';

export default {
  name: 'App',
  components: {
    Waterfall,
  },
  mounted() {
  },
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
}
.container {
  padding-top: 20px;
  width: 1200px;
  margin: 0 auto;
}
</style>
