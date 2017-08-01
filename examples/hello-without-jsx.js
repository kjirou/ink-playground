const {h, render, Component} = require('ink');

class Counter extends Component {
	constructor() {
		super();

		this.state = {
			i: 0
		};
	}

	render(props, state) {
		return `Iteration #${state.i}`;
	}

	componentDidMount() {
		this.timer = setInterval(() => {
			this.setState({
				i: this.state.i + 1
			});
		}, 100);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}
}

const unmount = render(h(Counter));

setTimeout(() => {
	// Enough counting
	unmount();
}, 1000);
