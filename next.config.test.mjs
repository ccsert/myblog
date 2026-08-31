import assert from 'node:assert/strict';
import { hostname, networkInterfaces } from 'node:os';
import test from 'node:test';

import nextConfig from './next.config.ts';

test('开发源白名单覆盖本机 hostname 与每个网卡地址', () => {
  const allowedOrigins = new Set(nextConfig.allowedDevOrigins);

  assert.ok(allowedOrigins.has(hostname()));

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      assert.ok(
        allowedOrigins.has(address.address),
        `缺少网卡地址 ${address.address}`,
      );
    }
  }
});

test('开发源白名单只包含 hostname，不误用带协议或端口的 URL', () => {
  for (const origin of nextConfig.allowedDevOrigins ?? []) {
    assert.doesNotMatch(origin, /^https?:\/\//);
    assert.doesNotMatch(origin, /^(?:[^:[\]]+|\[[^\]]+\]):\d+$/);
  }
});
