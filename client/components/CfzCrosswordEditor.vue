<template>
<div class="cfz-crossword-editor-container">
      <ui-toolbar :loading="loading" class="cfz-editor-toolbar hidden-print">

        <form action="/syntax" target="_blank" slot="icon">
          <ui-button
                  icon="help"
                  type="primary"
              >
              Syntax guide
          </ui-button>
        </form>
        <div slot="brand">
          <ui-button
                icon="lock"
                type="primary"
                @click="$emit('scramble-clicked', $event)"
                v-if="!scrambled"
            >
            Scramble
          </ui-button>
          <ui-button
                icon="lock_open"
                type="primary"
                @click="$emit('unscramble-clicked', $event)"
                v-if="scrambled"
            >
            Unscramble
          </ui-button>

        </div>
        <div slot="actions">
            <ui-button
                icon="visibility"
                type="primary"
                @click="$emit('preview-clicked', $event)"
            >
            </ui-button>
        </div>
    </ui-toolbar>

      <cfz-editor
          ref="editor"
          :source="source"
          :loading="loading"
          @input="$emit('input', $event)">
      </cfz-editor>
      <ui-alert type="error" v-if="errorText && !errorDismissed" class="edit-error" @dismiss="dismissError()">
        <div class="edit-alert-body">
            <span class="edit-alert-text">{{errorText}}</span>
            <ui-button class="edit-alert-button" raised>
              Details
              <ui-popover position="top-end">
                <pre class="edit-alert-message">{{errorMessage}}</pre>
              </ui-popover>
            </ui-button>
        </div>
      </ui-alert>
</div>
</template>

<style lang="scss">
  .cfz-editor-toolbar {
      position: sticky;
      top: 0;
      height: 2rem !important;
      overflow: hidden;
      flex: none;
      background-color: #efefef;
      z-index: 2;
      box-shadow: 0 0 2px rgb(0 0 0 / 12%), 0 2px 2px rgb(0 0 0 / 20%), inset 0 0 2px rgb(0 0 0 / 12%), inset 0 2px 2px rgb(0 0 0 / 20%) !important;

      .ui-button {
        height: calc(2rem - 6px) !important;
      }
  }
  .cfz-crossword-editor-container {
    display: flex;
    flex-direction: column;
    .ui-alert__icon {
      margin: auto;
    }
    .ui-alert__dismiss-button {
      margin: auto;
    }
  }
  .edit-error {
    flex: none;
    margin-bottom: 0;
  }
  .edit-alert-text {
    margin-top: auto;
    margin-bottom: auto;
    margin-left: .5em;
    margin-right: .5em;
  }
  .edit-alert-button {
    margin-right: .5em;
  }
  .edit-alert-body {
    display: flex !important;
    justify-content: space-between;
  }
  .edit-alert-message {
    padding: .5em;
    color: #000;
    font-family: $answerFontFamily;
  }
  .edit-progress {
    position: absolute;
    bottom: 0;
  }
</style>

<script>
import Vue from "vue";
import CfzEditor from './CfzEditor.vue'

export default Vue.extend({
  components: {
    CfzEditor
  },
  props: {
    source: String,
    loading: Boolean,
    errorText: String,
    errorMessage: String,
    scrambled: Boolean
  },
  watch: {
    errorText() {
      this.errorDismissed = false; 
    }
  },
  model: {
    prop: 'source'
  },
  methods: {
    dismissError() {
      this.errorDismissed = true;
    },
    redraw() {
      this.$refs.editor.redraw();
    }
  },
  data() {
    return {
      bundler: "Parcel",
      errorDismissed: false
    };
  }
});
</script>
