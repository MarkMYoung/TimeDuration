# TimeDuration
`TimeDuration` is a JavaScript class encapsulating [ISO-8601 durations](https://en.wikipedia.org/wiki/ISO_8601#Durations) with an API similar to the built-in `Date`.
`TimeInterval` is a JavaScript class encapsulating [ISO-8601 intervals](https://en.wikipedia.org/wiki/ISO_8601#Time_intervals) using `Date` and `TimeDuration` with an API similar to the built-in `Date`.
`TimeIntervalIterator` is a JavaScript iterator for making reusable, flexible iterations over `TimeInterval`s.
```JavaScript
let endingDate = new Date( 2016, 7, 22, 10, 27, 13 );
let beginningDate = new Date( 1977, 9, 1, 15, 30, 42 );
let duration_ms = endingDate - beginningDate;
let timeDuration = new TimeDuration( duration_ms );
timeDuration.toISOString();
// "P38Y10M20DT18H56M31S"
```
```JavaScript
let iso8601_datetime_duration = 'P38Y10M20DT18H56M31S';
let timeDuration = new TimeDuration( iso8601_datetime_duration );
timeDuration.toISOString();
// "P38Y10M20DT18H56M31S"
```
```JavaScript
let iso8601_extended_duration = 'P0038-10-20T18:56:31';
let timeDuration = new TimeDuration( iso8601_extended_duration );
timeDuration.toISOString();
// "P38Y10M20DT18H56M31S"
```
# TimeInterval
An interval of time which begins and ends at the same time as a duration covers the same amount of time.
```JavaScript
let endingDate = new Date( 2016, 7, 22, 10, 27, 13 );
let beginningDate = new Date( 1977, 9, 1, 15, 30, 42 );
let timeDuration = new TimeDuration( endingDate - beginningDate );
let timeInterval = new TimeInterval( ''.concat( beginningDate.toISOString(), '/', endingDate.toISOString()));
timeInterval.toISOString()
// "1977-10-01T20:30:42.000Z/2016-08-22T15:27:13.000Z"
timeInterval.getTime() === timeDuration.getTime();
// true
```
A repeating interval can be traversed through time.
Moving forward in time one year at a time, for 40 increments.
```JavaScript
let beginningDate = new Date( 1977, 9, 1, 15, 30, 42 );
let timeInterval = new TimeInterval( ''.concat( 'R/', beginningDate.toISOString(), '/', 'P1Y' ));
timeInterval.toISOString();
// "R/1977-10-01T20:30:42.000Z/P1Y"
let entryIterator = timeInterval.entries();
let entryCursor = null;
for( var i = 0; i <= 40; ++i )
{entryCursor = entryIterator.next();}
// {"done":false,"value":[40,"2017-10-01T20:30:42.000Z"]}
```
Moving backward in time one year at a time, for 40 increments.
```JavaScript
let endingDate = new Date( 2016, 7, 22, 10, 27, 13 );
let timeInterval = new TimeInterval( ''.concat( 'R/', 'P1Y', '/', endingDate.toISOString()));
timeInterval.toISOString();
// "R/P1Y/2016-08-22T15:27:13.000Z"
let entryIterator = timeInterval.entries();
let entryCursor = null;
for( var i = 0; i <= 40; ++i )
{entryCursor = entryIterator.next();}
// {"done":false,"value":[40,"1976-08-22T15:27:13.000Z"]}
```
Looping through an interval in a compound for-loop.  Notice how the leap day is handled correctly, seemlessly, and painlessly.
```JavaScript
let timeInterval = new TimeInterval( ''.concat( 'R/', (new Date( 2096, 1, 29, 15, 30, 42 )).toISOString(), '/', 'P1Y' ));
for( let i = 0, valueIterator = timeInterval.values(), valueCursor = valueIterator.next();
	i <= 9 && !valueCursor.done;
	++i, valueCursor = valueIterator.next())
{valueCursor.value.toISOString();}
// 2096-02-29T21:30:42.000Z
// 2097-03-01T21:30:42.000Z
// 2098-03-01T21:30:42.000Z
// 2099-03-01T21:30:42.000Z
// 2100-03-01T21:30:42.000Z
// 2101-03-01T21:30:42.000Z
// 2102-03-01T21:30:42.000Z
// 2103-03-01T21:30:42.000Z
// 2104-02-29T21:30:42.000Z
```

TimeDuration also works with [`BetterDate`](https://github.com/MarkMYoung/BetterDate "BetterDate") in every place `Date` can be used.
