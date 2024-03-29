<template>
    <ui-modal ref="modal" @reveal="onReveal()" :title="!link ? 'Start session' : 'Share and solve'">
        <div style="text-align: center; position: relative;">
            <template v-if="!link">
                <p class="share-info-text">Start a group session for this crossword and solve with others in real time.</p>
                <ui-textbox ref="nameBox" class="crossword-name-input" v-model="solverName" @keydown-enter="startSession()">
                    <b>0A</b> Your name ({{solverName.length}})
                </ui-textbox>
                <ui-button :loading="loading" color="primary" :disabled="!solverName.length" @click="startSession()">Start</ui-button>
            </template>
            <template v-else>
                <p class="session-info-text">Session ID: <span class="session-id-text">   {{sessionId}}</span>
                        </p>
                <div style="display: flex; align-items: center;">
                    <img v-if="qrString" :src="qrString" class="share-qr-code" alt="QR code for invitation link"/>
                    <div>
                        <p class="share-info-text">Invite others to join your session using the following link. The session will remain active whilst there is at least one solver connected.</p>
                    </div>
                </div>
                <div class="crossword-link-text">{{link}}</div>
                <ui-button color="primary" style="margin-top: 1em;" @click="copyClicked()">Copy</ui-button>
               <!--  <ui-button v-if="shareAvailable" color="primary" style="margin-top: 1em;" @click="shareLink()">Share</ui-button> -->
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
    height: 96px;
    width: 96px;
}

.session-id-text {
    font-family: $answerFontFamily;
    vertical-align: top;
    text-transform: uppercase;
}

.session-info-text {
    font-family: $clueFontFamily;
    margin: 0;
    opacity: 0.7;
}

.share-info-text {
    text-align: left;
    padding-left: 1em;
    line-height: 1.5;
    font-family: $clueFontFamily;
}

.crossword-link-text {
    margin-top: 1em;
    font-family: $answerFontFamily;
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
import QRCode from 'qrcode';

import copy from 'copy-to-clipboard';

export default Vue.extend({
  data() {
    return {
      solverName: "",
      bundler: "Parcel",
      qrString: "",
      shareAvailable: false,
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
  computed: {
    sessionId() {
        const toks = this.link.split('/');
        return toks[toks.length - 1].replaceAll('-', ' ');
    }
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
        if (this.solverName)
            localStorage['confuzzle:solverName'] = this.solverName;
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
        if (localStorage['confuzzle:solverName']) {
            this.solverName = localStorage['confuzzle:solverName'];
        }
        Vue.nextTick(() => {
            this.$refs.modal.open();
        });
    },
    close() {
        this.$refs.modal.close();
    }
  },
  mounted() {
    if ('share' in navigator)
        this.shareAvailable = true;
    if (localStorage['confuzzle:solverName']) {
        this.solverName = localStorage['confuzzle:solverName'];
    }
    this.makeQrCode(this.link)
  }
});
</script>
