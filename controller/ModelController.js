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
                'sortRelated': require('../component/action/SortRelatedAction'),
                'sortOwnRelated': require('../component/action/SortOwnRelatedAction')
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
        const meta = this.meta;
        this.setClassMetaParams();
        meta.view = meta.class = meta.class.getLastVersion();
        this.setViewMetaParams(this.getQueryParam('v'), 'create');
        await this.setMasterMetaParams();
        if (meta.class.isAbstract()) {
            return this.renderMeta('selectClass', this.getMetaParams());
        }
        const model = meta.view.createModel(this.getSpawnConfig());
        meta.model = model;
        model.readOnly = model.isReadOnlyState();
        await model.setDefaultValues();
        this.setDefaultMasterValue(model);
        await this.security.resolveOnCreate(model);
        await this.security.resolveAttrsOnCreate(model);
        if (this.isGetRequest()) {
            await this.security.resolveRelations(meta.view, {model});
            const transit = this.createMetaTransit();
            await transit.resolve(model);
            return this.renderCreation(model);
        }
        return this.executeCreation(model);
    }

    async actionUpdate () {
        await this.setMetaParams('edit');
        const query = this.getModelQuery().withFormData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        let model = await this.setModelMetaParams(query);
        this.isGetRequest()
            ? await this.security.resolveOnEdit(model) // with additional actions
            : await this.security.resolveOnUpdate(model);
        const forbidden = !this.security.access.canUpdate();
        if (forbidden && this.meta.view.forbiddenView) {
            query.view = this.meta.view.forbiddenView;
            model = await this.setModelMetaParams(query.withStateView(false));
        } else {
            model.readOnly = forbidden || model.readOnly;
        }
        await this.security.resolveAttrsOnUpdate(model);
        return this.isGetRequest()
            ? this.renderUpdate(model)
            : this.executeUpdate(model, forbidden);
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
        await this.resolveMasterAttr({refView: 'selectListView'});
        await this.security.resolveAttrsOnList(this.meta.view);
        this.meta.dependency = this.getQueryParam('d');
        return this.render('select', this.getMetaParams());
    }

    async actionClone () {
        if (this.isPostRequest()) {
            return this.actionCreate();
        }
        await this.setMetaParams('create');
        const query = this.getModelQuery();
        const sample = await this.setModelMetaParams(query);
        const model = this.meta.view.createModel(this.getSpawnConfig());
        this.meta.model = model;
        model.clone(sample);
        await this.security.resolveOnCreate(model);
        await this.security.resolveAttrsOnCreate(model);
        await this.security.resolveRelations(this.meta.view, {model});
        return this.renderCreation(model);
    }

    // LIST

    async actionList () {
        await this.setViewNodeMetaParams();
        await this.security.resolveOnList(this.meta.view);
        await this.security.resolveAttrsOnList(this.meta.view);
        const query = this.meta.view.createQuery(this.getSpawnConfig()).withListData();
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
        await this.security.resolveAttrsOnList(this.meta.view);
        const query = this.meta.view.createQuery(this.getSpawnConfig()).withListData();
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
        await this.security.resolveAttrsOnList(this.meta.view);
        const master = this.meta.master;
        const query = this.meta.view.createQuery(this.getSpawnConfig({
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
        await this.security.resolveAttrsOnList(this.meta.view);
        const query = this.meta.view.createQuery(this.getSpawnConfig()).withListData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        this.sendJson(await grid.getList());
    }

    async actionListRelatedSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const query = this.meta.view.createQuery(this.getSpawnConfig({
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
        const query = this.meta.view.createQuery(this.getSpawnConfig()).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {controller: this, query});
        this.sendJson(await select.getList());
    }

    // METHODS

    async renderUpdate (model) {
        const transit = this.createMetaTransit();
        await this.security.resolveRelations(this.meta.view, {model});
        await transit.resolve(model);
        await this.meta.view.resolveEnums();
        await model.resolveReadOnlyAttrTitles();
        const canSign = await model.createSignatureBehavior()?.canSign(this.createMetaSecurity());
        return this.renderModel('update', this.getMetaParams({model, canSign}));
    }

    async executeUpdate (model, forbidden) {
        this.checkCsrfToken();
        if (!forbidden && !model.readOnly) {
            const excludes = this.security.getForbiddenAttrs('update');
            model.load(this.getPostParam('data'), excludes);
            if (!await model.save()) {
                return this.handleModelError(model);
            }
            await this.deleteRelatedModels(model); // to check access
        }
        return this.resolveTransit(this.createMetaTransit(), model);
    }

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

    async renderCreation (model) {
        await model.related.resolveEagers();
        await model.related.resolveEmbeddedModels();
        await this.meta.view.resolveEnums();
        await model.resolveCalcValues();
        return this.renderModel('create', this.getMetaParams({model}));
    }

    async executeCreation (model) {
        this.checkCsrfToken();
        const excludes = this.security.getForbiddenAttrs('create') || [];
        if (this.meta.master.refAttr) {
            excludes.push(this.meta.master.refAttr.name);
        }
        model.load(this.getPostParam('data'), excludes);
        return await model.save()
            ? this.resolveTransit(this.createMetaTransit(), model)
            : this.handleModelError(model);
    }


    renderModel (template, data) {
        const {groups, group} = this.getQueryParams();
        data.loadedGroups = Array.isArray(groups) ? groups : null;
        data.group = group ? data.model.view.grouping.getGroup(group) : null;
        return this.renderMeta(data.group ? 'group' : template, data);
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

    async deleteById (id, cls) {
        const model = await cls.createQuery(this.getSpawnConfig()).byId(id).withStateView().one();
        if (!model) {
            throw new BadRequest(`Object not found: ${id}.${cls.id}`);
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