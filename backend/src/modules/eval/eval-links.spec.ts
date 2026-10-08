import { EvalLinksService } from './eval-links.service';
import { lookup } from 'node:dns/promises';
jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
describe('eval public link observations', () => {
  beforeEach(() =>
    (lookup as jest.Mock).mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ]),
  );
  afterEach(() => jest.restoreAllMocks());
  const service = (hosts = '') =>
    new EvalLinksService({ get: () => hosts } as any);
  test('without trusted hosts, unknown links fail closed without HTTP', async () => {
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network must not run'));
    expect(await service().snapshot('[docs](https://example.org)')).toEqual({
      'https://example.org': false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  test('records a public allowed host result for deterministic replay', async () => {
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    expect(
      await service('example.org').snapshot('[docs](https://example.org)'),
    ).toEqual({ 'https://example.org': true });
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'HEAD',
      redirect: 'manual',
    });
  });
  test('IP literals, URL credentials and redirect to an untrusted host never pass', async () => {
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: false,
        status: 302,
        headers: new Headers({ location: 'http://127.0.0.1/private' }),
      } as Response);
    expect(
      await service('example.org,127.0.0.1').snapshot(
        '[a](http://127.0.0.1/private) [b](https://secret@example.org) [c](https://example.org)',
      ),
    ).toEqual({
      'http://127.0.0.1/private': false,
      'https://secret@example.org': false,
      'https://example.org': false,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  test.each([
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '100.64.1.1',
    '::1',
    'fc00::1',
    '::ffff:127.0.0.1',
  ])('trusted hostname resolving to %s never reaches HTTP', async (address) => {
    (lookup as jest.Mock).mockResolvedValue([
      { address, family: address.includes(':') ? 6 : 4 },
    ]);
    const fetch = jest.spyOn(globalThis, 'fetch');
    expect(
      await service('example.org').snapshot('[docs](https://example.org)'),
    ).toEqual({ 'https://example.org': false });
    expect(fetch).not.toHaveBeenCalled();
  });
});
