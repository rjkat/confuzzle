<template>
<div>
    <ana-editor
        :source="source"
        :loading="loading"
        @input="$emit('input', $event)">
    </ana-editor>
</div>
</template>

<style lang="scss" scoped>

</style>

<script>
import Vue from "vue";
import AnaEditor from './AnaEditor.vue'

export default Vue.extend({
  components: {
    AnaEditor
  },
  props: {
    source: String,
    loading: Boolean,
    errorText: String
  },
  model: {
    prop: 'source'
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
