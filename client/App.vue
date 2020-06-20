<template>
    <ui-tabs type="icon-and-text">
        <ui-tab title="Solve">
            <template #icon>
                <i class="fab fa-delicious"/>
            </template>
            <div id="solve-panel">
                <div class="crossword-clue-panel"></div>
            </div>
        </ui-tab>
        <ui-tab title="Compile">
            <template #icon>
                <i class="fa fa-hammer"/>
            </template>
            <div id="compile-panel-wrapper">
                <div class="tabs tabs-top" id="compile-panel">
                    <input type="radio" name="compile-tabs" id="edit-tab" checked="checked">
                    <label class="tab-label" for="edit-tab"><i class="fa fa-edit"></i>Edit</label>
                    <div class="compile-panel line-numbers panel" id="edit-panel">
                        <textarea class="prism-live language-eno" id="crossword-source"></textarea>
                    </div>
                    <input type="radio" name="compile-tabs" id="debug-tab" checked="checked">
                    <label class="tab-label" for="debug-tab" id="debug-label"><i class="fa fa-bug"></i>Debug</label>
                    <div class="compile-panel panel" id="debug-panel">
                        <div id="error-text"></div>
                        <div id="error-snippet-wrapper">
                            <pre id="error-snippet"></pre>
                        </div>
                    </div>
                    <input type="radio" name="compile-tabs" id="convert-tab" checked="checked">
                    <label class="tab-label" for="convert-tab"><i class="fa fa-file-export"></i>Convert</label>
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
                </div>
            </div>
        </ui-tab>
        <ui-tab title="Collude">
            <template #icon>
                <i class="fa fa-users"/>
            </template>
            <div id="collude-panel">
                <p>1. Join the chat room (optional)</p>
                <div class="chat-widget-wrapper">
                    <iframe src="https://discordapp.com/widget?id=698304447809323139&theme=light" allowtransparency="true" frameborder="0"></iframe>
                </div>
                <div class="crossword-enter-name hidden" id="collude-enter-name">
                    <p id="join-text">2. Get a shared link to your crossword</p>
                    <label for="name"><b>0A Your name (<span id="collude-name-length">0</span>)</b></label><br>
                    <input id="collude-name-input" class="crossword-name-input" name="name" autocomplete="off"><br>
                    <input type="submit" class="action-button" value="Share" id="collude-button" disabled>
                </div>
                <div class="crossword-share-link hidden">
                    <p>2. Share this link to solve with others. It will remain active
                    whilst there is at least one active solver.</p>
                    <div class="crossword-link-text">
                        anagrind.com/grid/foo
                    </div>
                    <button class="action-button" id="copy-link-button">Copy</button>
                </div>
            </div>
        </ui-tab>
    </ui-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import { UiTab, UiTabs } from 'keen-ui';

export default Vue.extend({
  components: {
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