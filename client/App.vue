<template>
    <ui-tabs type="icon-and-text">
        <ui-tab title="Solve">
            <ui-icon slot="icon" icon="extension"></ui-icon>
            <div id="solve-panel">
                <div class="crossword-clue-panel"></div>
            </div>
        </ui-tab>
        <ui-tab title="Compile">
            <ui-icon slot="icon" icon="build"></ui-icon>
            <ana-compile/>
        </ui-tab>
        <ui-tab title="Collude">
            <ui-icon slot="icon" icon="people"></ui-icon>
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
    .ui-tab-header-item__text {
        font-family: $clueFontFamily;
        text-transform: none;
    }
</style>