<template>
    <ui-modal ref="modal" title="Share Crossword">
        <ui-textbox class="crossword-name-input" v-model="solverName">
            <b>0A</b> Your name ({{solverName.length}})
        </ui-textbox>
        <div slot="footer">
            <ui-button color="primary" :disabled="!solverName.length">Share</ui-button>
        </div>
    </ui-modal>
</template>

<style lang="scss">
.crossword-name-input {
    width: 10em;
    .ui-textbox__label-text {
        font-family: $clueFontFamily;
    }
    input {
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        text-transform: uppercase;
    }
}

.crossword-link-text {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 1em;
    overflow: auto;
    max-width: 18em;
    border-radius: 3px;
    border: 1px solid $gridBgColor;
    font-family: $answerFontFamily;
}
</style>

<script>
import Vue from "vue";

export default Vue.extend({
  data() {
    return {
      solverName: "",
      bundler: "Parcel"
    };
  },
  methods: {
    open() {
        this.$refs.modal.open();
    },
    close() {
        this.$refs.modal.close();
    }
  }
});
</script>
