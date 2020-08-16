/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/base/BaseMetaController');

module.exports = class ModelController extends Base {

    static getConstants () {
        return {
            ACTIONS: {
                'sort': require('../component/action/SortAction'),
                'sort-related': require('../component/action/SortRelatedAction'),
                'sort-own-related': require('../component/action/SortOwnRelatedAction')
            }
        };
    }

    async actionIndex () {
        await this.setViewNodeMetaParams();
        await this.security.resolveOnIndex(this.meta);
        return this.renderMeta('index', this.getMetaParams());
    }

    async actionFilter () {
        await this.setMetaParams();
        await this.meta.view.resolveEnums();
        return this.renderMeta('filter', this.getMetaParams());
    }

    async actionTitle () {
        await this.setMetaParams();
        const query = this.getModelQuery().withTitle();
        const model = await this.setModelMetaParams(query);
        await this.security.resolveOnTitle(model);
        this.sendText(model.getTitle());
    }

    async actionCreate () {
        await this.setMetaParams('create');
        const meta = this.meta;
        if (meta.class.isAbstract()) {
            return this.renderMeta('selectClass', this.getMetaParams());
        }
        const transit = this.createMetaTransit();
        const model = meta.view.createModel(this.getSpawnConfig());
        meta.model = model;
        model.readOnly = model.isReadOnlyState();
        await model.setDefaultValues();
        this.setDefaultMasterValue(model);
        await this.security.resolveOnCreate(model);
        if (this.isGet()) {
            await this.security.resolveRelations(meta.view, {model});
            await transit.resolve(model);
            return this.renderCreate(model);
        }
        this.checkCsrfToken();
        const excludes = this.security.getForbiddenAttrs('create') || [];
        if (meta.master.refAttr) {
            excludes.push(meta.master.refAttr.name);
        }
        model.load(this.getPostParam('data'), excludes);
        return await model.save()
            ? this.resolveTransit(transit, model)
            : this.handleModelError(model);
    }

    async actionUpdate () {
        const transit = this.createMetaTransit();
        await this.setMetaParams('edit');
        const query = this.getModelQuery().withFormData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        let model = await this.setModelMetaParams(query);
        await this.security.resolveOnUpdate(model);
        let forbidden = !this.security.access.canUpdate();
        if (forbidden && this.meta.view.forbiddenView) {
            forbidden = false;
            query.view = this.meta.view.forbiddenView;
            model = await this.setModelMetaParams(query.withStateView(false));
        } else {
            model.readOnly = forbidden || model.readOnly;
        }
        await this.security.resolveAttrsOnUpdate(model);
        if (this.isGet()) {
            await this.security.resolveRelations(this.meta.view, {model});
            if (!forbidden) {
                await transit.resolve(model);
            }
            await this.meta.view.resolveEnums();
            await model.resolveReadOnlyAttrTitles();
            return this.renderMeta('update', this.getMetaParams({model}));
        }
        this.checkCsrfToken();
        if (forbidden) {
            throw new Forbidden;
        }
        if (model.isTransiting()) {
            throw new Locked('Transition in progress');
        }
        if (!model.readOnly) {
            const excludes = this.security.getForbiddenAttrs('update');
            model.load(this.getPostParam('data'), excludes);
            if (!await model.save()) {
                return this.handleModelError(model);
            }
            await this.deleteRelatedModels(model); // to check access
        }
        return this.resolveTransit(transit, model);
    }

    async actionDelete () {
        this.checkCsrfToken();
        await this.setMetaParams();
        const id = this.getPostParam('id');
        await this.deleteById(id, this.meta.class);
        this.sendText(id);
    }

    async actionDeleteList () {
        this.checkCsrfToken();
        await this.setMetaParams();
        const ids = String(this.getPostParam('ids')).split(',');
        const result = [];
        for (const id of ids) {
            try {
                await this.deleteById(id, this.meta.class);
                result.push(id);
            } catch (err) {
                this.log('error', `Deletion failed: ${id}.${this.meta.class.id}:`, err);
            }
        }
        this.sendText(result.join());
    }

    async actionSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({
            refView: 'selectListView',
            access: {actions: ['read', 'create', 'update']}
        });
        this.meta.dependency = this.getQueryParam('d');
        return this.render('select', this.getMetaParams());
    }

    async actionClone () {
        if (this.isPost()) {
            return this.actionCreate();
        }
        await this.setMetaParams('create');
        const query = this.getModelQuery();
        const sample = await this.setModelMetaParams(query);
        const model = this.meta.view.createModel(this.getSpawnConfig());
        this.meta.model = model;
        model.clone(sample);
        await model.setDefaultValues();
        await this.security.resolveOnCreate(model);
        await this.security.resolveRelations(this.meta.view, {model});
        return this.renderCreate(model);
    }

    // LIST

    async actionList () {
        await this.setViewNodeMetaParams();
        await this.security.resolveOnList(this.meta.view);
        const query = this.meta.view.find(this.getSpawnConfig()).withListData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        this.sendJson(await grid.getList());
    }

    async actionListTree () {
        await this.setViewNodeMetaParams();
        this.meta.treeView = this.meta.view.treeView;
        const {node, depth} = this.getPostParams();
        if (node) {
            await this.resolveTreeMetaParams(node, depth, 'list');
        }
        await this.security.resolveOnList(this.meta.view);
        const query = this.meta.view.find(this.getSpawnConfig()).withListData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const master = this.meta.master;
        if (master.attr) {
            await master.attr.relation.setQueryByModel(query, master.model);
        }
        const grid = this.spawn('meta/MetaTreeGrid', {controller: this, query, depth});
        this.sendJson(await grid.getList());
    }

    async actionListSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const master = this.meta.master;
        const query = this.meta.view.find(this.getSpawnConfig({
            model: master.model,
            dependency: this.getPostParam('dependency')
        }));
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const attr = master.attr;
        const name = attr.isRef() ? attr : attr.relation.linkAttrName;
        const value = master.model.get(name);
        if (value) {
            query.and(['NOT IN', attr.relation.refAttrName, value]);
        }
        const grid = this.spawn('meta/MetaGrid', {
            controller: this,
            query: query.withListData()
        });
        this.sendJson(await grid.getList());
    }

    async actionListRelated () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'listView'});
        const query = this.meta.view.find(this.getSpawnConfig()).withListData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        this.sendJson(await grid.getList());
    }

    async actionListRelatedSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const query = this.meta.view.find(this.getSpawnConfig({
            model: this.meta.master.model,
            dependency: this.getPostParam('dependency')
        })).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {controller: this, query});
        this.sendJson(await select.getList());
    }

    async actionListFilterSelect () {
        const attr = this.baseMeta.getAttr(this.getPostParam('id'));
        if (!attr) {
            throw new BadRequest('Meta attribute not found');
        }
        this.meta.attr = attr;
        this.meta.class = attr.class;
        this.meta.view = attr.getSelectListView();
        await this.security.resolveOnList(this.meta.view);
        const query = this.meta.view.find(this.getSpawnConfig()).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {controller: this, query});
        this.sendJson(await select.getList());
    }

    // METHODS

    async resolveTransit (transit, model) {
        const transition = this.getPostParam('transition');
        if (transition) {
            await transit.execute(model, transition);
            if (model.hasError()) {
                return this.handleModelError(model);
            }
        }
        this.sendText(model.getId());
    }

    async renderCreate (model) {
        await model.related.resolveEagers();
        await model.related.resolveEmbeddedModels();
        await this.meta.view.resolveEnums();
        await model.resolveCalcValues();
        return this.renderMeta('create', this.getMetaParams({model}));
    }

    resolveMasterAttr ({refView, access}) {
        const attr = this.meta.master.attr;
        if (!attr) {
            throw new BadRequest(`Master attribute not set`);
        }
        if (!attr.relation) {
            throw new BadRequest(`No relation`);
        }
        this.meta.class = attr.relation.refClass;
        this.meta.view = attr.getRefView(refView, 'list');
        return this.security.resolveOnList(this.meta.view, access);
    }

    async deleteRelatedModels (owner) {
        for (const model of owner.related.getDeletedModels()) {
            await this.deleteById(model.getId(), model.class);
        }
    }

    async deleteById (id, metaClass) {
        const model = await metaClass.findById(id, this.getSpawnConfig()).withStateView().one();
        if (!model) {
            throw new BadRequest(`Object not found: ${id}.${metaClass.id}`);
        }
        const access = await this.security.resolveAccessOnDelete(model);
        if (!access.canDelete()) {
            throw new Forbidden(`Deletion is forbidden: ${model}`);
        }
        return model.delete();
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const Forbidden = require('areto/error/http/Forbidden');
const Locked = require('areto/error/http/Locked');