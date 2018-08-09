//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
// @version v0.0.1 (2016-09-06)
// @see https://en.wikipedia.org/wiki/ISO_8601#Durations
// Examples:
//	// 1 Day, 12 Hours
//	let timeDuration = new TimeDuration( 'P1DT12H' );
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
/** A 'TimeDuration' is essentially a 'Date' that understands it is a relative 
	time, not an absolute time (albeit, relative to an epoch).
*/
// Notice careful consideration was made not to refer to problematic values like 
//	a year is an average of 365.2475 versus 365.25, 
//	a year is an average of 52.17821 versus 52.17857 or even 52.14285 weeks, or 
//	even refering to 'Date's internal epoch.
let TimeDuration = (function( Date, undefined )
{
	let EPOCH_YEAR = (new Date( 0 )).getUTCFullYear();
	function TimeDuration()
	{
		//console.log( "point break" );
		// Even though 'TimeDuration' extends/is a 'Date', a separate 'Date' 
		//	object had to be kept in 'encapsulated' because when calling 
		//	'getTime()' and other functions some browsers would throw a 
		//	'TypeError' with "this is not a Date object."
		let hidden =
		{'encapsulated':null,};
		// Doing something like `Date.constructor.prototype.apply( this, arguments );` does not work.
		let args = Array.prototype.slice.apply( arguments );
		switch( args.length )
		{
		case 0:hidden.encapsulated = new Date();break;
		case 1:
			let args0 = args[ 0 ];
			let is_string = typeof( args0 ) === 'string' || args0 instanceof String;
			let is_a_duration = is_string 
				&& (
					TimeDuration.durationBasicRegExp.test( args0 )
					|| TimeDuration.durationExtendedRegExp.test( args0 )
					|| TimeDuration.durationNormalRegExp.test( args0 ) 
				)
				|| false;
			if( is_a_duration )
			{
				let normalDurationMatches = (args0.match( TimeDuration.durationNormalRegExp ) || [])
					.slice( 1 )
					.filter( function keep_truthy( each )
					{return( !!each );});
				if( normalDurationMatches.length > 0 )
				{
					let index_of_T = normalDurationMatches.indexOf( 'T' );
					let numberLetterPairRegExp = /(\d*(?:[,\.]\d+)?)([DHMSWY])/;
					let numberLetterTuples = normalDurationMatches
						.filter( function omit_designator_T( number_letter_pair, n, every )
						{return( number_letter_pair !== 'T' );})
						.map( function to_number_letter_pairs( number_letter_pair, n, every )
						{
							return( number_letter_pair
								.match( numberLetterPairRegExp )
								.slice( 1 )
							);
						});

					hidden.encapsulated = new Date( 0 );
					numberLetterTuples.forEach( function( numberLetterTuple, n, every )
					{
						// If the number is a decimal fraction, it may be specified with either a period/'full stop' or a comma.
						let number_as_string = (numberLetterTuple[ 0 ] || '0').replace( ',', '.' );
						let number_as_float = parseFloat( number_as_string );
						let number_as_int = parseInt( number_as_float, 10 );
						let carryover = number_as_float - number_as_int;
						// Only the lowest precision number is allowed to be fractional (§5.5.3.1.b Format with time-unit designators).
						if( n != every.length - 1 )
						{
							// TODO: Might need a different comparison here.
							if( number_as_float != number_as_int )
							{throw( new Error( ''.concat( "Only the smallest value used may have a decimal fraction specified.", numberLetterTuple.join( '' ))));}
						}
						let letter = numberLetterTuple[ 1 ];
						switch( letter )
						{
						case 'D':
							// Do NOT increment the day (of month) even though 'Date's day (of month) is one-indexed 
							//	because this is a relative period of time, it will be added when set.
							hidden.encapsulated.setUTCDate( hidden.encapsulated.getUTCDate() + number_as_int );
							break;
						case 'H':
							hidden.encapsulated.setUTCHours( hidden.encapsulated.getUTCHours() + number_as_int );
							break;
						case 'M':
							// month
							if( index_of_T == -1 || n < index_of_T )
							// No need to increment the month since 'Date's month is zero-indexed when represented in a number.
							{
								hidden.encapsulated.setUTCMonth( hidden.encapsulated.getUTCMonth() + number_as_int );
							}
							// minutes
							else
							{
								hidden.encapsulated.setUTCMinutes( hidden.encapsulated.getUTCMinutes() + number_as_int );
							}
							break;
						case 'S':
							hidden.encapsulated.setUTCSeconds( hidden.encapsulated.getUTCSeconds() + number_as_int );
							break;
						case 'W':
							const milliseconds_in_a_week = 7 * 24 * 60 * 60 * 1000;
							hidden.encapsulated.setTime( hidden.encapsulated.getTime() + milliseconds_in_a_week );
							break;
						case 'Y':
							// Add 'Date's epoch year.
							hidden.encapsulated.setUTCFullYear( hidden.encapsulated.getUTCFullYear() + number_as_int );
							break;
						default:throw( new Error( ''.concat( "Unexpected duration letter designator for date or time component: '", letter, "'." )));break;
						}
					});

					if( '-−'.indexOf( normalDurationMatches[ 0 ]) > -1 )
					{hidden.encapsulated.setTime( -hidden.encapsulated.getTime());}
				}
				else
				{
					let basicOrExtendedDurationMatches = (args0.match( TimeDuration.durationBasicRegExp ) || args0.match( TimeDuration.durationExtendedRegExp ) || [])
						.slice( 1 );
					// This technique had to abandoned due to very peculiar timezone offsets with years prior to the year ~1875.
					// if( basicOrExtendedDurationMatches.length >= 7 )
					// {
					// 	let extended_format = ''.concat( 
					// 		basicOrExtendedDurationMatches.slice( 1, 4 ).join( '-' ), 
					// 		'T', 
					// 		basicOrExtendedDurationMatches.slice( 4, 7 ).join( ':' )
					// 	);
					// 	hidden.encapsulated = new Date( extended_format );
					// 	// Add 'Date's epoch year.
					// 	hidden.encapsulated.setUTCFullYear( hidden.encapsulated.getUTCFullYear() + EPOCH_YEAR );
					// 	// Increment the month since 'Date's month is one-indexed when represented as a string.
					// 	hidden.encapsulated.setUTCMonth( hidden.encapsulated.getUTCMonth() + 1 );
					// 	// Increment the day (of month) since 'Date's day (of month) needs to be one-indexed, it will be subtracted when accessed.
					// 	hidden.encapsulated.setUTCDate( hidden.encapsulated.getUTCDate() + 1 );
					// 	// Add an extra timezone offset (by subtracting it) because it is implied in every case except this one.
					// 	const milliseconds_in_a_minute = 60 * 1000;
					// 	hidden.encapsulated.setTime( hidden.encapsulated.getTime() - (hidden.encapsulated.getTimezoneOffset() * milliseconds_in_a_minute));
					// 	if( '-−'.indexOf( basicOrExtendedDurationMatches[ 0 ]) > -1 )
					// 	{hidden.encapsulated.setTime( -hidden.encapsulated.getTime());}
					// }
					
					if( basicOrExtendedDurationMatches.length >= 7 )
					{
						let params = basicOrExtendedDurationMatches
							.map( function( each, n, every )
							{
								let parsed = parseFloat( each, 10 );
								return( parsed );
							});
						if( '-−'.indexOf( basicOrExtendedDurationMatches[ 0 ]) > -1 )
						{params[ 1 ] = -params[ 1 ];}
						params = params
							.filter( function( each, n, every )
							{return( !isNaN( each ));});
						// Add 'Date's epoch year.
						// Increment the day (of month) since 'Date's day (of month) needs to be one-indexed, it will be subtracted when accessed.
						switch( params.length )
						{
							case 2:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ]);break;
							case 3:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ], params[ 2 ] + 1 );break;
							case 4:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ], params[ 2 ] + 1, params[ 3 ]);break;
							case 5:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ], params[ 2 ] + 1, params[ 3 ], params[ 4 ]);break;
							case 6:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ], params[ 2 ] + 1, params[ 3 ], params[ 4 ], params[ 5 ]);break;
							case 7:default:hidden.encapsulated = new Date( params[ 0 ] + EPOCH_YEAR, params[ 1 ], params[ 2 ] + 1, params[ 3 ], params[ 4 ], params[ 5 ], params[ 6 ]);break;
						}
						const milliseconds_in_a_minute = 60 * 1000;
						hidden.encapsulated.setTime( hidden.encapsulated.getTime() - (hidden.encapsulated.getTimezoneOffset() * milliseconds_in_a_minute));
					}
					else
					{throw( new Error( ''.concat( "A datetime format duration should have (at least) six \"parts\": '", args0, "'." )));break;}
				}
			}
			else
			{hidden.encapsulated = new Date( args0 );}
			break;
		case 2:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ]);break;
		case 3:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ], args[ 2 ]);break;
		case 4:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ]);break;
		case 5:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ], args[ 4 ]);break;
		case 6:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ], args[ 4 ], args[ 5 ]);break;
		case 7:default:hidden.encapsulated = new Date( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ], args[ 4 ], args[ 5 ], args[ 6 ]);break;
		}
		//X // Remove the timezone offset (by adding it).
		//X // Corresponds with overridden 'getTime', 'getTimezoneOffset', and 'setTime'.
		//X hidden.encapsulated.setTime( hidden.encapsulated.getTime() + (hidden.encapsulated.getTimezoneOffset() * 60 * 1000));
		Object.defineProperties( this,
		{
			// Expose the ecapsulated 'Date' object as read-only.
			'encapsulated':
			{
				'get':function()
				{return( hidden.encapsulated );},
				'set':function( value )
				{throw( new TypeError( "'encapsulated' is read-only (to prevent assignment to 'Date' objects which are aboslute, not relative, datetimes)." ));},
			},
		});
	}
	//TimeDuration.prototype = Object.create( Date.prototype );
	TimeDuration.prototype = Object.create( Object.prototype );
	TimeDuration.prototype.constructor = TimeDuration;
	// The second "hyphen" is actually the "minus sign" (U+2212).
	Object.defineProperties( TimeDuration,
	{
		'dateRegExp':
		{
			'enumerable':true,
			'value':/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(.*?)?$/,
		},
		'durationBasicRegExp':
		{
			'enumerable':true,
			'value':/^(\+|\-|−)?P(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d+))?(.*?)?$/,
		},
		'durationExtendedRegExp':
		{
			'enumerable':true,
			'value':/^(\+|\-|−)?P(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(.*?)?$/,
		},
		// If the number is a decimal fraction, it may be specified with either a period/'full stop' or a comma.
		// This regular expression does not accommodate a trailing period/'full stop' or a comma.
		'durationNormalRegExp':
		{
			'enumerable':true,
			'value':/^(\+|\-|−)?P(\d*(?:[,\.]\d+)?W)|P(\d*(?:[,\.]\d+)?Y)?(\d*(?:[,\.]\d+)?M)?(\d*(?:[,\.]\d+)?D)?(?:(T)(\d*(?:[,\.]\d+)?H)?(\d*(?:[,\.]\d+)?M)?(\d*(?:[,\.]\d+)?S))?$/,
		},
	});
	TimeDuration.formatDate = function( dateOrTimeDuration )
	{
		// Do not use 'getWeeksOfYear' here since it is not a member of 'Date'.
		let yearDate = new Date( ''.concat( dateOrTimeDuration.getUTCFullYear()));
		const milliseconds_in_a_week = 7 * 24 * 60 * 60 * 1000;
		let values =
		{
			'D':
			{
				'Y':dateOrTimeDuration.getUTCFullYear(),
				'M':dateOrTimeDuration.getUTCMonth(),
				'W':(dateOrTimeDuration.getTime() - yearDate.getTime()) / milliseconds_in_a_week,
				'D':dateOrTimeDuration.getUTCDate(),
			},
		};
		let parts = [];
		if( values['D']['Y'] > 0 )
		{parts.push( ''.concat( values['D']['Y'], 'Y' ));}
		if( values['D']['M'] > 0 )
		{parts.push( ''.concat( values['D']['M'], 'M' ));}
		if( values['D']['D'] > 0 )
		{parts.push( ''.concat( values['D']['D'], 'D' ));}

		return( parts.join( '' ));
	};
	TimeDuration.formatTime = function( dateOrTimeDuration )
	{
		let values =
		{
			'T':
			{
				'H':dateOrTimeDuration.getUTCHours(),
				'M':dateOrTimeDuration.getUTCMinutes(),
				'S':dateOrTimeDuration.getUTCSeconds(),
			},
		};
		let parts = [];
		// Omit the time designator 'T' if all time components are absent (§5.5.3.1.d Format with time-unit designators).
		if( values['T']['H'] > 0 
			|| values['T']['M'] > 0 
			|| values['T']['S'] > 0 )
		{
			parts.push( 'T' );
			if( values['T']['M'] > 0 )
			{parts.push( ''.concat( values['T']['H'], 'H' ));}
			if( values['T']['M'] > 0 )
			{parts.push( ''.concat( values['T']['M'], 'M' ));}
			if( values['T']['S'] > 0 )
			{parts.push( ''.concat( values['T']['S'], 'S' ));}
		}
		return( parts.join( '' ));
	};
	/** @override */
	TimeDuration.UTC = function( year, month, day, hour, minute, second, millisecond )
	{
		// 'year' and 'month' are required.
		let epoch_ms = Date.UTC( year, month, day, hour, minute, second, millisecond );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.now = function()
	{
		let epoch_ms = Date.now();
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.parse = function( string )
	{
		let timeDuration = new TimeDuration( string );
		return( timeDuration );
	};
	/** @override */
	TimeDuration.prototype.getDate = function()
	{
		let value = this.encapsulated.getDate() - 1;
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getDay = function()
	{
		let value = this.encapsulated.getUTCDay();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getFullYear = function()
	{
		let value = this.encapsulated.getFullYear() - EPOCH_YEAR;
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getHours = function()
	{
		let value = this.getUTCHours();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getMilliseconds = function()
	{
		let value = this.getUTCMilliseconds();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getMinutes = function()
	{
		let value = this.getUTCMinutes();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getMonth = function()
	{
		let value = this.getUTCMonth();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getSeconds = function()
	{
		let value = this.getUTCSeconds();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getTime = function()
	{
		const milliseconds_in_a_minute = 60 * 1000;
		let value = this.encapsulated.getTime() - (this.encapsulated.getTimezoneOffset() * milliseconds_in_a_minute);
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getTimezoneOffset = function()
	{return( 0 );};
	/** @override */
	TimeDuration.prototype.getUTCDate = function()
	{
		let value = this.encapsulated.getUTCDate() - 1;
		return( value );
	};
	/** @override
	* @return number (integer) that is the remainder of days in a week, when used in conjuction with the number of weeks in a duration.
	* let number_of_weeks = Math.ceil( timeDuration.getWeeksOfYear());
	* let number_of_days = Math.floor( timeDuration.getWeeksOfYear()) + timeDuration.getUTCDay();
	*/
	TimeDuration.prototype.getUTCDay = function()
	{
		let value = this.encapsulated.getUTCDay();
		return( value );
	};
	/** @override */
	TimeDuration.prototype.getUTCFullYear = function()
	{
		let value = this.encapsulated.getUTCFullYear() - EPOCH_YEAR;
		return( value );
	};
	/** @return number (float) that is the remainder of weeks in a year, when used in conjuction with the number of years in a duration.
	* let number_of_weeks = Math.ceil( timeDuration.getWeeksOfYear());
	* let number_of_days = Math.floor( timeDuration.getWeeksOfYear()) + timeDuration.getUTCDay();
	*/
	TimeDuration.prototype.getWeeksOfYear = function()
	{
		// TODO: this needs to start on the first Sunday
		let yearDate = new Date( ''.concat( this.getUTCFullYear()));
		const milliseconds_in_a_week = 7 * 24 * 60 * 60 * 1000;
		let weeks = (this.getTime() - yearDate.getTime()) / milliseconds_in_a_week;
		return( weeks );
	};
	/** @override */
	TimeDuration.prototype.setDate = function( value )
	{
		// Day of month is one-indexed so a duration of 0 days would need to be 
		//	set to day 1 to have the correct number of milliseconds in the epoch.
		let epoch_ms = this.encapsulated.setDate( value + 1 );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setFullYear = function( value )
	{
		let epoch_ms = this.encapsulated.setFullYear( value + EPOCH_YEAR );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setHours = function( value )
	{
		let epoch_ms = this.setUTCHours( value );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setMilliseconds = function( value )
	{
		let epoch_ms = this.setUTCMilliseconds( value );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setMinutes = function( value )
	{
		let epoch_ms = this.setUTCMinutes( value );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setMonth = function( value )
	{
		let epoch_ms = this.setUTCMonth( value );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setSeconds = function( value )
	{
		let epoch_ms = this.setUTCSeconds( value );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setTime = function( value )
	{
		const milliseconds_in_a_minute = 60 * 1000;
		let epoch_ms = this.encapsulated.setTime( value + (this.encapsulated.getTimezoneOffset() * milliseconds_in_a_minute));
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setUTCDate = function( value )
	{
		// Day of month is one-indexed so a duration of 0 days would need to be 
		//	set to day 1 to have the correct number of milliseconds in the epoch.
		let epoch_ms = this.encapsulated.setUTCDate( value + 1 );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.setUTCFullYear = function( value )
	{
		let epoch_ms = this.encapsulated.setUTCFullYear( value + EPOCH_YEAR );
		return( epoch_ms );
	};
	/** @override */
	TimeDuration.prototype.toDateString = function()
	{
		let date_string = TimeDuration.formatDate( this );
		if( date_string === '' )
		{date_string = '0D';}
		return( ''.concat( 'P', date_string ));
	};
	/** @override */
	TimeDuration.prototype.toISOString = function()
	{
		let date_string = TimeDuration.formatDate( this );
		let time_string = TimeDuration.formatTime( this );
		return( ''.concat( 'P', date_string, time_string ));
	};
	/** @override */
	TimeDuration.prototype.toString = function()
	{
		let as_iso_string = this.toISOString();
		return( as_iso_string );
	};
	/** @override */
	TimeDuration.prototype.toTimeString = function()
	{
		let time_string = TimeDuration.formatTime( this );
		if( time_string === '' )
		{time_string = 'T0S';}
		return( ''.concat( 'P', time_string ));
	};
	// Getter functions.
	[
		//'getDate',	// Overridden elsewhere.
		//'getDay',	// Overridden elsewhere.
		//'getFullYear',	// Overridden elsewhere.
		//'getHours',	// Overridden elsewhere.
		//'getMilliseconds',	// Overridden elsewhere.
		//'getMinutes',	// Overridden elsewhere.
		//'getMonth',	// Overridden elsewhere.
		//'getSeconds',	// Overridden elsewhere.
		//'getTime',	// Overridden elsewhere.
		//'getTimezoneOffset',	// Overridden elsewhere.
		//'getUTCDate',	// Overridden elsewhere.
		//'getUTCDay',	// Overridden elsewhere.
		//'getUTCFullYear',	// Overridden elsewhere.
		'getUTCHours',
		'getUTCMilliseconds',
		'getUTCMinutes',
		'getUTCMonth',
		'getUTCSeconds',
		//X 'getYear',	// Deprecated.
	]
	.forEach( function proxy_getter( getter, g )
	{
		TimeDuration.prototype[ getter ] = function()
		{
			let value = this.encapsulated[ getter ]();
			return( value );
		};
	}, this );
	// Setter functions.
	[
		//'setDate',	// Overridden elsewhere.
		//'setFullYear',	// Overridden elsewhere.
		//'setHours',	// Overridden elsewhere.
		//'setMilliseconds',	// Overridden elsewhere.
		//'setMinutes',	// Overridden elsewhere.
		//'setMonth',	// Overridden elsewhere.
		//'setSeconds',	// Overridden elsewhere.
		//'setTime',	// Overridden elsewhere.
		//'setUTCDate',	// Overridden elsewhere.
		//'setUTCFullYear',	// Overridden elsewhere.
		'setUTCHours',
		'setUTCMilliseconds',
		'setUTCMinutes',
		'setUTCMonth',
		'setUTCSeconds',
		//X 'setYear',	// Deprecated.
	]
	.forEach( function proxy_setter( setter, s )
	{
		TimeDuration.prototype[ setter ] = function( value )
		{
			let epoch_ms = this.encapsulated[ setter ]( value );
			return( epoch_ms );
		};
	}, this );
	// Converter functions.
	[
		//'toDateString',	// Overridden elsewhere.
		//'toISOString',	// Overridden elsewhere.
		'toJSON',
		'toGMTString',
		'toLocaleDateString',
		//X 'toLocaleFormat',	// Deprecated.
		'toLocaleString',
		'toLocaleTimeString',
		//'toString',	// Overridden elsewhere.
		//'toTimeString',	// Overridden elsewhere.
		'toUTCString',
		'valueOf',
	]
	.forEach( function proxy_converter( converter, c )
	{
		TimeDuration.prototype[ converter ] = function()
		{
			let value = this.encapsulated[ converter ]();
			return( value );
		};
	}, this );
	// Not implemented functions.
	[
		'getYear',	// Deprecated.
		'setYear',	// Deprecated.
		'toGMTString',	// Deprecated.
		'toLocaleFormat',	// Non-standard.
		'toSource',	// Non-standard.
	]
	.forEach( function proxy_not_implemented( not_implemented, n )
	{
		TimeDuration.prototype[ not_implemented ] = function()
		{throw( new ReferenceError( ''.concat( "Function not implemented: '", not_implemented, "'." )));};
	}, this );
	///** @override */
	//TimeDuration.prototype[ Symbol.toPrimitive ] = function( hint )
	//{
	//	return(
	//		((['default', 'string'].includes( hint ))
	//			?(this.toString())
	//			:(this.valueOf())
	//		)
	//	);
	//};
	return( TimeDuration );
})( Date );
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
// @version v0.0.1 (2018-07-12)
// Examples:
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
//let iterand = Symbol('iterand');
//let subscript = Symbol('subscript');
class TimeIntervalIterator
{
	constructor( timeInterval, value_type )
	{
		if( !(timeInterval instanceof TimeInterval))
		{throw( new TypeError( ''.concat( "'timeInterval' must be an instance of 'TimeInterval'." )));}
		else if( !Object.values( TimeIntervalIterator.ValueType ).includes( value_type ))
		{throw( new TypeError( ''.concat( "Unexpected 'valueType' for iteration: '", value_type, "'." )));}
		let hidden =
		{
			'iterand':timeInterval,
			'iteration':null,
			'subscript':-1,
			'valueType':value_type,
		};
		Object.defineProperties( this,
		{
			'iterand':
			{
				'get':function()
				{return( hidden.iterand );},
				'set':function( value )
				{throw( new TypeError( "'iterand' is read-only." ));},
			},
			'iteration':
			{
				'get':function()
				{return( hidden.iteration );},
				'set':function( value )
				{hidden.iteration = value;},
			},
			'subscript':
			{
				'get':function()
				{return( hidden.subscript );},
				'set':function( value )
				{hidden.subscript = value;},
			},
			'valueType':
			{
				'get':function()
				{return( hidden.valueType );},
				'set':function( value )
				{throw( new TypeError( "'valueType' is read-only." ));},
			},
		});
	}
	get [Symbol.toStringTag]()
	{return( 'TimeInterval Iterator' );}
	static get ValueType()
	{
		return( Object.freeze(
		{
			'Entries':'entries',
			'Keys':'keys',
			'Values':'values',
		}));
	}
	next()
	{
		++this.subscript;
		let cursor = {'done':true, 'value':undefined};
		// Get the repetition count each time, not just one time in the constructor.
		let repetition_count = this.iterand.getRepetitionCount();
		if( repetition_count == -1 || (repetition_count >= 0 && repetition_count >= this.subscript))
		{
			// Get the start and end each time, not just one time in the constructor.
			let intervalStart = this.iterand.intervalStart;
			let intervalEnd = this.iterand.intervalEnd;
			let function_suffixes =
			[
				'UTCFullYear', 'UTCMonth', 'UTCDate',
				'UTCHours', 'UTCMinutes', 'UTCSeconds', 'UTCMilliseconds',
			];
			if( intervalStart instanceof Date && intervalEnd instanceof TimeDuration )
			{
				// Start of with an epoch zero date and add/subtract each time unit individually.
				this.iteration = new Date( 0 );
				function_suffixes.forEach( function modify_units_of_time_individually( suffix, s )
				{
					let delta_value = this.subscript * intervalEnd['get'.concat( suffix )]();
					let new_value = intervalStart['get'.concat( suffix )]() + delta_value;
					this.iteration['set'.concat( suffix )]( new_value );
				}, this );
			}
			else if( intervalStart instanceof TimeDuration && (intervalEnd instanceof Date || intervalEnd === null))
			{
				if( intervalEnd === null )
				{
					// I still do not understand what this combination means.
				}
				else if( intervalEnd instanceof Date )
				{
					// Start of with an epoch zero date and add/subtract each time unit individually.
					this.iteration = new Date( 0 );
					function_suffixes.forEach( function modify_units_of_time_individually( suffix, s )
					{
						let delta_value = this.subscript * intervalStart['get'.concat( suffix )]();
						let new_value = intervalEnd['get'.concat( suffix )]() - delta_value;
						this.iteration['set'.concat( suffix )]( new_value );
					}, this );
				}
			}
			else if( intervalStart instanceof Date && intervalEnd instanceof Date )
			{
				// I still do not understand what this combination means.
			}
			else
			{
				// error
			}
			// Update 'cursor' properties.
			cursor.done = false;
			switch( this.valueType )
			{
				case TimeIntervalIterator.ValueType.Entries:cursor.value = [this.subscript, this.iteration];break;
				case TimeIntervalIterator.ValueType.Keys:cursor.value = this.subscript;break;
				case TimeIntervalIterator.ValueType.Values:cursor.value = this.iteration;break;
			}
		}
		return( cursor );
	}
}
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
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
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
(module || {'exports':{}}).exports.TimeDuration = TimeDuration;
(module || {'exports':{}}).exports.TimeIntervalIterator = TimeIntervalIterator;
(module || {'exports':{}}).exports.TimeInterval = TimeInterval;
