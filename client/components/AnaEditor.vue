<template>
  <div class="ana-editor-container">
      <textarea class="prism-live language-eno line-numbers" id="crossword-source"
                ref="textarea"
                spellcheck="false"
                :value="source"
                @input="$emit('input', $event.target.value)">
      </textarea>
  </div>
</template>

<style lang="scss">
  .ana-editor-container {
    overflow-y: scroll;
  }
</style>

<script>
require('prismjs/plugins/line-numbers/prism-line-numbers.css');
require('../stylesheets/prism-eno-light.css');
require('../stylesheets/prism-live.css');
require('prismjs/prism.js');
require('prismjs/plugins/line-numbers/prism-line-numbers.js');
require('../js/prism-eno.js');
require('blissfuljs');
require('regenerator-runtime/runtime.js');
require('../js/prism-live.js');

import Vue from 'vue';

export default Vue.extend({
  props: {
    source: String,
    loading: Boolean,
  },
  model: {
    prop: 'source'
  },
  data() {
    return {
      bundler: "Parcel",
    };
  },
  mounted() {
    new Prism.Live(this.$refs.textarea);
  }
});
</script>