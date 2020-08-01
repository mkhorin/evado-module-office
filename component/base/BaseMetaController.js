/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('evado/component/base/BaseController');

module.exports = class BaseMetaController extends Base {

    static getConstants () {
        return {
            ACTION_VIEW: require('evado/component/meta/MetaActionView')
        };
    }

    constructor (config) {
        super(config);
        this.metaHub = this.module.getMetaHub();
        this.baseMeta = this.metaHub.get('base');
        this.navMeta = this.metaHub.get('navigation');
        this.security = this.createMetaSecurity();
        this.meta = this.spawn('meta/MetaParams');
        this.meta.security = this.security;
        this.extraMeta = this.module.get('extraMeta');
    }

    getMetaParams (params) {
        return {
            baseMeta: this.baseMeta,
            extraMeta: this.extraMeta,
            meta: this.meta,
            security: this.security,
            readOnly: false,
            ...params
        };
    }

    createMetaSecurity (config) {
        return this.spawn('meta/MetaSecurity', {controller: this, ...config});
    }

    createMetaTransit () {
        return this.spawn('meta/MetaTransit', {
            controller: this,
            security: this.security
        });
    }

    getModelQuery (id = this.getQueryParam('id')) {
        return this.meta.view.findById(id, this.getSpawnConfig());
    }

    setMetaParams (defaultView) {
        this.setClassMetaParams();
        this.setViewMetaParams(this.getQueryParam('v'), defaultView);
        return this.setMasterMetaParams();
    }

    setClassMetaParams (name = this.getQueryParam('c')) {
        this.meta.class = this.baseMeta.getClass(name);
        if (!this.meta.class) {
            throw new BadRequest('Meta class not found');
        }
        this.meta.view = this.meta.class;
    }

    setViewMetaParams (name, defaultName) {
        if (name) {
            this.meta.view = this.meta.class.getViewByPrefix(this.module.getBaseName(), name);
            if (!this.meta.view) {
                throw new BadRequest('Meta view not found');
            }
        } else if (defaultName) {
            const view = this.meta.class.getViewByPrefix(this.module.getBaseName(), defaultName);
            if (view) {
                this.meta.view = view;
            }
        }
    }

    setAttrMetaParams (data = this.getQueryParam('a')) {
        const [attrName, viewName, className] = String(data).split('.');
        this.setClassMetaParams(className);
        this.setViewMetaParams(viewName);
        this.meta.attr = this.meta.view.getAttr(attrName);
        if (!this.meta.attr) {
            throw new BadRequest(`Meta attribute not found: ${data}`);
        }
    }

    async setMasterMetaParams (data = this.getQueryParam('m')) {
        if (!data) {
            return null;
        }
        const [attrName, id, viewName, className] = data.split('.');
        const master = this.meta.master;
        master.class = this.baseMeta.getClass(className);
        if (!master.class) {
            throw new BadRequest(`Master class not found: ${data}`);
        }
        master.view = viewName ? master.class.getView(viewName) : master.class;
        if (!master.view) {
            throw new BadRequest(`Master view not found: ${data}`);
        }
        master.attr = master.view.getAttr(attrName);
        if (!master.attr) {
            throw new BadRequest(`Master attribute not found: ${data}`);
        }
        if (!master.attr.relation) {
            throw new BadRequest(`Master relation not found: ${data}`);
        }
        if (!this.meta.class) {
            this.meta.class = master.attr.relation.refClass;
            this.meta.view = master.attr.listView;
        }
        if (master.attr.relation.refClass !== this.meta.class) {
            throw new BadRequest(`Invalid master: ${data}`);
        }
        if (!id) {
            master.model = master.view.createModel(this.getSpawnConfig());
            return master;
        }
        master.model = await master.view.findById(id, this.getSpawnConfig()).one();
        if (!master.model) {
            throw new BadRequest(`Master instance not found: ${data}`);
        }
    }

    setDefaultMasterValue (model) {
        const master = this.meta.master;
        const attr = master.attr && master.attr.relation.refAttr;
        if (attr && attr.relation && !model.get(attr)) {
            model.set(attr, master.model.get(attr.relation.refAttrName));
            master.refAttr = attr;
        }
    }

    async setModelMetaParams (query) {
        const model = await query.one();
        if (!model) {
            throw new BadRequest('Object not found');
        }
        this.meta.model = model;
        model.readOnly = model.isTransiting() || model.isReadOnlyState();
        return model;
    }

    setViewNodeMetaParams (data) {
        this.setNodeMetaParams(data);
        if (!this.meta.view) {
            throw new BadRequest(`Node view not found`);
        }
    }

    setNodeMetaParams ({node} = {}) {
        node = node || this.getQueryParam('n');
        node = this.navMeta.getNode(node);
        if (!node) {
            throw new NotFound('Node not found');
        }
        const metaClass = this.baseMeta.getClass(node.data.class);
        const view = node.data.view || 'list';
        this.meta.node = node;
        this.meta.class = metaClass;
        this.meta.view = (metaClass && metaClass.getView(view)) || metaClass;
        return node;
    }

    async resolveTreeMetaParams (node, depth, viewName) {
        const level = this.meta.view.treeView.getLevel(depth);
        if (!level) {
            throw new BadRequest(`Tree view level not found`);
        }
        const master = this.meta.master;
        master.class = level.sourceClass;
        master.view = master.class;
        master.attr = level.refAttr;
        master.model = await master.view.findById(node, this.getSpawnConfig()).one();
        if (!master.model) {
            throw new BadRequest('Tree view node not found');
        }
        this.meta.class = level.getRefClass();
        this.meta.view = level.getRefView(viewName);
    }

    async assignSecurityModelFilter (query) {
        query.security = this.createMetaSecurity();
        return await query.security.resolveOnList(query.view, {skipAccessException: true})
            ? query.security.access.assignObjectFilter(query)
            : query.where(['FALSE']);
    }

    handleModelError (model) {
        this.send({[model.class.name]: this.translateMessageMap(model.getFirstErrorMap())}, 400);
    }

    async renderMeta (template, params) {
        return this.render(template, {
            utilities: await this.getUtilities(),
            utilityMenu: this.meta.view.options.utilityMenu,
            ...params
        });
    }

    getUtilities () {
        return this.module.get('utility').getActiveItems({
            controller: this,
            modelAction: this.action.name,
            metaParams: this.meta
        });
    }

    log (type, message, data) {
        message = this.meta.view ? `${this.meta.view.id}: ${message}` : message;
        this.baseMeta.log(type, message, data);
    }
};

const BadRequest = require('areto/error/http/BadRequest');
const NotFound = require('areto/error/http/NotFound');