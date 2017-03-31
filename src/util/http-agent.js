/* @flow */

import * as url from 'url';
import {Agent as HttpAgent} from 'http';
import {Agent as HttpsAgent} from 'https';
import {__extends} from 'tslib';

const NPM_REGISTRY_HOST = /^https?:\/\/registry.npmjs.org(\:80)?/i;
const _customAgentClasses = {};

export function _extendAgentClassForRegistry(registry: string): Function {

  const base = (/^https/i).test(registry) ? HttpsAgent : HttpAgent;

  // TODOuse ForeverAgent in node 0.10- only

  function CustomYarnAgent(...args: any[]) {
    base.call(this, ...args);
  }
  __extends(CustomYarnAgent, base);
  Object.defineProperty(CustomYarnAgent, 'name', {writable: true});
  CustomYarnAgent.name = `AgentFor:${registry}`;
  Object.defineProperty(CustomYarnAgent, 'name', {writable: false});

  return CustomYarnAgent;

}

export function getAgentClassForUrl(packageUrl: string): Function|null {

    // Default npm registry? Let request figure it out
  if (NPM_REGISTRY_HOST.test(packageUrl)) {
    return null;
  }

  const urlObject = url.parse(packageUrl);
  const registry = urlObject.protocol + '//' +
      (urlObject.auth ? urlObject.auth + '@' : '') +
      urlObject.host;

  if (!_customAgentClasses[registry]) {
    _customAgentClasses[registry] = _extendAgentClassForRegistry(registry);
  }

  return _customAgentClasses[registry];

}
