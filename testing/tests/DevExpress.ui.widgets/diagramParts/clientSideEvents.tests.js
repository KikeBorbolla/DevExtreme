import $ from 'jquery';
const { test } = QUnit;
import 'common.css!';
import 'ui/diagram';

import { DiagramCommand, DiagramModelOperation } from 'devexpress-diagram';
import { Consts } from '../../../helpers/diagramHelpers.js';

const moduleConfig = {
    beforeEach: function() {
        this.$element = $('#diagram').dxDiagram();
        this.instance = this.$element.dxDiagram('instance');
    }
};

QUnit.module('ClientSideEvents', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
        moduleConfig.beforeEach.apply(this, arguments);
    },
    afterEach: function() {
        this.clock.restore();
        this.clock.reset();
    }
}, () => {
    test('click on unbound diagram', function(assert) {
        this.instance._diagramInstance.commandManager.getCommand(DiagramCommand.Import).execute(Consts.SIMPLE_DIAGRAM);
        let clickedItem;
        this.instance.option('onItemClick', function(e) {
            clickedItem = e.item;
        });
        this.instance._diagramInstance.onNativeAction.raise('notifyItemClick', this.instance._diagramInstance.model.findShape('107').toNative());
        assert.equal(clickedItem.id, '107');
        assert.equal(clickedItem.text, 'A new ticket');
        assert.equal(clickedItem.dataItem, undefined);
        let count = 0;
        for(const key in clickedItem) {
            if(Object.prototype.hasOwnProperty.call(clickedItem, key)) count++;
        }
        assert.equal(count, 5);
    });
    test('selectionchanged on unbound diagram', function(assert) {
        this.instance._diagramInstance.commandManager.getCommand(DiagramCommand.Import).execute(Consts.SIMPLE_DIAGRAM);
        let selectedItems;
        this.instance.option('onSelectionChanged', function(e) {
            selectedItems = e.items;
        });
        this.instance._diagramInstance.selection.set([this.instance._diagramInstance.model.findShape('107').key]);
        assert.equal(selectedItems.length, 1);
        assert.equal(selectedItems[0].id, '107');
        assert.equal(selectedItems[0].text, 'A new ticket');
    });
    test('click on bound diagram', function(assert) {
        const nodes = [
            { key: '123', text: 'mytext', foo: 'bar' },
            { key: '345', text: 'myconnector' }
        ];
        const edges = [
            { key: '1', from: '123', to: '345' }
        ];
        this.instance.option('nodes.keyExpr', 'key');
        this.instance.option('nodes.textExpr', 'text');
        this.instance.option('edges.keyExpr', 'key');
        this.instance.option('edges.fromKey', 'from');
        this.instance.option('edges.toKey', 'to');
        this.instance.option('nodes.dataSource', nodes);
        this.instance.option('edges.dataSource', edges);
        let clickedItem;
        let dblClickedItem;
        this.instance.option('onItemClick', function(e) {
            clickedItem = e.item;
        });
        this.instance.option('onItemDblClick', function(e) {
            dblClickedItem = e.item;
        });
        this.instance._diagramInstance.onNativeAction.raise('notifyItemClick', this.instance._diagramInstance.model.findShapeByDataKey('123').toNative());
        assert.equal(clickedItem.dataItem.key, '123');
        assert.equal(clickedItem.dataItem.foo, 'bar');
        assert.equal(clickedItem.text, 'mytext');
        assert.equal(clickedItem.dataItem.key, nodes[0].key);
        let count = 0;
        for(const key in clickedItem) {
            if(Object.prototype.hasOwnProperty.call(clickedItem, key)) count++;
        }
        assert.equal(count, 5);
        assert.equal(dblClickedItem, undefined);

        this.instance._diagramInstance.onNativeAction.raise('notifyItemDblClick', this.instance._diagramInstance.model.findShapeByDataKey('123').toNative());
        assert.equal(dblClickedItem.dataItem.key, '123');
        assert.equal(dblClickedItem.dataItem.foo, 'bar');
        assert.equal(dblClickedItem.text, 'mytext');
        assert.equal(dblClickedItem.dataItem.key, nodes[0].key);

        this.instance._diagramInstance.onNativeAction.raise('notifyItemClick', this.instance._diagramInstance.model.findConnectorByDataKey('1').toNative());
        assert.equal(clickedItem.dataItem.key, '1');
        assert.equal(clickedItem.fromKey, '123');
        assert.equal(clickedItem.toKey, '345');
        assert.equal(clickedItem.dataItem.key, edges[0].key);
    });
});

QUnit.module('ClientSideEvents.requestOperation', {
    beforeEach: function() {
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        this.clock.restore();
        this.clock.reset();
    }
}, () => {
    test('requestOperation arguments', function(assert) {
        const $element = $('#diagram').dxDiagram({});
        const instance = $element.dxDiagram('instance');
        const operationCount = 10;
        let count = 0;
        for(const key in DiagramModelOperation) {
            if(Object.prototype.hasOwnProperty.call(DiagramModelOperation, key)) { count++; }
        }
        assert.equal(count, operationCount * 2);

        for(let i = 0; i < operationCount - 1; i++) {
            const e = instance._getRequestOperationEventArgs(i, { allowed: true });
            assert.notEqual(e.operation, undefined);
            assert.notEqual(e.args, undefined);
            assert.notEqual(e.allowed, undefined);
        }
    });
    test('requestOperation on bound diagram', function(assert) {
        const onRequestOperation = sinon.spy(function(e) { e.allowed = false; });
        const nodes = [
            { key: '123', text: 'mytext', foo: 'bar' },
            { key: '345', text: 'myconnector' }
        ];
        const edges = [
            { key: '1', from: '123', to: '345' }
        ];
        const $element = $('#diagram').dxDiagram({
            onRequestOperation: onRequestOperation,
            nodes: {
                dataSource: nodes,
                keyExpr: 'key',
                textExpr: 'text'
            },
            edges: {
                dataSource: edges,
                keyExpr: 'key',
                fromKey: 'from',
                toKey: 'to'
            }
        });
        const instance = $element.dxDiagram('instance');
        let callCount = 0;
        assert.equal(instance._diagramInstance.model.items.length, 3);
        assert.equal(onRequestOperation.getCalls().length, callCount);

        instance._diagramInstance.selection.set(['0']);
        instance._diagramInstance.commandManager.getCommand(DiagramCommand.Delete).execute();
        assert.equal(onRequestOperation.getCalls().length, ++callCount);
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['operation'], 'deleteShape');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['args'].shape.id, '0');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['allowed'], false);
        assert.equal(instance._diagramInstance.model.items.length, 3);

        instance._diagramInstance.selection.set(['2']);
        instance._diagramInstance.commandManager.getCommand(DiagramCommand.Delete).execute();
        assert.equal(onRequestOperation.getCalls().length, ++callCount);
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['operation'], 'deleteConnector');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['args'].connector.id, '2');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['allowed'], false);
        assert.equal(instance._diagramInstance.model.items.length, 3);

        instance._diagramInstance.selection.set(['0']);
        instance._diagramInstance.commandManager.getCommand(DiagramCommand.Copy).execute();
        instance._diagramInstance.commandManager.getCommand(DiagramCommand.Paste).execute();
        assert.equal(onRequestOperation.getCalls().length, ++callCount);
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['operation'], 'addShape');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['args'].shape.id, '3');
        assert.equal(onRequestOperation.getCall(callCount - 1).args[0]['allowed'], false);
        assert.equal(instance._diagramInstance.model.items.length, 3);
    });
});

