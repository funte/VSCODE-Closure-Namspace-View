import fs from 'fs';
import pig from 'slim-pig';
import vscode from 'vscode';

import { ClosureNamespaceProvider, NamespaceItem } from './ClosureNamespaceProvider';

export function activate(context: vscode.ExtensionContext) {
	const workspaceRoot =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;
	if (!workspaceRoot) { return; }

	const base: string = vscode.workspace.getConfiguration().get('base')
		|| 'node_modules/google-closure-library/closure/goog/base.js';
	const sources: string[] = vscode.workspace.getConfiguration().get('sources')
		|| ['src/**/*.js'];

	const viewProvider = new ClosureNamespaceProvider(workspaceRoot, base, sources);
	vscode.window.createTreeView('namespaceView', {
		treeDataProvider: viewProvider
	});
	vscode.commands.registerCommand('scan', () => {
		viewProvider.refresh();
	});
	vscode.commands.registerCommand('jump', (namespace: NamespaceItem) => {
		const file = pig.pattern.resolvePattern(namespace.file, workspaceRoot);
		if (fs.existsSync(file)) {
			const fileUri = vscode.Uri.parse('file:///' + file);
			vscode.workspace.openTextDocument(fileUri).then(doc => {
				vscode.window.showTextDocument(doc);
			});
		}
	});
	vscode.commands.registerCommand('copy', (namespace: NamespaceItem) => {
		vscode.env.clipboard.writeText(namespace.namespace);
	});
	vscode.workspace.onDidChangeTextDocument(e => {
		viewProvider.refresh(e.document.uri.fsPath);
	});
	vscode.workspace.onDidRenameFiles(e => {
		viewProvider.refresh();
	});
	vscode.workspace.onDidCreateFiles(e => {
		viewProvider.refresh();
	});
	vscode.workspace.onDidDeleteFiles(e => {
		viewProvider.refresh();
	});
	vscode.workspace.onDidChangeConfiguration(e => {
		const base: string = vscode.workspace.getConfiguration().get('base')
			|| 'node_modules/google-closure-library/closure/goog/base.js';
		const sources: string[] = vscode.workspace.getConfiguration().get('sources')
			|| ['src/**/*.js'];
		viewProvider.initClosureTree(base, sources);
		viewProvider.refresh();
	});
}

export function deactivate() { }
