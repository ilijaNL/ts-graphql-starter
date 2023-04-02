export default class TinyCache<K, V> {
  private _timeouts: Map<K, number> = new Map();
  private _cache: Map<K, V> = new Map();

  public put(key: K, value: V, ms?: number) {
    if (this._timeouts.has(key)) {
      clearTimeout(this._timeouts.get(key));
    }

    if (ms) {
      this._timeouts.set(key, setTimeout(this.del.bind(this, key), ms) as any);
    }

    this._cache.set(key, value);
  }

  public get(key: K): V | undefined {
    return this._cache.get(key);
  }

  public del(key: K) {
    if (this._timeouts.has(key)) {
      clearTimeout(this._timeouts.get(key));
      this._timeouts.delete(key);
    }

    return this._cache.delete(key);
  }

  public clear() {
    this._timeouts.forEach((value) => {
      clearTimeout(value);
    });

    this._cache.clear();
    this._timeouts.clear();
  }
}
