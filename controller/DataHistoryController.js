/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseMetaController');

module.exports = class DataHistoryController extends Base {

    getModelClass () {
        return this.getClass('model/DataHistory');
    }

    async actionIndex () {
        this.setClassMetaParams();
        const ownerQuery = this.getModelQuery();
        const owner = await this.setModelMetaParams(ownerQuery);
        await this.checkAccess(owner);
        const model = this.createModel({owner});
        await this.render('index', {model, owner});
    }

    async actionList () {
        this.setClassMetaParams();
        const ownerQuery = this.getModelQuery();
        const owner = await this.setModelMetaParams(ownerQuery);
        await this.checkAccess(owner);
        const query = this.createModel({owner}).findByOwner().with('user');
        await this.sendGridList(query, {viewModel: 'list'});
    }

    async checkAccess (owner) {
        await this.security.resolveOnUpdate(owner);
        if (!this.security.access.canUpdate()) {
            throw new Forbidden;
        }
    }
};
module.exports.init(module);

const Forbidden = require('areto/error/http/Forbidden');