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
        await this.setMetaParams({viewName: 'create'});
        const meta = this.meta;
        if (meta.class.isAbstract()) {
            return this.renderMeta('selectClass', this.getMetaParams());
        }
        await this.security.resolveOnCreate(meta.view);
        if (this.isGet()) {
            await this.security.resolveRelations(meta.view);
        }
        const config = this.getSpawnConfig();
        const model = meta.view.spawnModel(config);
        meta.model = model;
        await model.setDefaultValues();
        this.setDefaultMasterValue(model);
        if (this.isGet()) {
            const query = meta.view.find(config).withFormData();
            await query.resolveRelation([model]);
            await meta.view.resolveEnums();
            return this.renderMeta(this.action.name, this.getMetaParams({model}));
        }
        const excludes = this.security.getForbiddenAttrs('create') || [];
        if (meta.master.refAttr) {
            excludes.push(meta.master.refAttr.name);
        }
        model.load(this.getPostParam('data'), excludes);
        if (!await model.save()) {
            return this.handleModelError(model);
        }
        this.sendText(model.getId());
    }

    async actionUpdate () {
        const transit = this.createMetaTransit();
        await this.setMetaParams({viewName: 'edit'});
        const query = this.getModelQuery().withFormData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const model = await this.setModelMetaParams(query);
        await this.security.resolveOnUpdate(model);
        if (this.isGet()) {
            await transit.resolve(model);
            await this.security.resolveRelations(this.meta.view);
        }
        const forbidden = !this.security.access.canUpdate();
        model.readOnly = forbidden || model.isTransiting() || model.isReadOnlyState();
        if (this.isGet()) {
            await this.meta.view.resolveEnums();
            return this.renderMeta('update', this.getMetaParams({model}));
        }
        if (forbidden) {
            throw new Forbidden;
        }
        if (model.isTransiting()) {
            throw new Forbidden('Transition in progress');
        }
        const request = this.getPostParams();
        if (!model.readOnly) {
            model.load(request.data, this.security.getForbiddenAttrs('update'));
            if (!await model.save()) {
                return this.handleModelError(model);
            }
            await this.deleteRelatedModels(model); // to check access
        }
        if (request.transition) {
            await transit.execute(model, request.transition);
        }
        this.sendText(model.getId());
    }

    async actionDelete () {
        await this.setMetaParams();
        await this.deleteById(this.getPostParam('id'), this.meta.class);
        this.sendStatus(200);
    }

    async actionDeleteList () {
        await this.setMetaParams();
        const ids = String(this.getPostParam('ids')).split(',');
        for (const id of ids) {
            try {
                await this.deleteById(id, this.meta.class);
            } catch (err) {
                this.log('error', err);
            }
        }
        this.sendStatus(200);
    }

    async actionSelect () {
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({
            refView: 'selectListView',
            access: {actions: ['read', 'create', 'update']}
        });
        this.meta.dependency = this.getQueryParam('d');
        return this.render('select', this.getMetaParams());
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
        await this.setMasterRelationMetaParams();
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
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({refView: 'listView'});
        const query = this.meta.view.find(this.getSpawnConfig()).withListData();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        this.sendJson(await grid.getList());
    }

    async actionListRelatedSelect () {
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const request = this.getPostParams();
        const query = this.meta.view.find(this.getSpawnConfig({
            model: this.meta.master.model,
            dependency: request.dependency
        })).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {request, query});
        this.sendJson(await select.getList());
    }

    async actionListFilterSelect () {
        const request = this.getPostParams();
        const attr = this.docMeta.getAttr(request.id);
        if (!attr) {
            throw new BadRequest('Meta attribute not found');
        }
        this.meta.attr = attr;
        this.meta.class = attr.class;
        this.meta.view = attr.getSelectListView();
        await this.security.resolveOnList(this.meta.view);
        const query = this.meta.view.find(this.getSpawnConfig()).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {request, query});
        this.sendJson(await select.getList());
    }

    // METHODS

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
        const model = await metaClass.findById(id, this.getSpawnConfig()).withState().one();
        if (!model) {
            throw new BadRequest(`Object not found: ${id}.${metaClass.id}`);
        }
        const access = await this.security.resolveAccessOnDelete(model);
        if (!access.canDelete()) {
            throw new Forbidden(`Removal is forbidden: ${model}`);
        }
        return model.delete();
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/BadRequestHttpException');
const Forbidden = require('areto/error/ForbiddenHttpException');