/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseMetaController');

module.exports = class ServiceController extends Base {

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
        if (typeof value !== 'string' || value.length < 2 || value.length > 32) {
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
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const SideMenu = require('../component/widget/SideMenu');