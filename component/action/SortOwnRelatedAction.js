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
        const {meta} = this.controller;
        await this.controller.setMetaParams();
        const {attr, model} = meta.master;
        if (!attr) {
            throw new BadRequest('Invalid master attribute');
        }
        if (!attr.relation.isSortable()) {
            throw new BadRequest('Not sortable relation');
        }
        if (model.isNew()) {
            throw new BadRequest('Invalid master model');
        }
        await this.controller.security.resolve({
            targetType: Rbac.TARGET_OBJECT,
            target: model,
            actions: [Rbac.UPDATE]
        });
        await this.controller.security.resolveAttrsOnUpdate(model);
        if (!meta.canUpdateAttr(attr, model)) {
            throw new Forbidden('Access denied for modification');
        }
        if (this.isGetRequest()) {
            const params = this.controller.getMetaParams();
            return this.controller.renderMeta(this.template, params);
        }
        const params = this.getPostParams();
        params.delete
            ? await model.related.deleteOrder(attr)
            : await model.related.updateOrder(attr, this.validateData(params.order));
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
const Forbidden = require('areto/error/http/Forbidden');
const Rbac = require('evado/component/security/rbac/Rbac');
