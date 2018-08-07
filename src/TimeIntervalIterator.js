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
(module || {'exports':{}}).exports = TimeIntervalIterator;
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
