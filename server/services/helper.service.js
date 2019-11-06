var dataService = require('./data.service');
var sanitizeHtml = require('sanitize-html');

var fs = require('fs');
const cheerio = require('cheerio')
const axios = require('axios');
const ShortcodeTree = require('shortcode-tree').ShortcodeTree;
const chalk = require('chalk');
const log = console.log;

// import FormioForm from 'formiojs/form';

// import { Form } from 'formiojs';

// const {f} = require('formiojs');
var formio = require('formio-service')();
var Form = formio.Form;

// const utils = require('formiojs/utils');


module.exports = {

    truncateString: function (body, length) {
        if (body) {

            let cleanHtml = sanitizeHtml(body, {
                allowedTags: [],
                allowedAttributes: false
              });

            return (cleanHtml.length > length) ? cleanHtml.substr(0, length - 1) + '&hellip;' : cleanHtml;
        }
    },

    sleep: function (ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    },

}