import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';
import type { SearchSchools } from '../src';
import App from '../demo/src/App';
import { liveSearch, parseSearchResponse, schoolPageUrl, directorySearchUrl } from '../demo/src/liveSearch';

// The demo's live data source. Every response here is a fixture (fictional schools); no test touches
// the network. Real searches are checked against the deployed API separately.
beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: false }); });
afterEach(() => { vi.useRealTimers(); });

const user = () => userEvent.setup({ delay: null });
const flush = async (ms = 0) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const options = () => screen.queryAllByRole('option');
const ORIGIN = 'https://www.skolosaka.co.za';

const RIVER = { id: 'f1c3a2b4-0000-4000-8000-000000000001', name: 'Fictional River Primary School', town: 'Riverbend', municipality: 'Greenhill', province: 'Limpopo', level: 'primary', verified: true };
const RIVER_2 = { ...RIVER, id: 'f1c3a2b4-0000-4000-8000-000000000002', town: 'Seawind', province: 'Eastern Cape', verified: false };
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('liveSearch', () => {
  it('calls the public API with the abort signal and no credentials, and keeps only public fields', async () => {
    const fetchImpl = vi.fn(async () => ok({ schools: [{ ...RIVER, principal_email: 'x@example.org' }], total: 1 }));
    const controller = new AbortController();
    const found = await liveSearch({ origin: ORIGIN, fetchImpl })('st john\'s & co', { signal: controller.signal });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${ORIGIN}/api/public/schools/search?q=st%20john's%20%26%20co`);
    expect(init.signal).toBe(controller.signal);
    expect(init.credentials).toBe('omit');
    expect(found).toEqual([RIVER]);
  });

  it('skips malformed schools and treats a malformed body as a failure, not as no results', () => {
    expect(parseSearchResponse({ schools: [null, 1, { id: '', name: 'x' }, { id: 'a' }, { id: 'b', name: 'B', verified: 'yes', town: 3 }] }))
      .toEqual([{ id: 'b', name: 'B', town: null, municipality: null, province: null, level: null, verified: false }]);
    for (const bad of [null, 'text', [], {}, { schools: 'many' }, { items: [RIVER] }]) expect(() => parseSearchResponse(bad)).toThrow();
  });

  it('throws on HTTP errors and unreadable answers', async () => {
    const signal = new AbortController().signal;
    await expect(liveSearch({ origin: ORIGIN, fetchImpl: async () => ok({ error: 'School search is unavailable right now.' }, 503) })('river', { signal }))
      .rejects.toThrow('School search is unavailable right now.');
    await expect(liveSearch({ origin: ORIGIN, fetchImpl: async () => new Response('<html>', { status: 502 }) })('river', { signal })).rejects.toThrow('HTTP 502');
    await expect(liveSearch({ origin: ORIGIN, fetchImpl: async () => new Response('not json', { status: 200 }) })('river', { signal })).rejects.toThrow();
    await expect(liveSearch({ origin: ORIGIN, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })('river', { signal })).rejects.toThrow('Failed to fetch');
  });

  it('builds website links for a school and for the directory search', () => {
    expect(schoolPageUrl(RIVER.id, ORIGIN)).toBe(`${ORIGIN}/school/${RIVER.id}`);
    expect(directorySearchUrl('sunny side', ORIGIN)).toBe(`${ORIGIN}/schools?q=sunny%20side`);
  });
});

