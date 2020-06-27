<template>
    <div class="line-numbers">
        <textarea class="prism-live language-eno" id="crossword-source" @keyup="$emit('update-source', $event.target.value)" :value="crosswordSource"></textarea>
    </div>
</template>

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
    crosswordSource: String
  },
  data() {
    return {
      bundler: "Parcel",
    };
  }
});

</script>