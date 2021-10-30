/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/base/Action');

module.exports = class SortAction extends Base {

    constructor (config) {
        super({
            template: 'sort',
            ...config
        });
    }

    async execute () {
        await this.controller.setViewNodeMetaParams();
        await this.controller.security.resolveOnSort(this.controller.meta.view);
        return this.executeByView(this.controller.meta.view);
    }

    async executeByView (view) {
        const attrName = this.getQueryParam('column');
        const names = this.controller.extraMeta.getData(view).modalSortNames;
        if (!names.includes(attrName)) {
            throw new BadRequest(`Not modal sortable attribute`);
        }
        const sortAttr = view.getAttr(attrName);
        if (this.isGetRequest()) {
            return this.controller.renderMeta(this.template, this.controller.getMetaParams({sortAttr}));
        }
        const data = this.validateData(this.getPostParam('order'));
        const behaviors = view.behaviors.getAllByClassAndAttr(SortOrderBehavior, attrName);
        for (const config of behaviors) {
            await this.updateByBehavior(config, data, view);
        }
        this.sendText('Done');
    }

    validateData (data) {
        if (!data) {
            throw new BadRequest('Invalid sort data');
        }
        for (const key of Object.keys(data)) {
            data[key] = parseInt(data[key]);
            if (!Number.isSafeInteger(data[key])) {
                throw new BadRequest('Invalid order number');
            }
        }
        return data;
    }

    updateByBehavior (config, data, view) {
        const behavior = this.spawn(config, {
            owner: this,
            user: this.user
        });
        return behavior.update(data, view);
    }
};

const SortOrderBehavior = require('evado-meta-base/behavior/SortOrderBehavior');
const BadRequest = require('areto/error/http/BadRequest');