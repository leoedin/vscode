// MIT License
//
// Copyright 2018 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.


const vscode = require('vscode');
const ImpCentralApi = require('imp-central-api');
const AuthHelper = require('./auth');

/*
 * Here we will have all logic related with logstreams manipulation.
 * Currently the class functions do nothing, but the appropriate command is exported.
 * The command uses vscode outputChannel api to print hello-like message for now.
 */

// Global variable to store LogStream/outputChannel state between extension commands calls.
// NOTE: Possibly could not be exported.
const logStreamState = {
    logStreamID: undefined,
    outputChannel: undefined,
    isAdded: false,
};
module.exports.logStreamState = logStreamState;

class LogStreamHelper {
    logMsg(message) {
        this.channel.appendLine(message);
    }

    logState(message) {
        this.channel.appendLine(message);
    }

    addDevice(accessToken) {
        vscode.window.showInputBox({ prompt: 'Enter device id:' })
            .then((deviceid) => {
                if (!deviceid) {
                    vscode.window.showErrorMessage('The device ID is empty');
                    return;
                }

                this.channel = vscode.window.createOutputChannel(`device ID = ${deviceid}`);
                this.channel.show(true);

                let logStreamID;
                const impCentralApi = new ImpCentralApi();
                impCentralApi.auth.accessToken = accessToken;
                impCentralApi.logStreams.create(this.logMsg.bind(this), this.logState.bind(this))
                    .then((logStream) => {
                        logStreamID = logStream.data.id;
                        impCentralApi.logStreams.addDevice(logStreamID, deviceid)
                            .then(() => {
                                logStreamState.isAdded = true;
                            }, (err) => {
                                vscode.window.showErrorMessage(`The device ${deviceid} can not be added: ${err}`);
                            });
                    });
            });
    }

    // Add device to LogStream and send it's logs to the outputChannel.
    //
    // Parameters:
    //     none
    addDeviceDialog() {
        if (logStreamState.isAdded) {
            vscode.window.showErrorMessage('Some device already added, cannot add more for now.');
        } else {
            AuthHelper.authorize()
                .then(this.addDevice.bind(this), (err) => {
                    vscode.window.showErrorMessage(`Can not add device: ${err}`);
                });
        }
    }
}
module.exports.LogStreamHelper = LogStreamHelper;
