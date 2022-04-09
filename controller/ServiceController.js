/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseMetaController');

module.exports = class ServiceController extends Base {

    static getConstants () {
        return {
            NAV_SEARCH_MIN: 2,
            NAV_SEARCH_MAX: 32
        };
    }

    async actionNav () {
        this.setNodeMetaParams({node: this.getQueryParam('id')});
        if (!this.meta.node.children) {
            throw new BadRequest('No child nodes');
        }
        const view = this.createView();
        const menu = this.spawn(SideMenu, {view});
        this.send(await menu.renderItems(this.meta.node.children, this.meta.node.section));
    }

    async actionNavSearch () {
        const section = this.navMeta.getSection('main');
        const value = this.getPostParam('search');
        if (!this.validateNavSearch(value)) {
            throw new BadRequest('Invalid search value');
        }
        const nodes = section.search(value);
        if (!nodes.length) {
            return this.send();
        }
        const view = this.createView();
        const menu = this.spawn(SideMenu, {view});
        this.send(await menu.renderItems(nodes, section));
    }

    validateNavSearch (value) {
        return typeof value === 'string'
            && value.length >= this.NAV_SEARCH_MIN
            && value.length <= this.NAV_SEARCH_MAX;
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const SideMenu = require('../component/widget/SideMenu');