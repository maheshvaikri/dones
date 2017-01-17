/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import classNames from 'classnames';
import { last, map, filter, includes } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import DoneStatus from 'components/done-status';
import DoneInputTextarea from './textarea';
import { createDone, updateDone, deleteDone } from 'state/dones/actions';
import { translate } from 'lib/i18n';
import { getTags } from 'state/selectors';

class DoneInput extends Component {
	static defaultProps = {
		initialDone: true,
		initialText: '',
		onCancel: () => {},
		onSubmit: () => {}
	};

	constructor( props ) {
		super( ...arguments );

		this.state = {
			done: props.initialDone,
			text: props.initialText
		};
	}

	componentDidMount() {
		this.attachEventHandler();
	}

	componentDidUpdate() {
		this.attachEventHandler();
	}

	componentWillUnmount() {
		document.removeEventListener( 'click', this.checkClickOutside );
	}

	attachEventHandler() {
		if ( this.isEditing() ) {
			document.addEventListener( 'click', this.checkClickOutside, true );
		}
	}

	isEditing() {
		return Number.isInteger( this.props.index );
	}

	getTagFragment( textarea ) {
		const { selectionStart, selectionEnd, value } = textarea;
		if ( selectionStart !== selectionEnd ) {
			return null;
		}

		const word = last( value.substr( 0, selectionStart ).split( ' ' ) );
		if ( '#' !== word[ 0 ] ) {
			return null;
		}

		return word.substr( 1 );
	}

	checkClickOutside = ( event ) => {
		if ( this.isEditing() && this.form && ! this.form.contains( event.target ) ) {
			this.props.onCancel();
		}
	};

	setFormRef = ( component ) => {
		this.form = component;
	};

	toggleStatus = ( done ) => {
		this.setState( { done } );
	};

	setText = ( event ) => {
		const text = event.target.value.replace( /[\n\r]/g, '' );

		this.setState( {
			text,
			tagFragment: this.getTagFragment( event.target )
		} );
	};

	insertSuggestion = ( suggestion ) => {
		const { tagFragment, text } = this.state;
		if ( ! tagFragment ) {
			return;
		}

		this.setState( {
			text: text.substr( 0, text.length - tagFragment.length ) + suggestion + ' ',
			tagFragment: null
		} );
	};

	maybeSubmit = ( event ) => {
		switch ( event.keyCode ) {
			case 13: // Enter
				this.submit( event );
				break;

			case 27: // Escape
				this.props.onCancel();
				break;
		}
	};

	submit = ( event ) => {
		const { date, index, initialText, initialDone } = this.props;
		const { done } = this.state;
		const text = this.state.text.trim();

		if ( event ) {
			event.preventDefault();
		}

		if ( text === initialText && done === initialDone ) {
			return;
		}

		if ( this.isEditing() ) {
			if ( text ) {
				this.props.updateDone( date, index, text, done );
			} else if ( confirm( translate( 'Are you sure you want to delete this done?' ) ) ) {
				this.props.deleteDone( date, index );
			}
		} else if ( text ) {
			this.props.createDone( date, text, done );
		}

		this.props.onSubmit();

		this.setState( {
			text: this.constructor.defaultProps.initialText,
			tagFragment: null
		} );
	};

	selectText( event ) {
		event.target.select();
	}

	render() {
		const { className, onCancel, selectionOffset, tags } = this.props;
		const { text, tagFragment } = this.state;
		const classes = classNames( 'done-input', className );
		const actions = [ {
			type: 'submit',
			primary: true,
			children: translate( 'Submit' ),
			disabled: text.length === 0
		} ];

		if ( this.isEditing() ) {
			actions.push( {
				onClick: onCancel,
				children: translate( 'Cancel' )
			} );
		}

		let suggestions;
		if ( tagFragment ) {
			// Find by fragment included in tag
			suggestions = filter( tags, ( tag ) => includes( tag, tagFragment ) );

			// Sort by index of fragment in tag
			suggestions.sort( ( a, b ) => a.indexOf( tagFragment ) - b.indexOf( tagFragment ) );
		}

		return (
			<form
				ref={ this.setFormRef }
				className={ classes }
				onSubmit={ this.submit }>
				<DoneStatus
					onToggle={ this.toggleStatus }
					done={ this.state.done } />
				<DoneInputTextarea
					value={ text }
					onInput={ this.setText }
					onKeyDown={ this.maybeSubmit }
					onSuggestionSelected={ this.insertSuggestion }
					selectionOffset={ selectionOffset }
					rows="1"
					suggestions={ suggestions }
					placeholder={ translate( 'What did you get done today?' ) }
					autoFocus />
				<div className="done-input__actions">
					{ map( actions, ( action, i ) => (
						<Button
							key={ [ 'action', i ].join() }
							className="done-input__action"
							{ ...action } />
					) ) }
				</div>
			</form>
		);
	}
}

export default connect(
	( state ) => ( {
		tags: getTags( state )
	} ),
	{
		createDone,
		updateDone,
		deleteDone
	}
)( DoneInput );
