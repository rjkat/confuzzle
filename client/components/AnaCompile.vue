<template>
<div>
    <ui-fileupload color="primary" id="selected-puz-file" name="puz-file" accept="application/x-crossword">Upload .puz</ui-fileupload>
    <ui-button icon="get_app" id="download-puz-button">Download .puz</ui-button>
    <button class="popover-trigger">
        Debug
        <ui-popover open-on="mouseenter">
            <div id="error-text"></div>
            <div id="error-snippet-wrapper">
                <pre id="error-snippet"></pre>
            </div>
        </ui-popover>
    </button>
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
