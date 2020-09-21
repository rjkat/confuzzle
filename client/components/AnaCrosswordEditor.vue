<template>
<div class="ana-crossword-editor-container">
      <ana-editor
          :source="source"
          :loading="loading"
          @input="$emit('input', $event)">
      </ana-editor>
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
      <ui-progress-linear v-if="loading" class="edit-progress"></ui-progress-linear>
</div>
</template>

<style lang="scss">
  .ana-crossword-editor-container {
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
    font-family: $answerFontFamily;
  }
  .edit-progress {
    position: absolute;
    bottom: 0;
  }
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
    errorText: String,
    errorMessage: String
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
