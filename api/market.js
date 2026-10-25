import { createApi } from './_lib/core.js';
import { handleNodeRequest } from './_lib/node-adapter.js';

const api = createApi();

export default function handler(req, res) {
  return handleNodeRequest(api, req, res);
}
