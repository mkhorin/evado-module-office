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
        await this.setDynamicNodeMetaParam();
        const params = this.getMetaParams();
        return this.renderMeta('index', params);
    }

    async actionFilter () {
        await this.setMetaParams();
        await this.meta.view.resolveEnums();
        const params = this.getMetaParams();
        return this.renderMeta('filter', params);
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
        this.setCreationMetaParams(meta.class);
        await this.setMasterMetaParams();
        if (this.resolveCreationClassSelection()) {
            const params = this.getMetaParams();
            return this.renderMeta('selectClass', params);
        }
        if (meta.class.isAbstract()) {
            throw new BadRequest('Unable to instantiate abstract class');
        }
        const config = this.getSpawnConfig();
        const model = meta.view.createModel(config);
        meta.model = model;
        await model.setDefaultValues();
        this.setDefaultMasterValue(model);
        model.readOnly = meta.view.isReadOnly();
        await this.security.resolveOnCreate(model);
        await this.security.resolveAttrsOnCreate(model);
        if (this.isGetRequest()) {
            await this.security.resolveRelations(meta.view, {model});
            return this.renderCreation(model);
        }
        this.checkCsrfToken();
        const excludes = this.security.getForbiddenAttrs('create') || [];
        if (this.meta.master.refAttr) {
            excludes.push(this.meta.master.refAttr.name);
        }
        return this.save(model, excludes);
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
            query.withStateView(false);
            model = await this.setModelMetaParams(query);
        } else {
            model.readOnly = forbidden || model.readOnly;
        }
        await this.security.resolveAttrsOnUpdate(model);
        if (this.isGetRequest()) {
            return this.renderUpdate(model);
        }
        if (forbidden) {
            throw new Forbidden('Updating is forbidden');
        }
        const excludes = this.security.getForbiddenAttrs('update');
        return this.save(model, excludes);
    }

    async actionTransit () {
        this.checkCsrfToken();
        this.setMetaParams();
        const query = this.getModelQuery().withFormData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const model = await this.setModelMetaParams(query);
        await this.security.resolveOnUpdate(model);
        const {transition} = this.getPostParams();
        const transit = this.createMetaTransit();
        await transit.execute(model, transition);
        if (model.hasError()) {
            return this.handleModelError(model);
        }
        this.sendText(model.getId());
    }

    async actionDelete () {
        this.checkCsrfToken();
        await this.setMetaParams();
        const {id} = this.getPostParams();
        try {
            await this.deleteById(id, this.meta.class);
            this.sendText(id);
        } catch (err) {
            if (err instanceof HttpException) {
                return this.sendJson([err.message, err.data?.params], err.status);
            }
            throw err;
        }
    }

    async actionDeleteList () {
        this.checkCsrfToken();
        await this.setMetaParams();
        let {ids} = this.getPostParams();
        ids = String(ids).split(',');
        const objects = [], errors = [];
        for (const id of ids) {
            try {
                await this.deleteById(id, this.meta.class);
                objects.push(id);
            } catch (err) {
                err = this.prepareDeletionError(err, id);
                errors.push(err);
            }
        }
        this.sendJson({objects, errors});
    }

    async actionSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        await this.security.resolveAttrsOnList(this.meta.view);
        this.meta.dependency = this.getQueryParam('d');
        const params = this.getMetaParams();
        return this.render('select', params);
    }

    async actionClone () {
        if (this.isPostRequest()) {
            return this.actionCreate();
        }
        await this.setMetaParams('create');
        const query = this.getModelQuery();
        const sample = await this.setModelMetaParams(query);
        const config = this.getSpawnConfig();
        const model = this.meta.view.createModel(config);
        this.meta.model = model;
        model.readOnly = model.view.isReadOnly();
        await model.setDefaultValues();
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
        const config = this.getSpawnConfig();
        const query = this.meta.view.createQuery(config).withListData();
        await this.meta.node.applyFilter(query);
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        const data = await grid.getList();
        this.sendJson(data);
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
        const config = this.getSpawnConfig();
        const query = this.meta.view.createQuery(config).withListData();
        await this.meta.node.applyFilter(query);
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const master = this.meta.master;
        if (master.attr) {
            await master.attr.relation.setQueryByModel(query, master.model);
        }
        const grid = this.spawn('meta/MetaTreeGrid', {
            controller: this,
            query,
            depth
        });
        const data = await grid.getList();
        this.sendJson(data);
    }

    async actionListSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        await this.security.resolveAttrsOnList(this.meta.view);
        const master = this.meta.master;
        const {dependency} = this.getPostParams();
        const config = this.getSpawnConfig({
            model: master.model,
            dependency
        });
        const query = this.meta.view.createQuery(config);
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const attr = master.attr;
        const name = attr.isRef() ? attr : attr.relation.linkAttrName;
        const value = master.model.get(name);
        if (value) {
            query.and(['notIn', attr.relation.refAttrName, value]);
        }
        const grid = this.spawn('meta/MetaGrid', {
            controller: this,
            query: query.withListData()
        });
        const data = await grid.getList();
        this.sendJson(data);
    }

    async actionListRelated () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'listView'});
        await this.security.resolveAttrsOnList(this.meta.view);
        const config = this.getSpawnConfig();
        const query = this.meta.view.createQuery(config).withListData().withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        const data = await grid.getList();
        this.sendJson(data);
    }

    async actionListRelatedSelect () {
        await this.setMasterMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const {dependency} = this.getPostParams();
        const config = this.getSpawnConfig({
            model: this.meta.master.model,
            dependency
        });
        const query = this.meta.view.createQuery(config).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {controller: this, query});
        const data = await select.getList();
        this.sendJson(data);
    }

    async actionListFilterSelect () {
        const {id} = this.getPostParams();
        const attr = this.baseMeta.getAttr(id);
        if (!attr) {
            throw new BadRequest('Meta attribute not found');
        }
        this.meta.attr = attr;
        this.meta.class = attr.class;
        this.meta.view = attr.getSelectListView();
        await this.security.resolveOnList(this.meta.view);
        const config = this.getSpawnConfig();
        const query = this.meta.view.createQuery(config).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {controller: this, query});
        const data = await select.getList();
        this.sendJson(data);
    }

    // METHODS

    async save (model, excludes) {
        if (model.readOnly) {
            throw new Forbidden('Object is read-only');
        }
        this.checkCsrfToken();
        const {data} = this.getPostParams();
        model.load(data, excludes);
        if (!await model.save()) {
            return this.handleModelError(model);
        }
        await this.deleteRelatedModels(model);
        this.sendText(model.getId());
    }

    resolveCreationClassSelection () {
        const {force} = this.getQueryParams();
        if (force) {
            return false;
        }
        const classes = this.meta.class.getActiveDescendants();
        if (classes.length === 1) {
            this.setCreationMetaParams(classes[0]);
        }
        return classes.length > 1 || this.meta.class.isAbstract();
    }

    async renderUpdate (model) {
        const transit = this.createMetaTransit();
        await this.security.resolveRelations(this.meta.view, {model});
        await transit.resolve(model);
        await this.meta.view.resolveEnums();
        await model.resolveReadOnlyAttrTitles();
        const signature = model.createSignatureBehavior();
        const security = this.createMetaSecurity();
        const canSign = await signature?.canSign(security);
        const params = this.getMetaParams({model, canSign});
        return this.renderModel('update', params);
    }

    async renderCreation (model) {
        await model.related.resolveEagers();
        await model.related.resolveEmbeddedModels();
        await this.meta.view.resolveEnums();
        await model.resolveCalcValues();
        const params = this.getMetaParams({model});
        return this.renderModel('create', params);
    }

    renderModel (template, data) {
        const {groups, group} = this.getQueryParams();
        data.loadedGroups = Array.isArray(groups) ? groups : null;
        data.group = group
            ? data.model.view.grouping.getGroup(group)
            : null;
        if (data.group) {
            template = 'group';
        }
        return this.renderMeta(template, data);
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
        const models = owner.related.getDeletedModels();
        for (const model of models) {
            try {
                await this.deleteById(model.getId(), model.class);
            } catch (err) {
                this.log('error', `Deletion failed: ${model}`, err);
            }
        }
    }

    async deleteById (id, modelClass) {
        const config = this.getSpawnConfig();
        const query = modelClass.createQuery(config).byId(id).withStateView();
        const model = await query.one();
        if (!model) {
            throw new BadRequest(`Object not found: ${id}.${modelClass.id}`);
        }
        const access = await this.security.resolveAccessOnDelete(model);
        if (!access.canDelete()) {
            throw new Forbidden(`Deletion is forbidden: ${model}`);
        }
        return model.delete();
    }

    prepareDeletionError (err, id) {
        if (err instanceof HttpException) {
            return [err.message, err.data?.params];
        }
        this.log('error', `Deletion failed: ${id}.${this.meta.class.id}:`, err);
        return ['Object {id}: {err}', {id, err}];
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const Forbidden = require('areto/error/http/Forbidden');
const HttpException = require('areto/error/HttpException');