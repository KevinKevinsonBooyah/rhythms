// Install the /api bridge synchronously before Rhythms' original script initializes.
(() => {
  const nativeFetch = window.fetch.bind(window);
  let complete;
  const ready = new Promise(resolve => { complete = resolve; });
  const timeout = new Promise(resolve => setTimeout(() => resolve(null), 12000));
  window.rhythmsApiReady = complete;
  window.fetch = (input, options) => {
    if (typeof input !== 'string' || !input.startsWith('/api/')) return nativeFetch(input, options);
    return Promise.race([ready, timeout]).then(handler =>
      handler ? handler(input, options) : new Response(JSON.stringify({error:'Firebase is not configured or could not load.'}),
        {status:503,headers:{'Content-Type':'application/json'}}));
  };
})();
