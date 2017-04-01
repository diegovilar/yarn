/* @flow */

import * as url from 'url';
import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';
import {__extends} from 'tslib';

/**
 * How we identify the default NPM registry
 */
const NPM_REGISTRY_HOST = /^https?:\/\/registry.npmjs.org(\:80)?/i;

/**
 * Our classes cache repository
 */
const _customAgentClasses = {};

/**
 * Gets an unique agent class for custom registries
 *
 * This function will return an agent class exclusive for the registry
 * where the package is being fetched from.
 *
 * It will cache classes and reuse them for ocurrences of the same registry
 * so request will in turn reuse them on its pool every time such registry
 * is being used.
 *
 * We only need this for custom registries, so it will return null in case
 * the package is being fetched from the default NPM registry, so request
 * will use its own agents.
 *
 * @param {*} packageUrl The package URL on the registry
 */
export function getAgentClassForUrl(packageUrl: string): Function|null {

  // Default npm registry? Let request use its own agents
  if (NPM_REGISTRY_HOST.test(packageUrl)) {
    return null;
  }

  const urlObject = url.parse(packageUrl);
  const registryUrl = urlObject.protocol + '//' +
      (urlObject.auth ? urlObject.auth + '@' : '') +
      urlObject.host;

  // Create (and cache it) a new agent class for this registry, if one
  // doesn`t already exist
  if (!_customAgentClasses[registryUrl]) {
    _customAgentClasses[registryUrl] = _extendAgentClassForRegistry(registryUrl);
  }

  return _customAgentClasses[registryUrl];

}

/**
 * Extends either HttpAgent of HttpsAgent for the given registry
 *
 * @param {*} registryUrl The registry URL for whom we want a custom agent
 */
export function _extendAgentClassForRegistry(registryUrl: string): Function {

  const base = (/^https/i).test(registryUrl) ? HttpsAgent : HttpAgent;

  // Our custom agent class, a sub class of the selected base above
  function CustomYarnAgent(...args: any[]) {
    base.call(this, ...args);
  }
  __extends(CustomYarnAgent, base);

  // request uses the agent constructor name to compound its pool key,
  // so we need to make it unique for every registry
  Object.defineProperty(CustomYarnAgent, 'name', {writable: true});
  CustomYarnAgent.name = `AgentFor:${registryUrl}`;
  Object.defineProperty(CustomYarnAgent, 'name', {writable: false});

  return CustomYarnAgent;

}
