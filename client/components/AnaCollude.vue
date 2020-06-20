<template>
    <div id="collude-panel">
        <p>1. Join the chat room (optional)</p>
        <div class="chat-widget-wrapper">
            <iframe src="https://discordapp.com/widget?id=698304447809323139&theme=light" allowtransparency="true" frameborder="0"></iframe>
        </div>
        <div class="crossword-enter-name" id="collude-enter-name">
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
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  components: {
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>