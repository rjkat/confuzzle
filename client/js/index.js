import {AnagrindClient} from './client.js'

import Vue from 'vue';
import App from '../App.vue'

require('../stylesheets/main.scss');

const client = new AnagrindClient(this, window.location.host);
const vm = new App({
    el: '#app',
});
