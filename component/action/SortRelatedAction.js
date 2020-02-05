/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SortAction');

module.exports = class SortRelatedAction extends Base {

    constructor (config) {
        super({
            template: 'sortRelated',
            ...config
        });
    }

    async execute () {
        const meta = this.controller.meta;
        await this.controller.setMetaParams();
        if (!meta.master.attr) {
            throw new BadRequest('Invalid master attribute');
        }
        await this.controller.resolveMasterAttr({
            refView: 'listView',
            access: {actions: [Rbac.UPDATE]}
        });
        return this.executeView(meta.master.attr.getListView());
    }
};

const BadRequest = require('areto/error/BadRequestHttpException');
const Rbac = require('evado/component/security/rbac/Rbac');