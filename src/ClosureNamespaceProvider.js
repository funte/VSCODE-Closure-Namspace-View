"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClosureNamespaceProvider = exports.NamespaceItem = void 0;
const ClosureTree_1 = require("google-closure-library-webpack-plugin/dist/closure/ClosureTree");
const Environment_1 = require("google-closure-library-webpack-plugin/dist/Environment");
const path_1 = __importDefault(require("path"));
const slim_pig_1 = __importDefault(require("slim-pig"));
const vscode_1 = __importDefault(require("vscode"));
class NamespaceItem extends vscode_1.default.TreeItem {
    constructor(label, collapsibleState, namespace, file) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.namespace = namespace;
        this.file = file;
        this.contextValue = 'NamespaceItem';
        this.description = this.file;
        this.tooltip = `${this.namespace} at ${this.file}`;
    }
}
exports.NamespaceItem = NamespaceItem;
class ClosureNamespaceProvider {
    constructor(workspaceRoot, base, sources) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode_1.default.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.closureTree = new ClosureTree_1.ClosureTree({
            base,
            sources,
            env: new Environment_1.Environment({ context: this.workspaceRoot })
        });
        console.log(Array.from(this.closureTree.namespaceToRequest.keys()));
    }
    initClosureTree(base, sources) {
        this.closureTree = new ClosureTree_1.ClosureTree({
            base,
            sources,
            env: new Environment_1.Environment({ context: this.workspaceRoot })
        });
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        // return Promise.resolve([]);
        var _a;
        const genElement = (namespaceObj) => {
            const state = namespaceObj.subs.size > 0
                ? vscode_1.default.TreeItemCollapsibleState.Collapsed
                : vscode_1.default.TreeItemCollapsibleState.None;
            const closureModule = this.closureTree.getModule(namespaceObj.fullname);
            if (!closureModule) {
                // throw new Error(`Unknow namespace ${namespaceObj.fullname}.`);
                return null;
            }
            const file = slim_pig_1.default.pattern.unixlike(path_1.default.relative(this.workspaceRoot, closureModule.request));
            return new NamespaceItem(namespaceObj.name, state, namespaceObj.fullname, file);
        };
        if (element) {
            const subs = [];
            Array.from(((_a = this.closureTree.getNamespaceObject(element.namespace)) === null || _a === void 0 ? void 0 : _a.subs.values()) || []).forEach(namespaceObj => {
                const newele = genElement(namespaceObj);
                if (newele) {
                    subs.push(newele);
                }
            });
            return Promise.resolve(subs);
        }
        else {
            // Create top items from all root namespaces.
            const tops = [];
            Array.from(this.closureTree.roots.subs.values())
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(namespaceObj => {
                const newele = genElement(namespaceObj);
                if (newele) {
                    tops.push(newele);
                }
            });
            return Promise.resolve(tops);
        }
    }
    refresh() {
        // Scan the whole Closure tree.
        this.closureTree.scan();
        this._onDidChangeTreeData.fire();
    }
}
exports.ClosureNamespaceProvider = ClosureNamespaceProvider;
