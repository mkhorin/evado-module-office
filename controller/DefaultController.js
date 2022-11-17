/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class DefaultController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'error': {
                    Class: require('evado/component/action/ErrorAction')
                },
                'utility': {
                    Class: require('evado/component/utility/UtilityAction'),
                    renderedControl: true
                },
                'widget': {
                    Class: require('evado/component/action/WidgetAction')
                }
            }
        };
    }

    actionIndex () {
        const {defaultUrl} = this.module.params;
        return defaultUrl
            ? this.redirect(defaultUrl)
            : this.render('index');
    }
};
module.exports.init(module);