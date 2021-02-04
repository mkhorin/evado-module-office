/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    title: 'Office',

    components: {
        'asset': {
        },
        'i18n': {
        },
        'router': {
            errors: {
                Controller: require('../controller/DefaultController')
            }
        },
        'extraMeta': {
            Class: require('../component/meta/ExtraMeta')
        }
    },
    assets: require('./default-assets'),
    classes: require('./default-classes'),
    widgets: {
        'sideMenu': {
            Class: require('../component/widget/SideMenu')
        }
    },
    indexes: [
    ],
    tasks: {
    },
    params: {
        // defaultUrl: 'office/model?n=[item].[section]',
        hideForbiddenAttr: false
    }
};