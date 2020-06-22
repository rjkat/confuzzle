<template>
    <ui-tabs type="icon-and-text">
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="extension"></ui-icon>
                <span>Solve</span>
            </div>
            <div id="solve-panel">
                <div class="crossword-clue-panel"></div>
            </div>
        </ui-tab>
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="build"></ui-icon>
                <span>Compile</span>
            </div>
            <ana-compile/>
        </ui-tab>
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="people"></ui-icon>
                <span>Collude</span>
            </div>
            <ana-collude/>
        </ui-tab>
    </ui-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import { UiIcon, UiTab, UiTabs } from 'keen-ui';
import AnaCompile from './components/AnaCompile.vue'
import AnaCollude from './components/AnaCollude.vue'

export default Vue.extend({
  components: {
    AnaCompile,
    AnaCollude,
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

<style lang="scss">
    @import "./stylesheets/_variables.scss";
    .ui-tab-header-item--type-icon-and-text {
        height: 2.5rem;
    }
    .ana-tab-header {
        font-family: $clueFontFamily;
        text-transform: none;
        display: flex;
        .ui-icon {
            margin-right: 8px;
        }
    }
</style>