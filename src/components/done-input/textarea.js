/**
 * External dependencies
 */
import { h, Component } from 'preact';
import autosize from 'autosize';
import caret from 'textarea-caret';

/**
 * Internal dependencies
 */
import PopoverMenu from 'components/popover-menu';

export default class DoneInputTextarea extends Component {
	static defaultProps = {
		onSuggestionSelected: () => {},
		onInput: () => {}
	}

	componentDidMount() {
		const { autoFocus, selectionOffset } = this.props;

		if ( autoFocus ) {
			this.textarea.focus();
		}

		if ( selectionOffset ) {
			const [ start, stop ] = selectionOffset;
			this.textarea.setSelectionRange( start, stop );
		}

		autosize( this.textarea );
	}

	componentWillUnmount() {
		autosize.destroy( this.textarea );
	}

	componentDidUpdate( prevProps ) {
		const { value, selectionOffset } = this.props;

		if ( value !== prevProps.value ) {
			this.resize();
		}

		if ( selectionOffset && selectionOffset !== prevProps.selectionOffset ) {
			const [ start, stop ] = selectionOffset;
			this.textarea.setSelectionRange( start, stop );
		}
	}

	resize() {
		autosize.update( this.textarea );
	}

	setRef = ( textarea ) => this.textarea = textarea;

	setCaretOffset = ( event ) => {
		// Calculate caret offset for use in positioning suggestions menu
		const { target } = event;
		const { lineHeight } = window.getComputedStyle( target );
		let { left, top } = caret( target, target.selectionEnd );
		left -= 13;
		top += parseInt( lineHeight, 10 ) - target.clientHeight;
		this.setState( {
			style: {
				transform: `translate( ${ left }px, ${ top }px )`
			}
		} );

		this.props.onInput( event );
	};

	onSelect = ( suggestion ) => {
		this.props.onSuggestionSelected( suggestion, this.textarea.selectionStart );
	};

	render() {
		const { suggestions } = this.props;
		const { style } = this.state;

		return (
			<div className="done-input__textarea">
				<textarea
					ref={ this.setRef }
					{ ...this.props }
					onInput={ this.setCaretOffset }
					className="done-input__textarea-input" />
				<PopoverMenu
					position="bottom-left"
					selectKeyCode={ 9 }
					onSelect={ this.onSelect }
					items={ suggestions }
					style={ style } />
			</div>
		);
	}
}
