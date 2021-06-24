<template>
  <div class="cfz-anagram-app-container">
      <cfz-anagram-view class="cfz-anagram-app-view" standalone>
        
      </cfz-anagram-view>

      <div class="cfz-anagram-app-footer">
        <ui-button color="primary" @click="$emit('close-anagram-helper')" class="cfz-anagram-app-home-button">
            <table class="cfz-flat-logo" width="30" height="30" style="padding-right: .5rem; ">
            <td data-solver-mask="3" data-number="?" style="height: 1em; width: 1em; z-index: 0 !important;"
             >C</td>
            </table>
            Open crossword solver
        </ui-button>
      </div>
  </div>
</template>

<style lang="scss">
  .cfz-flat-logo {
    border-color: var(--grid-bg-color);
    color: var(--text-color);
  }
  .cfz-anagram-app-view {
    padding: 1rem;
    flex-grow: 1;
  }
  .cfz-anagram-app-container {
    height: 100%;
    max-height: 100%;
    width: 100%;
    max-width: 100ch;
    margin: auto;
    display: flex;
    flex-direction: column;
  }
  .cfz-anagram-app-footer {
    width: 100%;
    text-align: center;
  }
  .cfz-anagram-app-home-button {
    margin-bottom: 2rem;
    min-height: calc(30px + 1rem);
  }
</style>

<script>

import Vue from 'vue';
import CfzAnagramView from './CfzAnagramView.vue'

export default Vue.extend({
  components: {
    CfzAnagramView
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