describe('demo App', () => {
  function setup(searchLive: Mock<SearchSchools> = vi.fn<SearchSchools>(async (q: string) => [RIVER, RIVER_2].filter(s => s.name.toLowerCase().includes(q.toLowerCase())))) {
    const navigate = vi.fn();
    render(<App searchLive={searchLive} navigate={navigate} origin={ORIGIN} />);
    return { searchLive, navigate, input: () => screen.getByRole('combobox', { name: 'Search for a school' }) };
  }

  it('searches the live directory by default and shows the picked school with its website page', async () => {
    const u = user();
    const { searchLive, input } = setup();
    expect(screen.getByTestId('source-label')).toHaveTextContent('Live Skolo Saka school directory');
    expect(screen.queryByTestId('testing-panel')).toBeNull();
    await u.type(input(), 'fictional river');
    await flush(250);
    expect(searchLive).toHaveBeenLastCalledWith('fictional river', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(options()).toHaveLength(2);
    // Same name, different places: picking the second returns that record.
    await u.click(within(options()[1]).getByText('Fictional River Primary School'));
    const selected = screen.getByTestId('selected');
    expect(selected).toHaveTextContent('Primary school, Seawind, Eastern Cape');
    expect(selected).toHaveTextContent(RIVER_2.id);
    expect(within(selected).getByRole('link')).toHaveAttribute('href', `${ORIGIN}/school/${RIVER_2.id}`);
  });

  it('"Find school" with several live matches opens the website directory search', async () => {
    const u = user();
    const { navigate, input } = setup();
    await u.type(input(), 'river');
    await flush(250);
    await u.click(screen.getByRole('button', { name: 'Find school' }));
    expect(navigate).toHaveBeenCalledWith(`${ORIGIN}/schools?q=river`);
  });

  it('a failed live search shows the error and Try again, never fictional schools', async () => {
    const u = user();
    const searchLive = vi.fn<SearchSchools>().mockRejectedValueOnce(new Error('HTTP 503')).mockResolvedValueOnce([RIVER]);
    const { input } = setup(searchLive);
    await u.type(input(), 'sunbird'); // a fictional school name: must not appear from the live source
    await flush(250);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(options()).toHaveLength(0);
    expect(screen.queryByText('Sunbird Primary School')).toBeNull();
    expect(screen.getByRole('link', { name: 'donate to Skolo Saka without choosing a school' })).toHaveAttribute('href', `${ORIGIN}/donate`);
    await u.click(screen.getByRole('button', { name: 'Try again' }));
    await flush(250);
    expect(searchLive).toHaveBeenCalledTimes(2);
    expect(options()).toHaveLength(1);
    expect(options()[0]).toHaveTextContent('Fictional River Primary School');
  });

  it('switching to testing mode aborts the pending live search and clears it, so results cannot mix', async () => {
    const u = user();
    let signal: AbortSignal | undefined;
    let answer: (value: typeof RIVER[]) => void = () => {};
    const searchLive = vi.fn<SearchSchools>((_q, o) => { signal = o.signal; return new Promise<typeof RIVER[]>(r => { answer = r; }); });
    const { input } = setup(searchLive);
    await u.type(input(), 'river');
    await flush(250);
    expect(screen.getByText('Searching schools…')).toBeInTheDocument();
    await u.click(screen.getByRole('radio', { name: /Testing mode/ }));
    expect(signal?.aborted).toBe(true);
    expect(input()).toHaveValue('');
    expect(screen.getByTestId('source-label')).toHaveTextContent('Testing mode: fictional schools');
    expect(screen.getByTestId('testing-panel')).toBeInTheDocument();
    // The live answer arrives late: it must not show up in testing mode.
    await act(async () => { answer([RIVER]); });
    await u.type(input(), 'sunbird');
    await flush(300 + 250);
    expect(options().map(o => o.textContent)).toEqual([expect.stringContaining('Sunbird Primary School'), expect.stringContaining('Sunbird Primary School')]);
    expect(screen.queryByText('Fictional River Primary School')).toBeNull();
    // A fictional school has no website page.
    await u.click(options()[0]);
    expect(within(screen.getByTestId('selected')).queryByRole('link')).toBeNull();
    // And back: the fictional search is cleared and the simulation controls are hidden again.
    await u.click(screen.getByRole('radio', { name: /Live Skolo Saka school directory/ }));
    expect(input()).toHaveValue('');
    expect(screen.queryByTestId('testing-panel')).toBeNull();
    expect(screen.getByTestId('selected')).toHaveTextContent('None yet');
  });

  it('simulated failures stay in testing mode', async () => {
    const u = user();
    const { searchLive, input } = setup();
    await u.click(screen.getByRole('radio', { name: /Testing mode/ }));
    await u.click(screen.getByRole('radio', { name: 'Every search fails' }));
    await u.type(input(), 'sunbird');
    await flush(250 + 400);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await u.click(screen.getByRole('radio', { name: /Live Skolo Saka school directory/ }));
    await u.type(input(), 'river');
    await flush(250);
    expect(searchLive).toHaveBeenCalledTimes(1);
    expect(options()).toHaveLength(2);
  });
});
