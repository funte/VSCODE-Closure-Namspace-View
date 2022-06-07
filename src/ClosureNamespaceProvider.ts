import { NamespaceObject } from 'google-closure-library-webpack-plugin/dist/closure/ClosureTree';
import { ClosureTree } from 'google-closure-library-webpack-plugin/dist/closure/ClosureTree';
import { Environment } from 'google-closure-library-webpack-plugin/dist/Environment';
import path from 'path';
import pig from 'slim-pig';
import vscode from 'vscode';

export class NamespaceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly namespace: string,
    public readonly file: string
  ) {
    super(label, collapsibleState);
    this.description = this.file;
    this.tooltip = `${this.namespace} at ${this.file}`;
  }

  contextValue = 'NamespaceItem';
}

export class ClosureNamespaceProvider implements vscode.TreeDataProvider<NamespaceItem> {
  public closureTree: ClosureTree;

  private _onDidChangeTreeData: vscode.EventEmitter<NamespaceItem | undefined | null | void> = new vscode.EventEmitter<NamespaceItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<NamespaceItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string, base: string, sources: string[]) {
    this.closureTree = new ClosureTree({
      base,
      sources,
      env: new Environment({ context: this.workspaceRoot }),
      alert: vscode.window.showInformationMessage
    } as any);
  }

  initClosureTree(base: string, sources: string[]) {
    this.closureTree = new ClosureTree({
      base,
      sources,
      env: new Environment({ context: this.workspaceRoot })
    });
  }

  getTreeItem(element: NamespaceItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NamespaceItem): Thenable<NamespaceItem[]> {
    const genElement = (namespaceObj: NamespaceObject): NamespaceItem | null => {
      const state = namespaceObj.subs.size > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;
      const closureModule = this.closureTree.getModule(namespaceObj.fullname);
      if (!closureModule) {
        // throw new Error(`Unknow namespace ${namespaceObj.fullname}.`);
        return null;
      }
      const file = pig.pattern.unixlike(
        path.relative(this.workspaceRoot, closureModule.request)
      );
      return new NamespaceItem(namespaceObj.name, state, namespaceObj.fullname, file);
    };

    if (element) {
      const subs: NamespaceItem[] = [];
      Array.from(
        this.closureTree.getNamespaceObject(element.namespace)?.subs.values() || []
      ).forEach(namespaceObj => {
        const newele = genElement(namespaceObj);
        if (newele) {
          subs.push(newele);
        }
      });
      return Promise.resolve(subs);
    } else {
      // Create top items from all root namespaces.
      const tops: NamespaceItem[] = [];
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

  refresh(files?: string | string[]): void {
    // Scan the whole Closure tree.
    this.closureTree.scan(files);
    this._onDidChangeTreeData.fire();
  }
}
