// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
"use strict";
import * as path from "path";
import * as vscode from "vscode";
import player, { PlayerConfig } from "./player";
import debounce = require("lodash.debounce");

let listener: EditorListener;
let isActive: boolean;
let isNotArrowKey: boolean;
let config: PlayerConfig = {
  macVol: 1,
  winVol: 100,
  linuxVol: 100,
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Initializing "overwatch-sounds" extension');

  // is the extension activated? yes by default.
  isActive = context.globalState.get("overwatch_sounds", true);
  config.macVol = context.globalState.get("mac_volume", 1);
  config.winVol = context.globalState.get("win_volume", 100);
  config.linuxVol = context.globalState.get("linux_volume", 1);

  // to avoid multiple different instances
  listener = listener || new EditorListener(player);

  vscode.commands.registerCommand("overwatch_sounds.enable", () => {
    if (!isActive) {
      context.globalState.update("overwatch_sounds", true);
      isActive = true;
      vscode.window.showInformationMessage(
        "Overwatch Sounds extension enabled"
      );
    } else {
      vscode.window.showWarningMessage(
        "Overwatch Sounds extension is already enabled"
      );
    }
  });
  vscode.commands.registerCommand("overwatch_sounds.disable", () => {
    if (isActive) {
      context.globalState.update("overwatch_sounds", false);
      isActive = false;
      vscode.window.showInformationMessage(
        "Overwatch Sounds extension disabled"
      );
    } else {
      vscode.window.showWarningMessage(
        "Overwatch Sounds extension is already disabled"
      );
    }
  });
  vscode.commands.registerCommand("overwatch_sounds.volumeUp", () => {
    let newVol = null;

    switch (process.platform) {
      case "darwin":
        config.macVol += 1;

        if (config.macVol > 10) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at maximum volume"
          );
          config.macVol = 10;
        }

        newVol = config.macVol;
        context.globalState.update("mac_volume", newVol);
        break;

      case "win32":
        config.winVol += 10;

        if (config.winVol > 100) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at maximum volume"
          );
          config.winVol = 100;
        }

        newVol = config.winVol;
        context.globalState.update("win_volume", newVol);
        break;

      case "linux":
        config.linuxVol += 1;

        if (config.linuxVol > 10) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at maximum volume"
          );
          config.linuxVol = 10;
        }

        newVol = config.linuxVol;
        context.globalState.update("linux_volume", newVol);
        break;

      default:
        newVol = 0;
        break;
    }

    vscode.window.showInformationMessage(
      "Overwatch Sounds volume raised: " + newVol
    );
  });
  vscode.commands.registerCommand("overwatch_sounds.volumeDown", () => {
    let newVol = null;

    switch (process.platform) {
      case "darwin":
        config.macVol -= 1;

        if (config.macVol < 1) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at minimum volume"
          );
          config.macVol = 1;
        }

        newVol = config.macVol;
        context.globalState.update("mac_volume", newVol);
        break;

      case "win32":
        config.winVol -= 10;

        if (config.winVol < 10) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at minimum volume"
          );
          config.winVol = 10;
        }

        newVol = config.winVol;
        context.globalState.update("win_volume", newVol);
        break;

      case "linux":
        config.linuxVol -= 1;

        if (config.linuxVol < 1) {
          vscode.window.showWarningMessage(
            "Overwatch Sounds already at minimum volume"
          );
          config.linuxVol = 1;
        }

        newVol = config.linuxVol;
        context.globalState.update("linux_volume", newVol);
        break;

      default:
        newVol = 0;
        break;
    }

    vscode.window.showInformationMessage(
      "Overwatch Sounds volume lowered: " + newVol
    );
  });

  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(listener);
}

// this method is called when your extension is deactivated
export function deactivate() {}

/**
 * Listen to editor changes and play a sound when a key is pressed.
 */
export class EditorListener {
  private _disposable: vscode.Disposable;
  private _subscriptions: vscode.Disposable[] = [];
  private _basePath: string = path.join(__dirname, "..");

  // Audio files
  private _spaceAudio: string = path.join(
    this._basePath,
    "sounds",
    "headshot.wav"
  );
  private _deleteAudio: string = path.join(
    this._basePath,
    "sounds",
    "hitmarker.wav"
  );
  private _otherKeysAudio: string = path.join(
    this._basePath,
    "sounds",
    "hitmarker.wav"
  );
  private _cutAudio: string = path.join(this._basePath, "sounds", "cut.wav");
  private _pasteAudio: string = path.join(
    this._basePath,
    "sounds",
    "elimination.wav"
  );
  private _enterAudio: string = path.join(
    this._basePath,
    "sounds",
    "elimination.wav"
  );
  private _tabAudio: string = path.join(this._basePath, "sounds", "tab.wav");
  private _arrowsAudio: string = path.join(
    this._basePath,
    "sounds",
    "hitmarker.wav"
  );

  constructor(private player: any) {
    isNotArrowKey = false;

    vscode.workspace.onDidChangeTextDocument(
      this._keystrokeCallback,
      this,
      this._subscriptions
    );
    vscode.window.onDidChangeTextEditorSelection(
      this._arrowKeysCallback,
      this,
      this._subscriptions
    );
    this._disposable = vscode.Disposable.from(...this._subscriptions);
    this.player = {
      play: (filePath: string) => player.play(filePath, config),
    };
  }

  _keystrokeCallback = (event: vscode.TextDocumentChangeEvent) => {
    //debounce(
    if (!isActive) {
      return;
    }

    let activeDocument =
      vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;
    if (
      event.document !== activeDocument ||
      event.contentChanges.length === 0
    ) {
      return;
    }

    isNotArrowKey = true;
    let pressedKey = event.contentChanges[0].text;

    switch (pressedKey) {
      case "":
        if (event.contentChanges[0].rangeLength === 1) {
          // backspace or delete pressed
          this.player.play(this._deleteAudio);
        } else {
          // text cut
          this.player.play(this._cutAudio);
        }
        break;

      case " ":
        // space bar pressed
        this.player.play(this._spaceAudio);
        break;

      case "\n":
        // enter pressed
        this.player.play(this._enterAudio);
        break;

      case "\t":
      case "  ":
      case "    ":
        // tab pressed
        this.player.play(this._tabAudio);
        break;

      default:
        let textLength = pressedKey.trim().length;

        switch (textLength) {
          case 0:
            // user hit Enter while indented
            this.player.play(this._enterAudio);
            break;

          case 1:
            // it's a regular character
            this.player.play(this._otherKeysAudio);
            break;

          default:
            // text pasted
            this.player.play(this._pasteAudio);
            break;
        }
        break;
    }
  };
  //     100,
  //     { leading: true }
  //   );

  _arrowKeysCallback = debounce(
    (event: vscode.TextEditorSelectionChangeEvent) => {
      if (!isActive) {
        return;
      }

      // current editor
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document !== event.textEditor.document) {
        return;
      }

      // check if there is no selection
      if (editor.selection.isEmpty && isNotArrowKey === false) {
        this.player.play(this._arrowsAudio);
      } else {
        isNotArrowKey = false;
      }
    },
    100,
    { leading: true }
  );

  dispose() {
    this._disposable.dispose();
  }
}
