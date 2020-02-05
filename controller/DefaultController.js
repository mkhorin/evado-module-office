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
        const url = this.module.getParam('defaultUrl');
        return url ? this.redirect(url) : this.render('index');
    }
};
module.exports.init(module);