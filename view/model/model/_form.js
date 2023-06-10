/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('areto/view/ViewModel');

module.exports = class ModelForm extends Base {

    static getConstants () {
        return {
            MAX_LIST_LIMIT: 50
        }
    }

    isLoadedGroup ({name}) {
        return this.groupData[name]?.loaded === true;
    }

    getAttrData ({name}, key) {
        if (Object.hasOwn(this.attrData, name)) {
            return this.attrData[name][key];
        }
    }

    getGroupData ({name}, key) {
        if (Object.hasOwn(this.groupData, name)) {
            return this.groupData[name][key];
        }
    }

    async resolveTemplateData () {
        this.model = this.data.model;
        this.resolveGroupData();
        await this.resolveAttrData();
        return {
            viewModel: this
        };
    }

    resolveGroupData () {
        this.groupData = {};
        const group = this.data.group || this.model.view.grouping;
        this.resolveGroupsByParent(group);
    }

    resolveGroupsByParent (parent) {
        for (const group of parent.groups) {
            if (group.isHidden()) {
                continue;
            }
            if (this.checkLoadedGroup(group)) {
                this.resolveGroupsByParent(group);
            }
        }
        this.groupData[parent.name] = {
            loaded: true
        };
    }

    checkLoadedGroup (group) {
        if (!group.isLoadable()) {
            return true;
        }
        return Array.isArray(this.data.loadedGroups)
            ? this.data.loadedGroups.includes(group.name)
            : group.isActive();
    }

    async resolveAttrData () {
        this.attrData = {};
        await this.resolveSelectableModelsByViewType(VIEW_TYPES.RELATION_CHECKBOX_LIST);
        await this.resolveSelectableModelsByViewType(VIEW_TYPES.RELATION_RADIO_LIST);
    }

    resolveSelectableModelsByViewType (type) {
        const attrs = this.model.view.getAttrsByViewType(type);
        if (attrs) {
            return this.resolveSelectableModels(attrs);
        }
    }

    async resolveSelectableModels (attrs) {
        for (const attr of attrs) {
            if (!this.isHiddenAttr(attr) && this.canUpdateAttr(attr)) {
                const view = attr.getRefView('selectListView', 'list');
                const limit = view.options.listLimit || this.MAX_LIST_LIMIT;
                const query = view.createQuery().limit(limit).withTitle();
                const models = await query.all();
                this.setAttrData(attr, 'selectableModels', models);
            }
        }
    }

    setAttrData ({name}, key, data) {
        if (!Object.hasOwn(this.attrData, name)) {
            this.attrData[name] = {};
        }
        this.attrData[name][key] = data;
    }

    canUpdateAttr (attr) {
        return this.data.meta.canUpdateAttr(attr, this.model);
    }

    isHiddenAttr (attr) {
        if (attr.isHidden()) {
            return true;
        }
        if (!this.data.meta.canReadAttr(attr)) {
            return true;
        }
        if (attr.data.group) {
            return !this.groupData[attr.data.group]?.loaded;
        }
        return false;
    }

    isHiddenEmptyAttr (attr) {
        return attr.isHideEmpty() && this.model.isEmptyValue(attr);
    }
};
module.exports.init();

const {VIEW_TYPES} = require('evado-meta-base/helper/TypeHelper');