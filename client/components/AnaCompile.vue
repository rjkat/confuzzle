<template>
    <div id="compile-panel-wrapper">
        <div id="compile-panel">
            <ui-tabs type="icon-and-text">
                <ui-tab title="Edit">
                    <ui-icon slot="icon" icon="edit"></ui-icon>
                    <div class="compile-panel line-numbers panel" id="edit-panel">
                        <textarea class="prism-live language-eno" id="crossword-source"></textarea>
                    </div>
                </ui-tab>
                <ui-tab title="Debug" id="debug-label">
                    <ui-icon slot="icon" icon="report"></ui-icon>
                    <div class="compile-panel panel" id="debug-panel">
                        <div id="error-text"></div>
                        <div id="error-snippet-wrapper">
                            <pre id="error-snippet"></pre>
                        </div>
                    </div>
                </ui-tab>
                <ui-tab title="Convert">
                    <ui-icon slot="icon" icon="publish"></ui-icon>
                    <div class="compile-panel panel" id="convert-panel">
                        <div id="drop-area">
                          <form class="upload-form">
                            Drag and drop .puz file here, or 
                            <input type="file" id="selected-puz-file" accept="application/x-crossword">
                            <label class="upload-button" for="selected-puz-file">Upload .puz file</label>
                          </form>
                        </div>
                         <div style="text-align: center; margin-top: .5em;">
                            <a><button type="button" class="action-button" id="download-puz-button">Download .puz</button></a>
                        </div>
                    </div>
                </ui-tab>
            </ui-tabs>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { UiIcon, UiTab, UiTabs } from 'keen-ui';

export default Vue.extend({
  components: {
    UiIcon,
    UiTab,
    UiTabs
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
