let iso8601_datetime_duration = 'P38Y10M20DT18H56M31S';
let iso8601_date_duration = 'P38Y10M20D';
let iso8601_time_duration = 'PT18H56M31S';
let iso8601_extended_duration = 'P0038-10-20T18:56:31';
let timeDuration;
let timeInterval;
let endingDate = new Date( 2016, 7, 22, 10, 27, 13 );
let beginningDate = new Date( 1977, 9, 1, 15, 30, 42 );
let entryIterator;
let entryCursor;

// Use 'Date's constructor from the numerical difference of two dates.
timeDuration = new TimeDuration( endingDate - beginningDate );
console.debug( "TimeDuration from epoch as date and time:", timeDuration.toISOString() === iso8601_datetime_duration );
console.debug( "TimeDuration from epoch as date only:", timeDuration.toDateString() === iso8601_date_duration );
console.debug( "TimeDuration from epoch as time only:", timeDuration.toTimeString() === iso8601_time_duration );

// ISO-8601 standard duration in, ISO-8601 standard duration out.
timeDuration = new TimeDuration( iso8601_datetime_duration );
console.debug( "TimeDuration from basic as date and time:", timeDuration.toISOString() === iso8601_datetime_duration );
console.debug( "TimeDuration from basic as date only:", timeDuration.toDateString() === iso8601_date_duration );
console.debug( "TimeDuration from basic as time only:", timeDuration.toTimeString() === iso8601_time_duration );

// ISO-8601 extended duration in, ISO-8601 standard duration out.
timeDuration = new TimeDuration( iso8601_extended_duration );
console.debug( "TimeDuration from extended as date and time:", timeDuration.toISOString() === iso8601_datetime_duration );
console.debug( "TimeDuration from extended as date only:", timeDuration.toDateString() === iso8601_date_duration );
console.debug( "TimeDuration from extended as time only:", timeDuration.toTimeString() === iso8601_time_duration );

// ISO-8601 date in, ISO-8601 interval out.
timeInterval = new TimeInterval( ''.concat( beginningDate.toISOString(), '/', endingDate.toISOString()));
console.debug( "TimeInterval from extended as epoch:", timeDuration.getTime() == timeInterval.getTime());

// Moving forward in time.
timeInterval = new TimeInterval( ''.concat( 'R/', beginningDate.toISOString(), '/', 'P1Y' ));
entryIterator = timeInterval.entries();
entryCursor = null;
for( var i = 0; i <= 40; ++i )
{entryCursor = entryIterator.next();}

// Moving backward in time.
timeInterval = new TimeInterval( ''.concat( 'R/', 'P1Y', '/', endingDate.toISOString()));
entryIterator = timeInterval.entries();
entryCursor = null;
for( var i = 0; i <= 40; ++i )
{entryCursor = entryIterator.next();}

// Iterating all-in-one with a compound for-loop.
timeInterval = new TimeInterval( ''.concat( 'R/', (new Date( 2096, 1, 29, 15, 30, 42 )).toISOString(), '/', 'P1Y' ));
for( i = 0, valueIterator = timeInterval.values(), valueCursor = valueIterator.next();
	i <= 9 && !valueCursor.done;
	++i, valueCursor = valueIterator.next())
{console.log( valueCursor.value.toISOString());}
