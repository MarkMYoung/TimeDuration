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
(module || {'exports':{}}).exports = TimeDuration;
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
