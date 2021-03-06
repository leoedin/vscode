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
const Api = require('./api');
const Auth = require('./auth');
const User = require('./user');
const Workspace = require('./workspace');

async function pickDeviceID(cloudURL, accessToken, ownerID, dgIDAssigned, dgIDUnAssigned) {
    let devices;
    try {
        devices = await Api.getDeviceList(cloudURL, accessToken, ownerID, dgIDAssigned, dgIDUnAssigned);
    } catch (err) {
        throw new User.DeviceListRetrieveError(err);
    }

    const display = [];
    devices.forEach((item) => {
        const onlineState = item.attributes.device_online ? 'online' : 'offline';
        const name = item.attributes.name === null ? 'noName' : item.attributes.name;
        display.push(`${item.id} ${onlineState} ${name}`);
    });

    if (display.length === 0) {
        throw new User.NoAvailableDevicesError();
    }

    const pick = await vscode.window.showQuickPick(
        display.map(label => ({ label })),
        {
            placeHolder: 'Select device ID',
            ignoreFocusOut: true,
            canPickMany: false,
        },
    );

    if (pick === undefined) {
        // Case, when Esc key was pressed.
        throw new User.UserInputCanceledError();
    }

    const regex = /(.*)\s(online|offline)\s(.*)/;
    const result = pick.label.match(regex);
    if (result == null) {
        throw Error('Bad regexp');
    }

    return result[1];
}
module.exports.pickDeviceID = pickDeviceID;

// Get agent URL related with device.
// The URL will be displayed in the pop-up message and copied to clipboard.
//
// Parameters:
//     none
//
// Returns:
//     none
function getAgentURLDialog() {
    Workspace.Data.getWorkspaceInfo()
        .then(cfg => Auth.authorize(cfg))
        .then(cfg => Workspace.validateDG(cfg))
        .then((cfg) => {
            this.cloudURL = cfg.cloudURL;
            this.accessToken = cfg.accessToken;
            this.ownerId = cfg.ownerId;
            this.dg = cfg.deviceGroupId;
        })
        .then(() => pickDeviceID(this.cloudURL, this.accessToken, this.ownerId, this.dg, undefined))
        .then(deviceID => Api.getAgentURL(this.cloudURL, this.accessToken, deviceID))
        .then((agentUrl) => {
            vscode.env.clipboard.writeText(agentUrl);
            vscode.window.showInformationMessage(agentUrl);
        })
        .catch(err => User.processError(err));
}
module.exports.getAgentURLDialog = getAgentURLDialog;

// Add device to DG using device ID.
//
// Parameters:
//     none
//
// Returns:
//     none
function addDeviceToDGDialog() {
    Workspace.Data.getWorkspaceInfo()
        .then(cfg => Auth.authorize(cfg))
        .then(cfg => Workspace.validateDG(cfg))
        .then((cfg) => {
            this.cloudURL = cfg.cloudURL;
            this.accessToken = cfg.accessToken;
            this.ownerId = cfg.ownerId;
            this.dg = cfg.deviceGroupId;
        })
        .then(() => pickDeviceID(this.cloudURL, this.accessToken, this.ownerId, undefined, this.dg))
        .then(deviceID => Api.addDeviceToDG(this.cloudURL, this.accessToken, this.dg, deviceID))
        .then(() => vscode.window.showInformationMessage('The device is added to DG'))
        .catch(err => User.processError(err));
}
module.exports.addDeviceToDGDialog = addDeviceToDGDialog;

// Remove device from DG using device ID.
//
// Parameters:
//     none
//
// Returns:
//     none
function removeDeviceFromDGDialog() {
    Workspace.Data.getWorkspaceInfo()
        .then(cfg => Auth.authorize(cfg))
        .then(cfg => Workspace.validateDG(cfg))
        .then((cfg) => {
            this.cloudURL = cfg.cloudURL;
            this.accessToken = cfg.accessToken;
            this.ownerId = cfg.ownerId;
            this.dg = cfg.deviceGroupId;
        })
        .then(() => pickDeviceID(this.cloudURL, this.accessToken, this.ownerId, this.dg, undefined))
        .then(deviceID => Api.removeDeviceFromDG(this.cloudURL, this.accessToken, this.dg, deviceID))
        .then(() => vscode.window.showInformationMessage('The device is removed from DG'))
        .catch(err => User.processError(err));
}
module.exports.removeDeviceFromDGDialog = removeDeviceFromDGDialog;
