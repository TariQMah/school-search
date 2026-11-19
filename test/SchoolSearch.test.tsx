import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchoolSearch, schoolPlace, type School, type SchoolSearchProps } from '../src';
import { DEMO_SCHOOLS, matchSchools } from '../demo/src/schools';

// Fake timers so the 250 ms search delay and slow responses are controlled exactly.
beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: false }); });
afterEach(() => { vi.useRealTimers(); });

// delay: null makes user-event type without timers of its own; the tests advance time explicitly.
const user = () => userEvent.setup({ delay: null });
const flush = async (ms = 0) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

function setup(props: Partial<SchoolSearchProps> = {}) {
  const onSelectSchool = vi.fn();
  const searchSchools = props.searchSchools ?? vi.fn(async (q: string) => matchSchools(q));
  render(<SchoolSearch searchSchools={searchSchools} onSelectSchool={onSelectSchool} {...props} />);
  return { onSelectSchool, searchSchools, input: screen.getByRole('combobox', { name: 'Search for a school' }) };
}

const options = () => screen.queryAllByRole('option');

describe('SchoolSearch', () => {
  it('shows names and places, and hands back the clicked school', async () => {
    const u = user();
    const { input, onSelectSchool } = setup();
    await u.type(input, 'sunbird');
    expect(screen.getByText('Searching schools…')).toBeInTheDocument();
    await flush(250);
    expect(options()).toHaveLength(2);
    expect(within(options()[0]).getByText('Primary school, Riverbend, Limpopo')).toBeInTheDocument();
    expect(within(options()[1]).getByText('Primary school, Kopjeskloof, Free State')).toBeInTheDocument();
    expect(within(options()[0]).getByRole('img', { name: 'Verified' })).toBeInTheDocument();
    await u.click(within(options()[1]).getByText('Sunbird Primary School'));
    // Same name, different town: the exact record comes back.
    expect(onSelectSchool).toHaveBeenCalledTimes(1);
    expect(onSelectSchool.mock.calls[0][0]).toMatchObject({ id: 'demo-002', town: 'Kopjeskloof' });
    expect(options()).toHaveLength(0);
  });

  it('keeps the verified badge on one line with the last word of the name', async () => {
    const u = user();
    const { input } = setup();
    await u.type(input, 'sunbird');
    await flush(250);
    const name = options()[0].querySelector('strong')!;
    expect(name).toHaveTextContent(/^Sunbird Primary School$/);
    const end = name.querySelector('.skolo-search__name-end')!;
    expect(end).toHaveTextContent(/^School$/);
    expect(within(end as HTMLElement).getByRole('img', { name: 'Verified' })).toBeInTheDocument();
    // An unverified name is plain text with nothing to keep together.
    expect(options()[1].querySelector('.skolo-search__name-end')).toBeNull();
  });

  it('uses formatPlace to distinguish identical names and places without changing the selected record', async () => {
    const u = user();
    // Fictional records with the same visible name, place and verified status.
    const schools = [
      { ...DEMO_SCHOOLS[0], verified: false },
      { ...DEMO_SCHOOLS[0], id: DEMO_SCHOOLS[1].id, verified: false },
    ];
    const { input, onSelectSchool } = setup({
      searchSchools: async () => schools,
      formatPlace: school => `${schoolPlace(school)} · ${school.id}`,
    });
    await u.type(input, 'sunbird');
    await flush(250);
    expect(options()).toHaveLength(2);
    expect(within(options()[0]).getByText('Primary school, Riverbend, Limpopo · demo-001')).toBeInTheDocument();
    expect(within(options()[1]).getByText('Primary school, Riverbend, Limpopo · demo-002')).toBeInTheDocument();
    await u.click(options()[1]);
    expect(onSelectSchool).toHaveBeenCalledTimes(1);
    expect(onSelectSchool.mock.calls[0][0]).toBe(schools[1]);
  });

  it('waits for the 250 ms search delay and searches once for quick typing', async () => {
    const u = user();
    const { input, searchSchools } = setup();
    for (const ch of 'riverbend') { await u.type(input, ch); await flush(100); } // 100 ms between keys
    expect(searchSchools).not.toHaveBeenCalled();
    await flush(149);
    expect(searchSchools).not.toHaveBeenCalled();
    await flush(1);
    expect(searchSchools).toHaveBeenCalledTimes(1);
    expect(searchSchools).toHaveBeenCalledWith('riverbend', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('does not search for fewer than two letters', async () => {
    const u = user();
    const { input, searchSchools } = setup();
    await u.type(input, 's');
    await flush(500);
    expect(searchSchools).not.toHaveBeenCalled();
    expect(screen.queryByText('Searching schools…')).not.toBeInTheDocument();
  });

  it('moves with the arrow keys and picks the highlighted school with Enter', async () => {
    const u = user();
    const { input, onSelectSchool } = setup();
    await u.type(input, 'kopjeskloof');
    await flush(250);
    expect(options()).toHaveLength(2);
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options()[0].id);
    await u.keyboard('{ArrowDown}');
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options()[1].id);
    await u.keyboard('{ArrowDown}'); // stays on the last
    expect(options()[1]).toHaveAttribute('aria-selected', 'true');
    await u.keyboard('{ArrowUp}{ArrowUp}'); // stays on the first
    expect(options()[0]).toHaveAttribute('aria-selected', 'true');
    await u.keyboard('{ArrowDown}{Enter}');
    expect(onSelectSchool).toHaveBeenCalledWith(expect.objectContaining({ id: 'demo-006', name: 'Morning Star Primary School' }));
  });

  describe('keyboard edges', () => {
    // "school" matches six fictional schools, enough to walk from end to end.
    const highlighted = () => options().filter(o => o.getAttribute('aria-selected') === 'true');
    const expectHighlight = (input: HTMLElement, i: number) => {
      expect(highlighted()).toEqual([options()[i]]);
      expect(input).toHaveAttribute('aria-activedescendant', options()[i].id);
    };

    it('keeps the highlight on the first result with ArrowUp and on the last with ArrowDown', async () => {
      const u = user();
      const { input } = setup();
      await u.type(input, 'school');
      await flush(250);
      const last = options().length - 1;
      expect(last).toBeGreaterThan(1);
      expectHighlight(input, 0);
      await u.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}'); // no wrap to the last, no lost highlight
      expectHighlight(input, 0);
      for (let i = 0; i < last; i++) await u.keyboard('{ArrowDown}');
      expectHighlight(input, last);
      await u.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}'); // no wrap to the first
      expectHighlight(input, last);
      await u.keyboard('{ArrowUp}');
      expectHighlight(input, last - 1);
    });

    it('points aria-activedescendant at the highlighted option on every arrow key', async () => {
      const u = user();
      const { input } = setup();
      await u.type(input, 'school');
      await flush(250);
      const ids = options().map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      const listbox = screen.getByRole('listbox');
      expect(input).toHaveAttribute('aria-controls', listbox.id);
      const steps = ['{ArrowDown}', '{ArrowDown}', '{ArrowUp}', '{ArrowDown}', '{ArrowDown}', '{ArrowUp}', '{ArrowUp}', '{ArrowUp}'];
      for (const key of steps) {
        await u.keyboard(key);
        const [current] = highlighted();
        expect(highlighted()).toHaveLength(1);
        expect(input.getAttribute('aria-activedescendant')).toBe(current.id);
        // The id belongs to an option inside the list the input controls.
        expect(within(listbox).getAllByRole('option')).toContain(document.getElementById(current.id));
      }
    });

    it('lets Tab move focus out and close the list without picking a school', async () => {
      const u = user();
      const { input, onSelectSchool } = setup();
      await u.type(input, 'school');
      await flush(250);
      await u.keyboard('{ArrowDown}'); // a school is highlighted, but Tab must not pick it
      expect(input).toHaveAttribute('aria-activedescendant', options()[1].id);
      await u.tab();
      expect(input).not.toHaveFocus();
      expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
      await flush(150); // the list closes once the box loses focus
      expect(options()).toHaveLength(0);
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(onSelectSchool).not.toHaveBeenCalled();
      expect(input).toHaveValue('school');
    });
  });

  it('closes the list with Escape', async () => {
    const u = user();
    const { input } = setup();
    await u.type(input, 'sunbird');
    await flush(250);
    expect(options()).toHaveLength(2);
    await u.keyboard('{Escape}');
    expect(options()).toHaveLength(0);
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('"Find school" picks the only match, and sends several to onSearchAll', async () => {
    const u = user();
    const onSearchAll = vi.fn();
    const { input, onSelectSchool } = setup({ onSearchAll });
    await u.type(input, 'lighthouse');
    await flush(250);
    await u.click(screen.getByRole('button', { name: 'Find school' }));
    expect(onSelectSchool).toHaveBeenCalledWith(expect.objectContaining({ id: 'demo-004' }));
    await u.clear(input);
    await u.type(input, 'sunbird');
    await flush(250);
    await u.click(screen.getByRole('button', { name: 'Find school' }));
    expect(onSearchAll).toHaveBeenCalledWith('sunbird');
    expect(onSelectSchool).toHaveBeenCalledTimes(1);
  });

  it('shows the no-results message with the app\'s link', async () => {
    const u = user();
    const { input } = setup({ links: { empty: q => ({ href: `/contact?need=school&school=${encodeURIComponent(q)}`, label: 'tell us about the school' }) } });
    await u.type(input, 'zzz school');
    await flush(250);
    expect(screen.getByText(/No school matches “zzz school”/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tell us about the school' })).toHaveAttribute('href', '/contact?need=school&school=zzz%20school');
    expect(screen.getByText('No schools found')).toBeInTheDocument(); // screen-reader announcement
  });

  it('shows the error message, then recovers with "Try again"', async () => {
    const u = user();
    let fail = true;
    const searchSchools = vi.fn(async (q: string) => { if (fail) throw new Error('down'); return matchSchools(q); });
    const { input } = setup({ searchSchools, links: { error: { href: '/donate', label: 'donate to Skolo Saka without choosing a school' } } });
    await u.type(input, 'baobab');
    await flush(250);
    expect(screen.getByText(/We couldn’t load schools./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'donate to Skolo Saka without choosing a school' })).toHaveAttribute('href', '/donate');
    fail = false;
    await u.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Searching schools…')).toBeInTheDocument();
    await flush(250);
    expect(searchSchools).toHaveBeenCalledTimes(2);
    expect(options()).toHaveLength(1);
    expect(options()[0]).toHaveTextContent('Baobab Ridge High School');
    expect(input).toHaveFocus();
  });

  it('never lets a slow answer to an older query replace newer results', async () => {
    const u = user();
    const resolvers: Record<string, (s: School[]) => void> = {};
    const signals: Record<string, AbortSignal> = {};
    // Each query's answer arrives only when the test releases it, and ignores the abort signal.
    const searchSchools = vi.fn((q: string, { signal }: { signal: AbortSignal }) => {
      signals[q] = signal;
      return new Promise<School[]>(resolve => { resolvers[q] = resolve; });
    });
    const { input } = setup({ searchSchools });
    await u.type(input, 'sun');
    await flush(250);
    await u.type(input, 'bird');
    await flush(250);
    expect(searchSchools.mock.calls.map(c => c[0])).toEqual(['sun', 'sunbird']);
    expect(signals.sun.aborted).toBe(true);
    await act(async () => { resolvers.sunbird(matchSchools('sunbird')); });
    expect(options()).toHaveLength(2);
    // The older, broader query answers late with different schools.
    await act(async () => { resolvers.sun([DEMO_SCHOOLS[6]]); });
    expect(options()).toHaveLength(2);
    expect(screen.queryByText('Kingfisher Secondary School')).not.toBeInTheDocument();
  });

  it('ignores a late answer after the text is cleared', async () => {
    const u = user();
    let release!: (s: School[]) => void;
    const searchSchools = vi.fn(() => new Promise<School[]>(r => { release = r; }));
    const { input } = setup({ searchSchools });
    await u.type(input, 'sunbird');
    await flush(250);
    await u.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    await act(async () => { release(matchSchools('sunbird')); });
    expect(options()).toHaveLength(0);
  });

  it('limits results and accepts translated text', async () => {
    const u = user();
    setup({
      limit: 3,
      messages: { placeholder: 'Leina la sekolo goba toropo', submit: 'Hwetša sekolo' },
    });
    const input = screen.getByPlaceholderText('Leina la sekolo goba toropo');
    await u.type(input, 'school');
    await flush(250);
    expect(options()).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Hwetša sekolo' })).toBeInTheDocument();
  });

  it('renders app links through renderLink (e.g. Next.js Link)', async () => {
    const u = user();
    const { input } = setup({
      searchSchools: async () => { throw new Error('down'); },
      links: { error: { href: '/donate', label: 'donate' } },
      renderLink: ({ href, children }) => <a href={href} data-router="next">{children}</a>,
    });
    await u.type(input, 'aloe');
    await flush(250);
    expect(screen.getByRole('link', { name: 'donate' })).toHaveAttribute('data-router', 'next');
  });
});
