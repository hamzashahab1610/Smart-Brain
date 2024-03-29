import React, { Component } from 'react';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';
import Rank from './Components/Rank/Rank';
import Clarifai from 'clarifai';
import './App.css';
import SignIn from './Components/SignIn/SignIn'
import Register from './Components/Register/Register'
import 'tachyons';
import Particles from 'react-particles-js';

const particlesOptions = {
	particles: {
		number: {
			value: 150,
			density: {
				enable: true,
				value_area: 800
			}
		}
	}
}

const initialState = {
  input: ' ',
  imageUrl: ' ',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',

  }
};

const app = new Clarifai.App({
	apiKey: '24b767c615ed41bb8b141a2b0ea16eca'
});

class App extends Component {
	constructor() {
		super();
    this.state = initialState;
		}

	loadUser = (data) => {
		this.setState({user: {
			id: data.id,
			name: data.name,
			email: data.email,
			entries: data.entries,
			joined: data.joined,}
		})
	}

	calculateFaceLocation = (data) => {
		const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
		const image = document.getElementById('inputimage');
		const width = Number(image.width);
		const height = Number(image.height);
		//console.log(width, height);
		return {
			leftCol: clarifaiFace.left_col * width,
			topRow: clarifaiFace.top_row * height,
			rightCol: width - (clarifaiFace.right_col * width),
			bottomRow: height - (clarifaiFace.bottom_row * height)
		}
	}

	displayFaceBox = (box) => {
		console.log(box);
		this.setState({ box: box })
	}

	onInputChange = (event) => {
		this.setState({ input: event.target.value });
	}

	onRouteChange = (route) => {
		if (route === 'signout') {
			this.setState(initialState)
		}
		else if (route === 'home') {
			this.setState({isSignedIn: true})
		}
		this.setState({ route: route });
	}

	onButtonSubmit = () => {
		console.log('click');
		this.setState({ imageUrl: this.state.input });
		app.models.predict(
			Clarifai.FACE_DETECT_MODEL,
			this.state.input)
			.then(response => {
				if (response) {
                    fetch('https://dry-basin-77991.herokuapp.com/image', {
						method: 'put',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							id: this.state.user.id
						})
					})
						.then(response => response.json())
            .then(count => { this.setState(Object.assign(this.state.user, { entries: count })) })
          .catch(console.log)
				}
				this.displayFaceBox(this.calculateFaceLocation(response))
			})
			
			.catch(error => console.log(error));
	};

	render() {
		return (
			<div className="App">
				<Particles className='particles'
					params={particlesOptions}
				/>
				<Navigation isSignedIn={this.state.isSignedIn} onRouteChange={this.onRouteChange} />
				{this.state.route === 'home'
					? <div>
						<Logo />
						<Rank
							name={this.state.user.name}
							entries={this.state.user.entries}
						/>
						<ImageLinkForm
							onInputChange={this.onInputChange}
							onButtonSubmit={this.onButtonSubmit}
						/>
						<FaceRecognition box={this.state.box} imageUrl={this.state.imageUrl} />
					</div>
					: (
						this.state.route === 'signin' 
							? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
							:
							(
								this.state.route === 'signout'
									? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
									: <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
							)
							
					)
				}
			</div>
		);
	}
}
export default App;
