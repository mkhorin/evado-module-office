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
        const {id} = this.getQueryParams();
        this.setNodeMetaParams({node: id});
        const {children, section} = this.meta.node;
        if (!children) {
            throw new BadRequest('No child nodes');
        }
        const view = this.createView();
        const menu = this.spawn(SideMenu, {view});
        const data = await menu.renderItems(children, section);
        this.send(data);
    }

    async actionNavSearch () {
        const section = this.navMeta.getSection('main');
        const {search: value} = this.getPostParams();
        if (!this.validateNavSearch(value)) {
            throw new BadRequest('Invalid search value');
        }
        const nodes = section.search(value);
        if (!nodes.length) {
            return this.send();
        }
        const view = this.createView();
        const menu = this.spawn(SideMenu, {view});
        const data = await menu.renderItems(nodes, section);
        this.send(data);
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