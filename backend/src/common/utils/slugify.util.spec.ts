import { slugify } from './slugify.util';

describe('slugify util', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Ruby on Rails')).toBe('ruby-on-rails');
  });

  it('trims and collapses runs of whitespace into a single hyphen', () => {
    expect(slugify('  Trim  Me  ')).toBe('trim-me');
  });

  it('strips non-word characters and collapses the resulting hyphens', () => {
    expect(slugify('C++ & Rust!')).toBe('c-rust');
  });

  it('drops punctuation but keeps digits and underscores', () => {
    expect(slugify('Node.js 20_v2')).toBe('nodejs-20_v2');
  });

  it('leaves an already-valid slug unchanged', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
