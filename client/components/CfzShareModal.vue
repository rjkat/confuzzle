<template>
    <ui-modal ref="modal" @reveal="onReveal()" :title="!link ? 'Start session' : 'Share and solve'">
        <div style="text-align: center; position: relative;">
            <template v-if="!link">
                <p class="share-info-text">Start a shared session for this crossword and solve with others in real time.</p>
                <ui-textbox ref="nameBox" class="crossword-name-input" v-model="solverName" @keydown-enter="startSession()">
                    <b>0A</b> Your name ({{solverName.length}})
                </ui-textbox>
                <ui-button :loading="loading" color="primary" :disabled="!solverName.length" @click="startSession()">Start</ui-button>
            </template>
            <template v-else>
                <div style="display: flex; align-items: center;">
                    <img v-if="qrString" :src="qrString" class="share-qr-code" alt="QR code for invitation link"/>
                    <p class="share-info-text">Invite others to join your session using this link. The session will remain active whilst there is at least one solver connected.</p>
                </div>
                <div class="crossword-link-text">{{link}}</div>

                <ui-button v-if="shareAvailable" color="primary" style="margin-top: 1em;" @click="shareLink()">Share</ui-button>
                <ui-button v-else color="primary" style="margin-top: 1em;" @click="copyClicked()">Copy</ui-button>
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

.share-qr-code {
    height: 76px;
    width: 76px;
}

.share-info-text {
    text-align: left;
    padding-left: 1em;
    line-height: 1.5;
    font-family: $clueFontFamily;
}

.crossword-link-text {
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
import QRCode from 'qrcode';

import copy from 'copy-to-clipboard';

export default Vue.extend({
  data() {
    return {
      solverName: "",
      bundler: "Parcel",
      qrString: "",
      shareAvailable: false
    };
  },
  props: {
    title: "",
    loading: false,
    link: "",
  },
  watch: {
    link(newLink) {
        this.makeQrCode(newLink);
    },
  },
  methods: {
    makeQrCode(url) {
        if (!url)
            return;
        QRCode.toDataURL(url).then(s => {
            this.qrString = s;
        }).catch(err => {
            console.error(err)
        });
    },
    startSession() {
        this.$emit('share-clicked', this.solverName);
    },
    shareLink() {
        navigator.share({
          title: this.title,
          url: this.link,
        });
    },
    copyClicked() {
        copy(this.link);
        this.$emit('copy-clicked');
    },
    onReveal() {
        if (this.$refs.nameBox)
            this.$refs.nameBox.focus();
    },
    open() {
        this.$refs.modal.open();
    },
    close() {
        this.$refs.modal.close();
    }
  },
  mounted() {
    if ('share' in navigator)
        this.shareAvailable = true;
    this.makeQrCode(this.link)
  }
});
</script>
