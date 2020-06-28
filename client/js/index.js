require('../../.sassrc.js');

require('../stylesheets/main.scss');

import {AnagrindClient} from './client.js'

import Vue from 'vue';
import App from '../App.vue'


const client = new AnagrindClient(this, window.location.host);
const vm = new App({
    el: '#app',
});
