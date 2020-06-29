<template>
<div>
    <ana-editor :value.sync="source"></ana-editor>
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
    source: String,
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
