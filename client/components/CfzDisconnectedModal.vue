<template>
    <ui-modal ref="modal" title="Lost connection" :dismissible="canClose">
        <div style="text-align: center;">
                <p class="disconnect-info-text" v-if="!reconnectFailed">
                    Your connection was interrupted. How would you like to 
                    proceed?
                </p>
                <p class="disconnect-info-text" v-else>
                    Unable to reconnect. How would you like to proceed?
                </p>
                <ui-button :disabled="reconnecting" @click="stayOfflineClicked()">Stay offline</ui-button>
                <ui-button :loading="reconnecting" color="primary" @click="reconnectClicked()">Reconnect</ui-button>
        </div>
    </ui-modal>
</template>

<style lang="scss">
.disconnect-info-text {
    font-family: $clueFontFamily;
}
.ui-modal__header-text {
    font-family: $clueFontFamily;
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
      bundler: "Parcel",
      canClose: false
    };
  },
  props: {
    reconnecting: false,
    reconnectFailed: false
  },
  methods: {
    reconnectClicked() {
        this.$emit('reconnect-clicked');
    },
    stayOfflineClicked() {
        this.$emit('stay-offline-clicked');
    },
    open() {
        this.canClose = false;
        this.$refs.modal.open();
    },
    close() {
        this.canClose = true;
        const self = this;
        Vue.nextTick(() => this.$refs.modal.close());
    }
  }
});
</script>
