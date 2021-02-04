/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortOwnRelatedAction extends Base {

    constructor (config) {
        super({
            template: 'sortOwnRelated',
            ...config
        });
    }

    async execute () {
        const meta = this.controller.meta;
        await this.controller.setMetaParams();
        const attr = meta.master.attr;
        if (!attr) {
            throw new BadRequest('Invalid master attribute');
        }
        if (!attr.relation || !attr.relation.isSortable()) {
            throw new BadRequest('Not sortable relation');
        }
        const model = meta.master.model;
        if (model.isNew()) {
            throw new BadRequest('Invalid master model');
        }
        await this.controller.resolveMasterAttr({
            refView: 'listView',
            access: {
                actions: [Rbac.UPDATE]
            }
        });
        if (this.isGetRequest()) {
            return this.controller.renderMeta(this.template, this.controller.getMetaParams());
        }
        this.getPostParam('delete')
            ? await model.related.deleteOrder(attr)
            : await model.related.updateOrder(attr, this.validateData(this.getPostParam('order')));
        this.sendText('Done');
    }

    validateData (data) {
        if (!Array.isArray(data)) {
            throw new BadRequest('Invalid sort data');
        }
        return data;
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const Rbac = require('evado/component/security/rbac/Rbac');
