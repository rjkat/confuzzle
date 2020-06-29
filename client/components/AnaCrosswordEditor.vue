<template>
<div>
    <ana-editor v-model="value"></ana-editor>
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
    value: String,
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
