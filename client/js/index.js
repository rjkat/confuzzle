
require('../stylesheets/main.scss');
require('../../.sassrc.js');

import Vue from 'vue';
import App from '../App.vue'

const vm = new App({
    el: '#app',
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../service-worker.js');
}

