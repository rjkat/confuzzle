<template>
  <div class="cfz-anagram-container">
      <cfz-scratchpad class="cfz-standalone-scratchpad" standalone>
        
      </cfz-scratchpad>

      <div class="cfz-anagram-footer">
        <ui-button color="primary" @click="$emit('close-anagram-helper')" class="cfz-anagram-home-button">
            <table class="cfz-logo" width="30" height="30" style="padding-right: .5rem;">
            <td data-solver-mask="3" data-number="?" style="height: 1em; width: 1em; z-index: 0 !important;"
             >C</td>
            </table>
            Open crossword solver
        </ui-button>
      </div>
  </div>
</template>

<style lang="scss">
  .cfz-standalone-scratchpad {
    padding: 1rem;
    flex-grow: 1;
  }
  .cfz-anagram-container {
    height: 100%;
    max-height: 100%;
    width: 100%;
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    flex-direction: column;
  }
  .cfz-anagram-footer {
    width: 100%;
    text-align: center;
  }
  .cfz-anagram-home-button {
    margin-bottom: 2rem;
    min-height: calc(30px + 1rem);
  }
</style>

<script>

import Vue from 'vue';
import CfzScratchpad from './CfzScratchpad.vue'

export default Vue.extend({
  components: {
    CfzScratchpad
  },
  props: {
    showReturnButton: Boolean,
    isPortrait: Boolean,
    loading: Boolean,
  },
  computed: {
  },
  methods: {
  },
  data() {
    return {
      bundler: "Parcel",
    };
  },
});
</script>