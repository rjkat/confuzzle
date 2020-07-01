<template>
    <ui-modal ref="modal" title="Share Crossword">
        <div style="text-align: center;">
            <template v-if="!shared">
                <p class="share-info-text">Get a shared link to this crossword and collude with others in real time.</p>
                <ui-textbox class="crossword-name-input" v-model="solverName">
                    <b>0A</b> Your name ({{solverName.length}})
                </ui-textbox>
                <ui-button color="primary" :disabled="!solverName.length" @click="shareClicked()">Share</ui-button>
            </template>
            <template v-else>
                <p class="share-info-text">Share this link to solve with others. It will remain active
                   whilst there is at least one active solver.</p>
                <div class="crossword-link-text">
                    anagrind.com/grid/foo
                </div>
                <ui-button color="primary" style="margin-top: 1em;">Copy</ui-button>
            </template>
        </div>
    </ui-modal>
</template>

<style lang="scss">
.crossword-name-input {
    width: 10em;
    text-align: left;
    margin-left: auto;
    margin-right: auto;
    .ui-textbox__label-text {
        font-family: $clueFontFamily;
    }
    input {
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        text-transform: uppercase;
    }
}

.share-info-text {
    font-family: $clueFontFamily;
}

.crossword-link-text {
    height: 40px;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    align-items: center;
    padding-left: 1em;
    overflow: auto;
    max-width: 18em;
    border-radius: 3px;
    border: 1px solid $gridBgColor;
    font-family: $answerFontFamily;
}

.ui-modal__header-text {
    font-family: $clueFontFamily;
}

.ui-button--type-primary.ui-button--color-primary {
    background-color: $titleBgColor !important;
}

.ui-button__content {
    font-family: $titleFontFamily;
}
</style>

<script>
import Vue from "vue";

export default Vue.extend({
  data() {
    return {
      solverName: "",
      bundler: "Parcel",
      shared: false
    };
  },
  methods: {
    shareClicked() {
        this.shared = true;
    },
    open() {
        this.$refs.modal.open();
    },
    close() {
        this.$refs.modal.close();
    }
  }
});
</script>
