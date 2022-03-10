import objectHash from 'object-hash';
import log from './../log.js';
import { hotkeys } from '../utils';

import measurementTools from '../../../../extensions/cornerstone/src/utils/measurementServiceMappings/constants/supportedTools';

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {Object} commandOptions - Command options
 * @property {String} label - Display name for hotkey
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 */

import axios from "axios";
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const nlApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.includes("http://localhost") : true,
});

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

const csrftoken = getCookie('csrftoken');
console.log("KEVIN TOKEN 1");
console.log(csrftoken);

export class HotkeysManager {
  constructor(commandsManager, servicesManager) {
    this.hotkeyDefinitions = {};
    this.hotkeyDefaults = [];
    this.isEnabled = true;

    if (!commandsManager) {
      throw new Error(
        'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
      );
    }

    this._servicesManager = servicesManager;
    this._commandsManager = commandsManager;
  }

  /**
   * Exposes Mousetrap.js's `.record` method, added by the record plugin.
   *
   * @param {*} event
   */
  record(event) {
    return hotkeys.record(event);
  }

  /**
   * Disables all hotkeys. Hotkeys added while disabled will not listen for
   * input.
   */
  disable() {
    this.isEnabled = false;
    hotkeys.pause();
  }

  /**
   * Enables all hotkeys.
   */
  enable() {
    this.isEnabled = true;
    hotkeys.unpause();
  }

  /**
   * Registers a list of hotkeydefinitions.
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  setHotkeys(hotkeyDefinitions = []) {
    try {
      const definitions = this.getValidDefinitions(hotkeyDefinitions);
      definitions.forEach(definition => this.registerHotkeys(definition));
      this.saveHotkeys(definitions);
    } catch (error) {
      const { UINotificationService } = this._servicesManager.services;
      UINotificationService.show({
        title: 'Hotkeys Manager',
        message: 'Error while setting hotkeys',
        type: 'error',
      });
    }
  }

  async saveHotkeys(hotkeyDefinitions = []) {
    try {
      const hotKeysResponse = nlApi.post("/api/hotkeys/", {
        params: {
          hot_keys: hotkeyDefinitions,
        }}
      );
      console.log("KEVIN RESPONSE");
      console.log(hotKeysResponse);
      if(hotKeysResponse.status !== 201){
        throw new Error(
          'Unable to save hotkeys'
        );
      }
    } catch (error) {
      const { UINotificationService } = this._servicesManager.services;
      console.log("ERROR MESSAGE KEVIN");
      console.log(error);
      UINotificationService.show({
        title: 'Hotkeys Manager',
        message: 'Error while saving hotkeys',
        type: 'error',
      });
    }
  }

  async updateHotkeys(hotkeyDefinitions = []) {
    try {
      const hotKeysResponse = nlApi.put("/api/hotkeys/$self/", {
        params: {
          hot_keys: hotkeyDefinitions
        }}
      );
      if(hotKeysResponse.status !== 200){
        throw new Error(
          'Unable to update hotkeys'
        );
      }
    } catch (error) {
      const { UINotificationService } = this._servicesManager.services;
      UINotificationService.show({
        title: 'Hotkeys Manager',
        message: 'Error while updating hotkeys',
        type: 'error',
      });
    }
  }

  /**
   * Set default hotkey bindings. These
   * values are used in `this.restoreDefaultBindings`.
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  setDefaultHotKeys(hotkeyDefinitions = []) {
    const definitions = this.getValidDefinitions(hotkeyDefinitions);
    this.hotkeyDefaults = definitions;
  }

  /**
   * Take hotkey definitions that can be an array or object and make sure that it
   * returns an array of hotkeys
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  getValidDefinitions(hotkeyDefinitions) {
    const definitions = Array.isArray(hotkeyDefinitions)
      ? [...hotkeyDefinitions]
      : this._parseToArrayLike(hotkeyDefinitions);

    return definitions;
  }

  /**
   * Take hotkey definitions that can be an array and make sure that it
   * returns an object of hotkeys definitions
   *
   * @param {HotkeyDefinition[]} [hotkeyDefinitions=[]] Contains hotkeys definitions
   * @returns {Object}
   */
  getValidHotkeyDefinitions(hotkeyDefinitions) {
    const definitions = this.getValidDefinitions(hotkeyDefinitions);
    const objectDefinitions = {};
    definitions.forEach(definition => {
      const { commandName, commandOptions } = definition;
      const commandHash = objectHash({ commandName, commandOptions });
      objectDefinitions[commandHash] = definition;
    });
    return objectDefinitions;
  }

