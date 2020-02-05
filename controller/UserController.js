/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseController');

module.exports = class UserController extends Base {

    getModelClass () {
        return this.getClass('model/User');
    }

    actionListSelect () {
        return this.sendSelectList(this.createModel().find(), {});
    }
};
module.exports.init(module);