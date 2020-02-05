/**
 * @copyright Copyright (c) 2020 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('evado-api-document/component/ExtraMeta');

module.exports = class ExtraMeta extends Base {

    prepare () {
        super.prepare();
        // this.prepareNavigation(this.metaHub.get('navigation'));
    }

    // NAVIGATION META

    prepareNavigation (meta) {
        this._navigation = {};
        meta.sections.forEach(this.prepareSection, this);
    }

    prepareSection (section) {
        section.items.forEach(this.prepareNode, this);
    }

    prepareNode (node) {
        this._navigation[node.id] = this.getNodeData(node);
    }

    getNodeData () {
        return {};
    }
};