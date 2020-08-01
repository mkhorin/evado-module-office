/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('evado/component/base/BaseController');

module.exports = class BaseController extends Base {

    async getModel () {
        let model = this.createModel();
        let id = model.getDb().normalizeId(this.getQueryParam('id'));
        if (!id) {
            throw new BadRequest('Invalid ID');
        }
        model = await model.findById(id).one();
        if (!model) {
            throw new NotFound;
        }
        return model;
    }

};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const NotFound = require('areto/error/http/NotFound');