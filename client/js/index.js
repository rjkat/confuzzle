
require('../stylesheets/main.scss');
require('../../.sassrc.js');

import Vue from 'vue';
import App from '../App.vue'

document.title = window.location.hostname + ' - beta';

const vm = new App({
    el: '#app',
});