  /**
   * It parses given object containing hotkeyDefinition to array like.
   * Each property of given object will be mapped to an object of an array. And its property name will be the value of a property named as commandName
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions={}] Contains hotkeys definitions
   * @returns {HotkeyDefinition[]}
   */
  _parseToArrayLike(hotkeyDefinitionsObj = {}) {
    const copy = { ...hotkeyDefinitionsObj };
    return Object.entries(copy).map(entryValue =>
      this._parseToHotKeyObj(entryValue[0], entryValue[1])
    );
  }

  /**
   * Return HotkeyDefinition object like based on given property name and property value
   * @param {string} propertyName property name of hotkey definition object
   * @param {object} propertyValue property value of hotkey definition object
   *
   * @example
   *
   * const hotKeyObj = {hotKeyDefA: {keys:[],....}}
   *
   * const parsed = _parseToHotKeyObj(Object.keys(hotKeyDefA)[0], hotKeyObj[hotKeyDefA]);
   *  {
   *   commandName: hotKeyDefA,
   *   keys: [],
   *   ....
   *  }
   *
   */
  _parseToHotKeyObj(propertyName, propertyValue) {
    return {
      commandName: propertyName,
      ...propertyValue,
    };
  }

  /**
   * (unbinds and) binds the specified command to one or more key combinations.
   * When a hotkey combination is triggered, the command name and active contexts
   * are used to locate the correct command to call.
   *
   * @param {HotkeyDefinition} command
   * @param {String} extension
   * @returns {undefined}
   */
  registerHotkeys(
    { commandName, commandOptions = {}, keys, label, isEditable } = {},
    extension
  ) {
    if (!commandName) {
      throw new Error(`No command was defined for hotkey "${keys}"`);
    }

    const commandHash = objectHash({ commandName, commandOptions });
    const options = Object.keys(commandOptions).length
      ? JSON.stringify(commandOptions)
      : 'no';
    const previouslyRegisteredDefinition = this.hotkeyDefinitions[commandHash];

    if (previouslyRegisteredDefinition) {
      const previouslyRegisteredKeys = previouslyRegisteredDefinition.keys;
      this._unbindHotkeys(commandName, previouslyRegisteredKeys);
      log.info(
        `[hotkeys] Unbinding ${commandName} with ${options} options from ${previouslyRegisteredKeys}`
      );
    }

    // Set definition & bind
    this.hotkeyDefinitions[commandHash] = {
      commandName,
      commandOptions,
      keys,
      label,
      isEditable,
    };
    this._bindHotkeys(commandName, commandOptions, keys);
    log.info(
      `[hotkeys] Binding ${commandName} with ${options} options to ${keys}`
    );
  }

  /**
   * Uses most recent
   *
   * @returns {undefined}
   */
  restoreDefaultBindings() {
    this.setHotkeys(this.hotkeyDefaults);
  }

  /**
   *
   */
  destroy() {
    this.hotkeyDefaults = [];
    this.hotkeyDefinitions = {};
    hotkeys.reset();
  }

  /**
   * Binds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the command to trigger when hotkeys are used
   * @param {string[]} keys - One or more key combinations that should trigger command
   * @returns {undefined}
   */
  _bindHotkeys(commandName, commandOptions = {}, keys) {
    const isKeyDefined = keys === '' || keys === undefined;
    if (isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    const combinedKeys = isKeyArray ? keys.join('+') : keys;

    hotkeys.bind(combinedKeys, evt => {
      evt.preventDefault();
      evt.stopPropagation();

      if (commandName === 'setToolActive') {
        const { ToolBarService } = this._servicesManager.services;
        const itemId = commandOptions.toolName;
        if (measurementTools.includes(itemId)) {
          ToolBarService.triggerHotkey(itemId);
        } else {
          ToolBarService.recordInteraction({
            interactionType: 'tool',
            groupId: 'primary',
            itemId,
            commandOptions,
          });
        }
      }

      this._commandsManager.runCommand(commandName, { evt, ...commandOptions });
    });
  }

  /**
   * unbinds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the previously bound command
   * @param {string[]} keys - One or more sets of previously bound keys
   * @returns {undefined}
   */
  _unbindHotkeys(commandName, keys) {
    const isKeyDefined = keys !== '' && keys !== undefined;
    if (!isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      const combinedKeys = keys.join('+');
      this._unbindHotkeys(commandName, combinedKeys);
      return;
    }

    hotkeys.unbind(keys);
  }
}

export default HotkeysManager;

// Commands Contexts:

// --> Name and Priority
// GLOBAL: 0
// VIEWER::CORNERSTONE: 1
// VIEWER::VTK: 1
