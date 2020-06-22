<template>
    <div id="compile-panel-wrapper">
        <div id="compile-panel">
            <div class="compile-panel line-numbers panel" id="edit-panel">
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
                <textarea class="prism-live language-eno" id="crossword-source"></textarea>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { UiButton, UiFileupload, UiIcon, UiPopover } from 'keen-ui';

export default Vue.extend({
  components: {
    UiButton,
    UiFileupload,
    UiIcon,
    UiPopover,
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
