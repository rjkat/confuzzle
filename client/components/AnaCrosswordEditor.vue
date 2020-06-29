<template>
<div>
    <ana-editor
        :source="source"
        @input="$emit('input', $event)">
    </ana-editor>
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
