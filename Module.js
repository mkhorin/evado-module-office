/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('evado/component/base/BaseModule');

module.exports = class OfficeModule extends Base {

    static getConstants () {
        return {
            BEHAVIORS: {
                'access': {
                    Class: require('areto/filter/AccessControl'),
                    rules: [{
                        permissions: ['moduleOffice']
                    }]
                },
                'expiredPassword': {
                    Class: require('evado/component/filter/ExpiredPasswordFilter')
                }
            }
        };
    }

    async afterModuleInit () {
        this.addMetaModels();
        return super.afterModuleInit();
    }

    addMetaModels () {
        this.getMetaHub().models.add(this.getConfig('metaModels'));
    }
};
module.exports.init(module);