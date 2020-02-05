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
        await this.setMetaParams({viewName: this.action.name});
        if (this.meta.class.isAbstract()) {
            return this.renderMeta('selectClass', this.getMetaParams());
        }
        await this.security.resolveOnCreate(this.meta.view);
        if (this.isGet()) {
            await this.security.resolveRelations(this.meta.view);
        }
        const model = this.meta.view.spawnModel(this.getSpawnConfig());
        this.meta.model = model;
        await model.setDefaultValues();
        model.related.setDefaultMasterRelation(this.meta.master);
        if (this.isGet()) {
            await this.meta.view.resolveEnums();
            return this.renderMeta(this.action.name, this.getMetaParams({model}));
        }
        model.load(this.getPostParams(), this.security.getForbiddenAttrs('create'));
        return await model.save()
            ? this.sendText(model.getId())
            : this.handleModelError(model);
    }

    async actionUpdate () {
        const transit = this.createMetaTransit();
        const viewName = this.action.name;
        await this.setMetaParams({viewName});
        const query = this.getModelQuery().withFormDefaults();
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
            return this.renderMeta(viewName, this.getMetaParams({model}));
        }
        if (forbidden) {
            throw new Forbidden;
        }
        if (model.isTransiting()) {
            throw new Forbidden('Transition in progress');
        }
        if (!model.readOnly) {
            model.load(this.getPostParams(), this.security.getForbiddenAttrs('update'));
            if (!await model.save()) {
                return this.handleModelError(model);
            }
            await this.deleteRelated(model); // to check access
        }
        const transition = this.getPostParam('transition');
        if (transition) {
            await transit.execute(model, transition);
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
        return this.render('select', this.getMetaParams());
    }

    // LIST

    async actionList () {
        await this.setViewNodeMetaParams();
        await this.security.resolveOnList(this.meta.view);
        const query = this.meta.view.find(this.getSpawnConfig()).withListDefaults();
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
        const query = this.meta.view.find(this.getSpawnConfig()).withListDefaults();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        if (this.meta.master.attr) {
            await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        }
        const grid = this.spawn('meta/MetaTreeGrid', {controller: this, query, depth});
        this.sendJson(await grid.getList());
    }

    async actionListSelect () {
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const attr = this.meta.master.attr;
        const query = this.meta.view.find(this.getSpawnConfig());
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const name = attr.isRef() ? attr : attr.relation.linkAttrName;
        const value = this.meta.master.model.get(name);
        if (value) {
            query.and(['NOT IN', attr.relation.refAttrName, value]);
        }
        const grid = this.spawn('meta/MetaGrid', {
            controller: this,
            query: query.withListDefaults()
        });
        this.sendJson(await grid.getList());
    }

    async actionListRelated () {
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({refView: 'listView'});
        const query = this.meta.view.find(this.getSpawnConfig()).withListDefaults();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        await this.meta.master.attr.relation.setQueryByModel(query, this.meta.master.model);
        const grid = this.spawn('meta/MetaGrid', {controller: this, query});
        this.sendJson(await grid.getList());
    }

    async actionListRelatedSelect () {
        await this.setMasterRelationMetaParams();
        await this.resolveMasterAttr({refView: 'selectListView'});
        const request = this.getPostParams();
        const query = this.meta.view.find(this.getSpawnConfig()).withTitle();
        query.setRelatedFilter(this.assignSecurityModelFilter.bind(this));
        const select = this.spawn('meta/MetaSelect2', {request, query});
        this.sendJson(await select.getList());
    }

    async actionListFilterSelect () {
        const attr = this.docMeta.getAttr(this.getPostParam('id'));
        if (!attr) {
            throw new BadRequest('Meta attribute not found');
        }
        this.meta.attr = attr;
        this.meta.class = attr.class;
        this.meta.view = attr.getSelectListView();
        await this.security.resolveOnList(this.meta.view);
        const request = this.getPostParams();
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

    async deleteRelated (model) {
        for (const data of model.related.getDeletionData()) {
            await this.deleteById(data.id, data.metaClass);
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