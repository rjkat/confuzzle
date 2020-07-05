<template>
    <div class="line-numbers">
        <textarea class="prism-live language-eno" id="crossword-source"
                  ref="textarea"
                  :value="source"
                  @input="$emit('input', $event.target.value)">
        </textarea>
        <ui-progress-linear class="edit-progress" v-if="loading"></ui-progress-linear>
    </div>
</template>

<style lang="scss">
.line-numbers {
  height: 100%;
  width: 100%;
}
.prism-live {
  height: 100%;
  width: 100%;
}
.edit-progress {
  position: fixed;
  margin-top: -0.25rem;
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