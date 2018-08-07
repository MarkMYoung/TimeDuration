//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
// @version v0.0.1 (2016-09-02)
// @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
// Examples:
//	// Repeating 2 (times)
//	// starts 2007-03-01 at 1 p.m. GMT
//	// ends 2008-05-11 at 3:30 p.m. GMT
//	let timeInterval = new TimeInterval( 'R2/2007-03-01T13:00:00Z/2008-05-11T15:30:00Z' );
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
let TimeInterval = (function( Date, TimeDuration, TimeIntervalIterator, undefined )
{
	let EPOCH_YEAR = (new Date( 0 )).getUTCFullYear();
	function TimeInterval( arg0, arg1 )
	{
		//console.log( "point break" );
		let hidden =
		{
			'encapsulatedEnd':null,
			'encapsulatedStart':null,
			'intervalDesignator':'/',
			'repetitionCount':0,
		};
		// Doing something like `Date.constructor.prototype.apply( this, arguments );` does not work.

		if( arg0 instanceof Date )
		{hidden.encapsulatedStart = new Date( arg0 );}
		else if( arg0 instanceof TimeDuration )
		{hidden.encapsulatedStart = new TimeDuration( arg0 );}
		else if( typeof( arg0 ) === 'string' )
		{
			// Allows for delimiter of either '/' (solidus or slash) or '--' (double hyphen).
			let intervalRegExp = /^(?:(R)(\d*)(\/|\-\-))?(.*?)(?:(\/|\-\-)(.*?))?$/;

			let intervalMatches = (arg0.match( intervalRegExp ) || []).slice( 1 );
			if( intervalMatches[ 0 ] === 'R' )
			{
				// If the repitition indicator 'R' is specified without a repitition count, it is unbounded.
				hidden.repetitionCount = -1;
				let repetition_parsed = parseInt( intervalMatches[ 1 ], 10 );
				if( !isNaN( repetition_parsed ))
				{hidden.repetitionCount = repetition_parsed;}
				if( !!intervalMatches[ 2 ])
				{hidden.intervalDesignator = intervalMatches[ 2 ];}
			}

			if( TimeDuration.dateRegExp.test( intervalMatches[ 3 ]))
			{hidden.encapsulatedStart = new Date( intervalMatches[ 3 ]);}
			else if( TimeDuration.durationBasicRegExp.test( intervalMatches[ 3 ]))
			{hidden.encapsulatedStart = new TimeDuration( intervalMatches[ 3 ]);}
			else if( TimeDuration.durationExtendedRegExp.test( intervalMatches[ 3 ]))
			{hidden.encapsulatedStart = new TimeDuration( intervalMatches[ 3 ]);}
			else if( TimeDuration.durationNormalRegExp.test( intervalMatches[ 3 ]))
			{hidden.encapsulatedStart = new TimeDuration( intervalMatches[ 3 ]);}

			if( !(hidden.encapsulatedStart instanceof Date || hidden.encapsulatedStart instanceof TimeDuration))
			{throw( new TypeError( "TimeInterval start must parse to a 'Date' or 'TimeDuration'." ));}

			if( !!intervalMatches[ 4 ])
			{hidden.intervalDesignator = intervalMatches[ 4 ];}

			if( !!intervalMatches[ 2 ] && !!intervalMatches[ 4 ] && intervalMatches[ 2 ] !== intervalMatches[ 4 ])
			{throw( Error( ''.concat( "Mixed interval designators used: '", intervalMatches[ 2 ], "' and '", intervalMatches[ 4 ], "'." )));}
			
			if( intervalMatches[ 5 ] !== undefined )
			{
				if( TimeDuration.dateRegExp.test( intervalMatches[ 5 ]))
				{hidden.encapsulatedEnd = new Date( intervalMatches[ 5 ]);}
				else if( TimeDuration.durationBasicRegExp.test( intervalMatches[ 5 ]))
				{hidden.encapsulatedEnd = new TimeDuration( intervalMatches[ 5 ]);}
				else if( TimeDuration.durationExtendedRegExp.test( intervalMatches[ 5 ]))
				{hidden.encapsulatedEnd = new TimeDuration( intervalMatches[ 5 ]);}
				else if( TimeDuration.durationNormalRegExp.test( intervalMatches[ 5 ]))
				{hidden.encapsulatedEnd = new TimeDuration( intervalMatches[ 5 ]);}

				if( !(hidden.encapsulatedEnd instanceof Date || hidden.encapsulatedEnd instanceof TimeDuration))
				{throw( new TypeError( "TimeInterval end must parse to a 'Date' or 'TimeDuration', or not specified at all." ));}
			}
			else
			{hidden.encapsulatedEnd = null;}
		}

		if( arg1 instanceof Date ) 
		{hidden.encapsulatedEnd = new Date( arg1 );}
		else if( arg1 instanceof TimeDuration )
		{hidden.encapsulatedEnd = new TimeDuration( arg1 );}

		if( hidden.encapsulatedStart instanceof TimeDuration && hidden.encapsulatedEnd instanceof TimeDuration )
		{throw( new TypeError( "TimeInterval start and end cannot both parse to a 'TimeDuration'." ));}
		if( hidden.encapsulatedStart instanceof Date && hidden.encapsulatedEnd === null )
		{throw( new TypeError( "TimeInterval with only one parameter must parse to a 'TimeDuration'." ));}

		this.getIntervalDesignator = function()
		{return( hidden.intervalDesignator );};
		this.getRepetitionCount = function()
		{return( hidden.repetitionCount );};
		this.setIntervalDesignator = function( delimiter )
		{hidden.intervalDesignator = delimiter;};
		this.setRepetitionCount = function( count )
		{
			let parsed_count = parseInt( count, 10 );
			if( parsed_count === Number( count ))
			{hidden.repetitionCount = parsed_count;}
			else
			{throw( new TypeError( "'count' must be an integer, -1 indicates unbounded." ));}
		};
		/*this.toRepetition = function( requested_index )
		{
			let repetitionDate = null;
			let repetition_count = this.getRepetitionCount();
			if( repetition_count == 0 )
			{throw( new RangeError( "TimeInterval does not repeat." ));}
			else if( repetition_count == -1 )
			{
			}
			else if( repetition_count > 0 )
			{
				if( requested_index >= repetition_count )
				{throw( new RangeError( "Requested repetition index exceeds TimeInterval repetitions." ));}
				else
				{
				}
			}
			return( repetitionDate );
		};*/

		Object.defineProperties( this,
		{
			// Expose ecapsulated interval as a 'Date' object.
			'encapsulated':
			{
				'get':function()
				{
					let encapsulated = ((hidden.encapsulatedEnd !== null)
						?(new Date( hidden.encapsulatedEnd.getTime() - hidden.encapsulatedStart.getTime()))
						:(new Date( hidden.encapsulatedStart.getTime()))
					);
					return( encapsulated );
				},
				'set':function( value )
				{throw( new TypeError( "'encapsulated' is read-only." ));},
			},
		});
		Object.defineProperties( this,
		{
			// Expose the ecapsulated end 'Date' or 'TimeDuration' object as read-only.
			'intervalEnd':
			{
				'get':function()
				{return( hidden.encapsulatedEnd );},
				'set':function( value )
				//{throw( new TypeError( "'intervalEnd' is read-only." ));},
				{
					if( !(value instanceof Date || value instanceof TimeDuration || value === null))
					{throw( new TypeError( "'intervalEnd' must be a 'Date', 'TimeDuration', or null." ));}
					hidden.encapsulatedEnd = value;
				}
			},
			// Expose the ecapsulated start 'Date' or 'TimeDuration' object as read-only.
			'intervalStart':
			{
				'get':function()
				{return( hidden.encapsulatedStart );},
				'set':function( value )
				//{throw( new TypeError( "'intervalStart' is read-only." ));},
				{
					if( !(value instanceof Date || value instanceof TimeDuration))
					{throw( new TypeError( "'intervalStart' must be a 'Date' or 'TimeDuration'." ));}
					hidden.encapsulatedStart = value;
				}
			},
		});
	}
	TimeInterval.prototype = Object.create( Object.prototype );
	TimeInterval.prototype.constructor = TimeInterval;

	// Iterators.
	TimeInterval.prototype[ Symbol.iterator ] = function( value_type )
	{return( new TimeIntervalIterator( this, value_type ));};
	TimeInterval.prototype.entries = function()
	{return( this[ Symbol.iterator ]( TimeIntervalIterator.ValueType.Entries ));};
	TimeInterval.prototype.keys = function()
	{return( this[ Symbol.iterator ]( TimeIntervalIterator.ValueType.Keys ));};
	TimeInterval.prototype.values = function()
	{return( this[ Symbol.iterator ]( TimeIntervalIterator.ValueType.Values ));};

	TimeInterval.formatPrefix = function( timeInterval )
	{
		let repetition_count = timeInterval.getRepetitionCount();
		let repetition_prefix = '';
		if( repetition_count != 0 )
		{
			repetition_prefix = 'R';
			if( repetition_count > 0 )
			{repetition_prefix = repetition_prefix.concat( repetition_count.toString());}
			repetition_prefix = repetition_prefix.concat( timeInterval.getIntervalDesignator());
		}
		return( repetition_prefix );
	};
	/** @override */
	TimeInterval.prototype.getDate = function()
	{
		let value = this.encapsulated.getDate() - 1;
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getFullYear = function()
	{
		let value = this.encapsulated.getFullYear() - EPOCH_YEAR;
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getHours = function()
	{
		let value = this.getUTCHours();
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getMilliseconds = function()
	{
		let value = this.getUTCMilliseconds();
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getMinutes = function()
	{
		let value = this.getUTCMinutes();
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getMonth = function()
	{
		let value = this.getUTCMonth();
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getSeconds = function()
	{
		let value = this.getUTCSeconds();
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getTime = function()
	{
		const milliseconds_in_a_minute = 60 * 1000;
		let value = this.encapsulated.getTime() - (this.encapsulated.getTimezoneOffset() * milliseconds_in_a_minute);
		return( value );
	};
	/** @override */
	TimeInterval.prototype.getTimezoneOffset = function()
	{return( 0 );};
	TimeInterval.prototype.includes = function( dateOrInterval, completely )
	{
		//TODO handle repeating intervals
		completely = completely || false;
		if( !(dateOrInterval instanceof Date || dateOrInterval instanceof TimeInterval))
		{throw( new TypeError( "'dateOrInterval' must be an instance of 'Date'." ));}
		let is_included = false;

		let dateOrIntervalTime = dateOrInterval.getTime();
		let encapsulatedStartTime = this.encapsulatedStart.getTime();
		let encapsulatedEndTime = null;
		if( this.encapsulatedEnd instanceof Date || this.encapsulatedEnd instanceof TimeInterval )
		{encapsulatedEndTime = this.encapsulatedEnd.getTime();}
		if( dateOrInterval instanceof Date )
		{
			if( this.encapsulatedStart instanceof Date )
			{
				if( this.encapsulatedEnd instanceof Date )
				{
					is_included = encapsulatedStartTime <= dateOrIntervalTime 
						&& encapsulatedEndTime >= dateOrIntervalTime;
				}
				else// if( this.encapsulatedEnd instanceOf TimeDuration )
				{
					is_included = encapsulatedStartTime <= dateOrIntervalTime 
						&& (encapsulatedEndTime + encapsulatedStartTime) >= dateOrIntervalTime;
				}
			}
			else// if( this.encapsulatedStart instanceOf TimeDuration )
			{
				if( this.encapsulatedEnd instanceof Date )
				{
					is_included = (encapsulatedEndTime - encapsulatedStartTime) <= dateOrIntervalTime 
						&& encapsulatedEndTime >= dateOrIntervalTime;
				}
				else// if( this.encapsulatedEnd === null )
				{
					is_included = encapsulatedStartTime <= dateOrIntervalTime;
				}
			}
		}
		else// if( dateOrInterval instanceof TimeInterval )
		{
			//TODO
		}
		return( is_included );
	};
	/** @override */
	TimeInterval.prototype.toDateString = function()
	{
		let date_string_end = ((this.intervalEnd !== null)
			?(''.concat( this.intervalDesignator, TimeDuration.formatDate( this.intervalEnd )))
			:(''));
		let date_string_start = ((this.intervalStart instanceof Date)
			?(TimeDuration.formatDate( this.intervalStart ))
			:(''.concat( 'P', TimeDuration.formatDate( this.intervalStart ))));
		let date_string = ''.concat( date_string_start, datetime_string_end );
		let repetition_prefix = TimeInterval.formatPrefix( this );
		return( ''.concat( repetition_prefix, date_string ));
	};
	/** @override */
	TimeInterval.prototype.toISOString = function()
	{
		let datetime_string_end = ((this.intervalEnd !== null)
			?(''.concat( this.getIntervalDesignator(), this.intervalEnd.toISOString()))
			:(''));
		let datetime_string_start = this.intervalStart.toISOString();
		let datetime_string = ''.concat( datetime_string_start, datetime_string_end );
		let repetition_prefix = TimeInterval.formatPrefix( this );
		return( ''.concat( repetition_prefix, datetime_string ));
	};
	/** @override */
	TimeInterval.prototype.toString = function()
	{
		let as_string = this.toISOString();
		return( as_string );
	};
	/** @override */
	TimeInterval.prototype.toTimeString = function()
	{
		let time_string_end = ((this.intervalEnd !== null)
			?(''.concat( this.intervalDesignator, TimeDuration.formatTime( this.intervalEnd )))
			:(''));
		let time_string_start = ((this.intervalStart instanceof Date)
			?(TimeDuration.formatTime( this.intervalStart ))
			:(''.concat( 'P', TimeDuration.formatTime( this.intervalStart ))));
		let time_string = ''.concat( time_string_start, time_string_end );
		let repetition_prefix = TimeInterval.formatPrefix( this );
		return( ''.concat( repetition_prefix, time_string ));
	};
	// Getter functions.
	[
		//'getDate',	// Overridden elsewhere.
		//X 'getDay',	// Not implemented.
		//'getFullYear',	// Overridden elsewhere.
		//'getHours',	// Overridden elsewhere.
		//'getMilliseconds',	// Overridden elsewhere.
		//'getMinutes',	// Overridden elsewhere.
		//'getMonth',	// Overridden elsewhere.
		//'getSeconds',	// Overridden elsewhere.
		//'getTime',	// Overridden elsewhere.
		//'getTimezoneOffset',	// Overridden elsewhere.
		'getUTCDate',
		'getUTCDay',
		'getUTCFullYear',
		'getUTCHours',
		'getUTCMilliseconds',
		'getUTCMinutes',
		'getUTCMonth',
		'getUTCSeconds',
		//X 'getYear',	// Deprecated.
	]
	.forEach( function proxy_getter( getter, g )
	{
		TimeInterval.prototype[ getter ] = function()
		{
			let value = this.encapsulated[ getter ]();
			return( value );
		};
	}, this );
	// Setter functions.
	[
		'setDate',
		'setFullYear',
		'setHours',
		'setMilliseconds',
		'setMinutes',
		'setMonth',
		'setSeconds',
		'setTime',
		'setUTCDate',
		'setUTCFullYear',
		'setUTCHours',
		'setUTCMilliseconds',
		'setUTCMinutes',
		'setUTCMonth',
		'setUTCSeconds',
		//X 'setYear',	// Deprecated.
	]
	.forEach( function proxy_not_implemented( not_implemented, n )
	{
		TimeInterval.prototype[ not_implemented ] = function()
		{throw( new ReferenceError( ''.concat( "Function not implemented: '", not_implemented, "'." )));};
	}, this );
	// Converter functions.
	[
		//'toDateString',	// Overridden elsewhere.
		//'toISOString',	// Overridden elsewhere.
		'toJSON',
		'toGMTString',
		'toLocaleDateString',
		'toLocaleFormat',
		'toLocaleString',
		'toLocaleTimeString',
		//'toString',	// Overridden elsewhere.
		//'toTimeString',	// Overridden elsewhere.
		'toUTCString',
		'valueOf',
	]
	.forEach( function proxy_converter( converter, c )
	{
		TimeInterval.prototype[ converter ] = function()
		{
			let value = this.encapsulated[ converter ]();
			return( value );
		};
	}, this );
	// Not implemented functions.
	[
		'getDay',	// What would this even mean?
		'getYear',	// Deprecated.
		'setYear',	// Deprecated.
	]
	.forEach( function proxy_not_implemented( not_implemented, n )
	{
		TimeInterval.prototype[ not_implemented ] = function()
		{throw( new ReferenceError( ''.concat( "Function not implemented: '", not_implemented, "'." )));};
	}, this );
	return( TimeInterval );
})( Date, TimeDuration, TimeIntervalIterator );
(module || {'exports':{}}).exports = TimeInterval;
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
