/**
 * Generl utility functions wrapper.
 *
 * @OnlyCurrentDoc
 */
function BinDo24hStats(options) {
  // Sanitize options
  options = options || {
    CACHE_TTL: 60 * 60 // 1 hour, in seconds
  };
  
  /**
   * Returns the 24hs stats list against USDT.
   *
   * @param ["BTC","ETH"..] range If given, returns just the matching symbols stats.
   * @return The list of 24hs stats for given symbols against USDT.
   */
  function run(range) {
    Logger.log("[BinDo24hStats/1] Running..");
    if (!range) {
      throw new Error("A range with crypto names must be given!");
    }
    const lock = BinUtils().getLock();
    if (!lock) { // Could not acquire lock! => Retry
      return run(range);
    }
  
    const opts = {
      "public": true,
      "filter": function(data) {
        return filter(data, range);
      }
    };
    const data = BinRequest().cache(options.CACHE_TTL, "get", "api/v3/ticker/24hr", "", "", opts);
  
    lock.releaseLock();
    const parsed = parse(data);
    Logger.log("[BinDo24hStats/1] Done!");
    return parsed;
  }
  
  /**
   * @OnlyCurrentDoc
   */
  function filter(data, range) {
    return data.filter(function(ticker) {
      return (range||[]).find(function(crypto) {
        return ticker.symbol == crypto+TICKER_AGAINST;
      });
    });
  }
  
  /**
   * @OnlyCurrentDoc
   */
  function parse(data) {
    const output = [["Date", "Symbol", "Price", "Ask", "Bid", "Open", "High", "Low", "Prev Close", "$ Change 24h", "% Change 24h", "Volume"]];
    const parsed = data.reduce(function(rows, ticker) {
      const symbol = ticker.symbol;
      const price = parseFloat(ticker.lastPrice);
      const ask_price = parseFloat(ticker.askPrice);
      const bid_price = parseFloat(ticker.bidPrice);
      const open_price = parseFloat(ticker.openPrice);
      const high_price = parseFloat(ticker.highPrice);
      const low_price = parseFloat(ticker.lowPrice);
      const close_price = parseFloat(ticker.prevClosePrice);
      const chg24h_price = parseFloat(ticker.priceChange);
      const chg24h_percent = parseFloat(ticker.priceChangePercent) / 100;
      const volume = parseFloat(ticker.quoteVolume);
      const row = [
        new Date(parseInt(ticker.closeTime)),
        symbol,
        price,
        ask_price,
        bid_price,
        open_price,
        high_price,
        low_price,
        close_price,
        chg24h_price,
        chg24h_percent,
        volume
      ];
      rows.push(row);
      return rows;
    }, output);

    return BinUtils().sortResults(parsed, 1, false);
  }
  
  // Return just what's needed from outside!
  return {
    run
  };
}