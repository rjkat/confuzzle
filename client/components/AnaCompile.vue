<template>
<div>
    <ana-editor :crossword-source="crosswordSource"></ana-editor>
</div>
</template>

<script>
import Vue from "vue";
import AnaEditor from './AnaEditor.vue'

export default Vue.extend({
  components: {
    AnaEditor
  },
  props: {
    crosswordSource: String,
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
