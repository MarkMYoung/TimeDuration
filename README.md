# TimeDuration
`TimeDuration` is a JavaScript class encapsulating [ISO-8601 durations](https://en.wikipedia.org/wiki/ISO_8601#Durations) with an API similar to the built-in `Date`.
`TimeInterval` is a JavaScript class encapsulating [ISO-8601 intervals](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) using `Date` and `TimeDuration` with an API similar to the built-in `Date`.
`TimeIntervalIterator` is a JavaScript iterator for making reusable, flexible iterations over `TimeInterval`s.
```JavaScript
let timeDuration = new TimeDuration();
```
The '1' is one-indexed to intuitively mean 'January', not zero-indexed to mean 'February'.
```JavaScript
timeDuration = new TimeDuration( 2017, 1, 26 );
new Date( timeDuration );
// Thu Jan 26 2017 00:00:00 GMT-0600 (Central Standard Time)
```
Remove 10 hours from a 'TimeDuration':
```JavaScript
let epoch_ms = timeDuration.addHours( -10 );
// 1485374400000
timeDuration.toString();
// Wed Jan 25 2017 14:00:00 GMT-0600 (Central Standard Time)
```
Change the time zone offset (and name) without affecting the represented time.
```JavaScript
timeDuration.setTimezoneOffset( 480 );
timeDuration.setTimezoneName( 'America/Los_Angeles' );
timeDuration.toString();
// Wed Jan 25 2017 12:00:00 GMT-0800 (America/Los_Angeles)
new Date( timeDuration );
// Wed Jan 25 2017 14:00:00 GMT-0600 (Central Standard Time)
```
Get week of year.
```JavaScript
Math.ceil( timeDuration.getWeeksOfYear());
// 4
```
TimeDuration also works with `BetterDate` in every place `Date` can be used.
