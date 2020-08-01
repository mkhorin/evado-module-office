/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseMetaController');

module.exports = class ServiceController extends Base {

    async actionNav () {
        const node = this.setNodeMetaParams({node: this.getQueryParam('id')});
        if (!node.children) {
            throw new BadRequest('No child nodes');
        }
        const view = this.createView();
        const menu = this.spawn(SideMenu, {view});
        this.send(await menu.renderItems(node.children, node.section));
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const SideMenu = require('../component/widget/SideMenu');