<template>
  <div class="cfz-editor-container prism-live">
      <textarea class="prism-live language-eno line-numbers" id="crossword-source"
                ref="textarea"
                spellcheck="false"
                :value="source"
                @input="$emit('input', $event.target.value)">
      </textarea>
  </div>
</template>

<style lang="scss">
  .cfz-editor-container {
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
  methods: {
    redraw() {
      this.prismObj.update();
    }
  },
  data() {
    return {
      bundler: "Parcel",
      prismObj: Object
    };
  },
  mounted() {
    this.prismObj = new Prism.Live(this.$refs.textarea);
  }
});
</script>