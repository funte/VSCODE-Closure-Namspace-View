"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs_1 = __importDefault(require("fs"));
const slim_pig_1 = __importDefault(require("slim-pig"));
const vscode_1 = __importDefault(require("vscode"));
const ClosureNamespaceProvider_1 = require("./ClosureNamespaceProvider");
function activate(context) {
    const workspaceRoot = vscode_1.default.workspace.workspaceFolders && vscode_1.default.workspace.workspaceFolders.length > 0
        ? vscode_1.default.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    if (!workspaceRoot) {
        return;
    }
    const base = vscode_1.default.workspace.getConfiguration().get('base')
        || 'node_modules/google-closure-library/closure/goog/base.js';
    const sources = vscode_1.default.workspace.getConfiguration().get('sources')
        || ['src/**/*.js'];
    const viewProvider = new ClosureNamespaceProvider_1.ClosureNamespaceProvider(workspaceRoot, base, sources);
    vscode_1.default.window.createTreeView('namespaceView', {
        treeDataProvider: viewProvider
    });
    vscode_1.default.commands.registerCommand('scan', () => {
        viewProvider.refresh();
    });
    vscode_1.default.commands.registerCommand('jump', (namespace) => {
        const file = slim_pig_1.default.pattern.resolvePattern(namespace.file, workspaceRoot);
        if (fs_1.default.existsSync(file)) {
            const fileUri = vscode_1.default.Uri.parse('file:///' + file);
            vscode_1.default.workspace.openTextDocument(fileUri).then(doc => {
                vscode_1.default.window.showTextDocument(doc);
            });
        }
    });
    vscode_1.default.commands.registerCommand('copy', (namespace) => {
        vscode_1.default.env.clipboard.writeText(namespace.namespace);
    });
    vscode_1.default.workspace.onDidChangeTextDocument(e => {
        viewProvider.refresh();
    });
    vscode_1.default.workspace.onDidRenameFiles(e => {
        viewProvider.refresh();
    });
    vscode_1.default.workspace.onDidCreateFiles(e => {
        viewProvider.refresh();
    });
    vscode_1.default.workspace.onDidDeleteFiles(e => {
        viewProvider.refresh();
    });
    vscode_1.default.workspace.onDidChangeConfiguration(e => {
        const base = vscode_1.default.workspace.getConfiguration().get('base')
            || 'node_modules/google-closure-library/closure/goog/base.js';
        const sources = vscode_1.default.workspace.getConfiguration().get('sources')
            || ['src/**/*.js'];
        viewProvider.initClosureTree(base, sources);
        viewProvider.refresh();
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
